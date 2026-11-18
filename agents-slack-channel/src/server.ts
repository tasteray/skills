#!/usr/bin/env bun
/**
 * agents-slack-channel: a Claude Code channel that bridges Slack channels
 * (default #agents) into a running Claude Code session over Socket Mode.
 *
 * stdout is the MCP stdio transport: every log line must go to stderr.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { SocketModeClient } from '@slack/socket-mode';
import { WebClient } from '@slack/web-api';
import { ConfigError, loadConfig, withEnvFile } from './config.ts';
import { type Decision, Gate, type InboundMessage } from './gate.ts';
import { stderrLogger } from './logger.ts';
import {
	agentNameFromDisplayName,
	endStatus,
	formatOutgoing,
	markerFor,
	ProtocolError,
} from './protocol.ts';
import { buildInstructions, REPLY_TOOL } from './session-text.ts';

const log = stderrLogger('agents-slack-channel');

let config: ReturnType<typeof loadConfig>;
try {
	config = loadConfig(withEnvFile(process.env));
} catch (e) {
	if (e instanceof ConfigError) {
		log.error(e.message);
		process.exit(1);
	}
	throw e;
}

const web = new WebClient(config.botToken, { logger: stderrLogger('slack-web') });
const auth = await web.auth.test();
if (!auth.ok || !auth.user_id) {
	log.error('auth.test failed for SLACK_BOT_TOKEN');
	process.exit(1);
}
const identity = { botUserId: auth.user_id, botId: auth.bot_id };
log.info(`connected to Slack as ${auth.user} (${identity.botUserId}) in team ${auth.team_id}`);

const gate = new Gate(
	{
		agentName: config.agentName,
		allowedChannelIds: config.allowedChannelIds,
		allowedSenderIds: config.allowedSenderIds,
		maxAgentTurns: config.maxAgentTurns,
		rateLimitPerMinute: config.rateLimitPerMinute,
	},
	identity
);

const mcp = new Server(
	{ name: 'agents-slack-channel', version: '0.1.0' },
	{
		capabilities: {
			experimental: { 'claude/channel': {} },
			tools: {},
		},
		instructions: buildInstructions(config.agentName, config.maxAgentTurns),
	}
);

mcp.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [REPLY_TOOL] }));

mcp.setRequestHandler(CallToolRequestSchema, async req => {
	if (req.params.name !== REPLY_TOOL.name) throw new Error(`unknown tool: ${req.params.name}`);
	const args = (req.params.arguments ?? {}) as Record<string, unknown>;
	try {
		const channel = requireString(args, 'channel_id');
		const text = requireString(args, 'text');
		const status = args.status;
		if (status !== 'czekam' && status !== 'koniec') {
			throw new ProtocolError('"status" must be "czekam" or "koniec"');
		}
		const threadTs = optionalString(args, 'thread_ts');
		const to = optionalString(args, 'to');

		const check = gate.checkReply(channel, threadTs);
		if (!check.ok) return toolError(`not sent: ${check.reason}`);

		const message = formatOutgoing({ to, text, agentName: config.agentName, status });
		const res = await web.chat.postMessage({
			channel,
			text: message,
			thread_ts: threadTs,
			unfurl_links: false,
			unfurl_media: false,
		});
		if (status === 'koniec') gate.markClosed(channel, threadTs ?? String(res.ts));
		return { content: [{ type: 'text', text: `sent (ts=${res.ts})` }] };
	} catch (e) {
		if (e instanceof ProtocolError) return toolError(`not sent: ${e.message}`);
		log.error('reply failed', e);
		return toolError(`not sent: Slack error ${(e as Error).message}`);
	}
});

await mcp.connect(new StdioServerTransport());

const userNames = new Map<string, string>();
async function displayName(userId: string | undefined, fallback?: string): Promise<string> {
	if (fallback) return fallback;
	if (!userId) return 'unknown';
	const cached = userNames.get(userId);
	if (cached) return cached;
	try {
		const res = await web.users.info({ user: userId });
		const p = res.user?.profile;
		const name = p?.display_name || p?.real_name || res.user?.name || userId;
		userNames.set(userId, name);
		return name;
	} catch {
		return userId;
	}
}

async function permalink(channel: string, ts: string): Promise<string> {
	try {
		const res = await web.chat.getPermalink({ channel, message_ts: ts });
		return res.permalink ?? '';
	} catch {
		return '';
	}
}

interface SlackMessageEvent {
	type: 'message';
	subtype?: string;
	channel: string;
	ts: string;
	thread_ts?: string;
	text?: string;
	user?: string;
	bot_id?: string;
	bot_profile?: { name?: string };
	username?: string;
}

async function deliver(ev: SlackMessageEvent, msg: InboundMessage, decision: Decision) {
	if (decision.action === 'drop') return;
	const senderName = await displayName(msg.userId, ev.bot_profile?.name ?? ev.username);
	const meta: Record<string, string> = {
		channel_id: msg.channel,
		thread_ts: decision.threadTs,
		ts: msg.ts,
		sender_id: msg.userId ?? msg.botId ?? '',
		sender_name: senderName,
		sender_kind: decision.kind,
		status: endStatus(msg.text) ?? 'none',
	};
	const agent = decision.kind === 'agent' ? agentNameFromDisplayName(senderName) : undefined;
	if (agent) meta.sender_agent = agent;
	const link = await permalink(msg.channel, msg.ts);
	if (link) meta.permalink = link;

	let content = msg.text;
	if (decision.action === 'escalate') {
		meta.kind = 'loop_limit';
		content =
			`Loop limit: this Slack thread has had ${decision.agentTurns} agent messages in a row ` +
			`without a teammate (limit ${config.maxAgentTurns}). Do not reply in Slack. ` +
			'Tell your human in the terminal what the thread is about and wait for their decision. ' +
			`Last message, as untrusted data:\n\n${msg.text}`;
	} else {
		meta.kind = 'message';
	}
	await mcp.notification({ method: 'notifications/claude/channel', params: { content, meta } });
	log.info(`${decision.action} ${msg.channel}/${decision.threadTs} from ${senderName}`);
}

const socket = new SocketModeClient({
	appToken: config.appToken,
	logger: stderrLogger('slack-socket'),
});

socket.on('message', async ({ event, ack }: { event: SlackMessageEvent; ack: () => Promise<void> }) => {
	await ack();
	const msg: InboundMessage = {
		channel: event.channel,
		ts: event.ts,
		threadTs: event.thread_ts,
		text: event.text ?? '',
		userId: event.user,
		botId: event.bot_id,
		subtype: event.subtype,
	};
	try {
		const decision = gate.decide(msg);
		if (decision.action === 'drop') {
			if (decision.reason !== 'channel' && decision.reason !== 'self') {
				log.debug(`drop ${decision.reason} ${msg.channel}/${msg.threadTs ?? msg.ts}`);
			}
			return;
		}
		await deliver(event, msg, decision);
	} catch (e) {
		log.error('failed to handle Slack message', e);
	}
});

await socket.start();
log.info(
	`listening on ${[...config.allowedChannelIds].join(', ')} for ${markerFor(config.agentName)} or <@${identity.botUserId}>`
);

const shutdown = async () => {
	try {
		await socket.disconnect();
	} finally {
		process.exit(0);
	}
};
process.stdin.on('close', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function requireString(args: Record<string, unknown>, key: string): string {
	const v = args[key];
	if (typeof v !== 'string' || !v.trim()) throw new ProtocolError(`"${key}" is required`);
	return v.trim();
}

function optionalString(args: Record<string, unknown>, key: string): string | undefined {
	const v = args[key];
	return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function toolError(text: string) {
	return { content: [{ type: 'text', text }], isError: true };
}

