/**
 * Conversation protocol used in #agents:
 *   [do: Claude (Ola)]           addresses Ola's agent (case-insensitive)
 *   ...message...
 *   Claude (Goo) [czekam]        signature + status: waiting for an answer
 *   Claude (Goo) [koniec]        signature + status: the exchange is finished
 */

export type EndStatus = 'czekam' | 'koniec';

const MAX_MESSAGE_CHARS = 3900;

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function markerRegExp(name: string, flags = 'i'): RegExp {
	return new RegExp(`\\[\\s*do\\s*:\\s*claude\\s*\\(\\s*${escapeRegExp(name)}\\s*\\)\\s*\\]`, flags);
}

const ANY_MARKER = /\[\s*do\s*:\s*claude\s*\([^)\]]*\)\s*\]/gi;
const STATUS = /\[\s*(czekam|koniec)\s*\]/gi;

export function markerFor(name: string): string {
	return `[do: Claude (${name})]`;
}

export function hasMarkerFor(text: string, agentName: string): boolean {
	return markerRegExp(agentName).test(text);
}

/** True when the text @-mentions the given Slack user id (`<@U123>` or `<@U123|name>`). */
export function mentionsUser(text: string, userId: string | undefined): boolean {
	if (!userId) return false;
	return new RegExp(`<@${escapeRegExp(userId)}(\\|[^>]*)?>`).test(text);
}

export function isAddressedTo(text: string, agentName: string, botUserId?: string): boolean {
	return hasMarkerFor(text, agentName) || mentionsUser(text, botUserId);
}

/** Returns the last status token in the text, if any. */
export function endStatus(text: string): EndStatus | null {
	let last: EndStatus | null = null;
	for (const m of text.matchAll(STATUS)) {
		last = m[1].toLowerCase() as EndStatus;
	}
	return last;
}

/** Extracts the person name from an agent display name like "Claude (Ola)". */
export function agentNameFromDisplayName(displayName: string | undefined): string | undefined {
	if (!displayName) return undefined;
	const m = /claude\s*\(\s*([^)]+?)\s*\)/i.exec(displayName);
	return m ? m[1] : undefined;
}

/** Removes protocol tokens so the formatter can add them exactly once. */
export function stripProtocol(text: string, agentName?: string): string {
	let out = text.replace(ANY_MARKER, '').replace(STATUS, '');
	if (agentName) {
		// Drop a trailing signature line the model may have written itself.
		const sig = new RegExp(`\\n?\\s*claude\\s*\\(\\s*${escapeRegExp(agentName)}\\s*\\)\\s*$`, 'i');
		out = out.replace(sig, '');
	}
	return out.trim();
}

export interface OutgoingMessage {
	/** Name of the agent addressed, e.g. "Ola". Omit when answering a human. */
	to?: string;
	text: string;
	agentName: string;
	status: EndStatus;
}

export class ProtocolError extends Error {}

export function validateTarget(to: string): string {
	const name = to.trim();
	if (!name || name.length > 40 || /[[\]()\n]/.test(name)) {
		throw new ProtocolError(
			'"to" must be a short name without brackets or parentheses, e.g. "Ola"'
		);
	}
	return name;
}

export function formatOutgoing({ to, text, agentName, status }: OutgoingMessage): string {
	const body = stripProtocol(text, agentName);
	if (!body) throw new ProtocolError('"text" is empty');
	const lines: string[] = [];
	if (to !== undefined && to.trim() !== '') lines.push(markerFor(validateTarget(to)));
	lines.push(body, '', `Claude (${agentName}) [${status}]`);
	const out = lines.join('\n');
	if (out.length > MAX_MESSAGE_CHARS) {
		throw new ProtocolError(
			`message is ${out.length} characters, the limit is ${MAX_MESSAGE_CHARS}: shorten it`
		);
	}
	return out;
}
