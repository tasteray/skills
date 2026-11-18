import { endStatus, isAddressedTo } from './protocol.ts';

/** The subset of a Slack `message` event the gate looks at. */
export interface InboundMessage {
	channel: string;
	ts: string;
	threadTs?: string;
	text: string;
	userId?: string;
	botId?: string;
	subtype?: string;
}

/** Who this bridge posts as, from `auth.test` on the bot token. */
export interface Identity {
	botUserId: string;
	botId?: string;
}

export interface GateOptions {
	agentName: string;
	allowedChannelIds: Set<string>;
	allowedSenderIds: Set<string>;
	maxAgentTurns: number;
	rateLimitPerMinute: number;
	now?: () => number;
}

export type SenderKind = 'self' | 'agent' | 'human';

export type Decision =
	| { action: 'forward'; kind: SenderKind; threadTs: string }
	| { action: 'escalate'; kind: SenderKind; threadTs: string; agentTurns: number }
	| { action: 'drop'; reason: DropReason };

export type DropReason =
	| 'subtype'
	| 'channel'
	| 'duplicate'
	| 'self'
	| 'sender'
	| 'not_addressed'
	| 'closed'
	| 'loop_limit'
	| 'rate_limit';

export type ReplyCheck = { ok: true } | { ok: false; reason: string };

interface ThreadState {
	/** Consecutive agent messages since the last allowlisted human message. */
	agentTurns: number;
	/** Set after a [koniec] message, cleared by an allowlisted human message. */
	closed: boolean;
	/** Set once the session has been told to escalate this thread. */
	escalated: boolean;
	forwardTimes: number[];
	replyTimes: number[];
	lastActivity: number;
}

/** Plain messages, bot posts, "also send to channel" replies and messages with files. */
const ACCEPTED_SUBTYPES = new Set<string | undefined>([
	undefined,
	'bot_message',
	'thread_broadcast',
	'file_share',
]);

const WINDOW_MS = 60_000;
const THREAD_TTL_MS = 24 * 60 * 60_000;
const MAX_SEEN = 2000;

export class Gate {
	private readonly threads = new Map<string, ThreadState>();
	private readonly seen = new Set<string>();
	private readonly now: () => number;

	constructor(
		private readonly opts: GateOptions,
		private readonly identity: Identity
	) {
		this.now = opts.now ?? Date.now;
	}

	classify(msg: InboundMessage): SenderKind {
		const { botUserId, botId } = this.identity;
		if ((msg.userId && msg.userId === botUserId) || (msg.botId && botId && msg.botId === botId)) {
			return 'self';
		}
		if (msg.botId || msg.subtype === 'bot_message') return 'agent';
		return 'human';
	}

	isAllowedSender(msg: InboundMessage): boolean {
		const ids = this.opts.allowedSenderIds;
		return Boolean((msg.userId && ids.has(msg.userId)) || (msg.botId && ids.has(msg.botId)));
	}

	/**
	 * Updates the per-thread counters with this message (every message in an allowed
	 * channel counts, also ones addressed to other agents) and decides whether to
	 * forward it into the session.
	 */
	decide(msg: InboundMessage): Decision {
		if (!ACCEPTED_SUBTYPES.has(msg.subtype)) return drop('subtype');
		if (!this.opts.allowedChannelIds.has(msg.channel)) return drop('channel');

		const seenKey = `${msg.channel}:${msg.ts}`;
		if (this.seen.has(seenKey)) return drop('duplicate');
		this.remember(seenKey);

		const threadTs = msg.threadTs ?? msg.ts;
		const st = this.state(msg.channel, threadTs);
		const kind = this.classify(msg);
		const allowed = kind !== 'self' && this.isAllowedSender(msg);
		const wasClosed = st.closed;

		if (kind === 'human') {
			if (allowed) {
				st.agentTurns = 0;
				st.closed = false;
				st.escalated = false;
			}
		} else {
			st.agentTurns += 1;
		}
		if (endStatus(msg.text) === 'koniec') st.closed = true;

		if (kind === 'self') return drop('self');
		if (!allowed) return drop('sender');
		if (!isAddressedTo(msg.text, this.opts.agentName, this.identity.botUserId)) {
			return drop('not_addressed');
		}
		if (kind === 'agent') {
			if (wasClosed) return drop('closed');
			if (st.agentTurns > this.opts.maxAgentTurns) {
				if (st.escalated) return drop('loop_limit');
				st.escalated = true;
				return { action: 'escalate', kind, threadTs, agentTurns: st.agentTurns };
			}
		}
		if (!takeSlot(st.forwardTimes, this.now(), this.opts.rateLimitPerMinute)) {
			return drop('rate_limit');
		}
		return { action: 'forward', kind, threadTs };
	}

	/** Checks the loop and rate limits before the session posts into a thread. */
	checkReply(channel: string, threadTs: string | undefined): ReplyCheck {
		if (!this.opts.allowedChannelIds.has(channel)) {
			return { ok: false, reason: `channel ${channel} is not in ALLOWED_CHANNEL_IDS` };
		}
		if (!threadTs) return { ok: true };
		const st = this.state(channel, threadTs);
		if (st.closed) {
			return {
				ok: false,
				reason:
					'this thread was closed with [koniec]; a teammate must write in it before agents continue',
			};
		}
		if (st.agentTurns >= this.opts.maxAgentTurns) {
			return {
				ok: false,
				reason: `this thread reached ${this.opts.maxAgentTurns} agent messages without a human: stop and ask your human in the terminal`,
			};
		}
		if (!takeSlot(st.replyTimes, this.now(), this.opts.rateLimitPerMinute)) {
			return { ok: false, reason: 'reply rate limit for this thread reached, wait a minute' };
		}
		return { ok: true };
	}

	/** Marks a thread closed right after this agent posted [koniec] in it. */
	markClosed(channel: string, threadTs: string): void {
		this.state(channel, threadTs).closed = true;
	}

	/** Exposed for tests and diagnostics. */
	snapshot(channel: string, threadTs: string): Readonly<ThreadState> | undefined {
		return this.threads.get(`${channel}:${threadTs}`);
	}

	private state(channel: string, threadTs: string): ThreadState {
		const key = `${channel}:${threadTs}`;
		const now = this.now();
		let st = this.threads.get(key);
		if (!st) {
			if (this.threads.size > 500) this.prune(now);
			st = {
				agentTurns: 0,
				closed: false,
				escalated: false,
				forwardTimes: [],
				replyTimes: [],
				lastActivity: now,
			};
			this.threads.set(key, st);
		}
		st.lastActivity = now;
		return st;
	}

	private prune(now: number): void {
		for (const [key, st] of this.threads) {
			if (now - st.lastActivity > THREAD_TTL_MS) this.threads.delete(key);
		}
	}

	private remember(key: string): void {
		this.seen.add(key);
		if (this.seen.size > MAX_SEEN) {
			const oldest = this.seen.values().next().value;
			if (oldest !== undefined) this.seen.delete(oldest);
		}
	}
}

function drop(reason: DropReason): Decision {
	return { action: 'drop', reason };
}

/** Sliding one-minute window. Returns false when the window is full. */
export function takeSlot(times: number[], now: number, limit: number): boolean {
	while (times.length && now - times[0] >= WINDOW_MS) times.shift();
	if (times.length >= limit) return false;
	times.push(now);
	return true;
}
