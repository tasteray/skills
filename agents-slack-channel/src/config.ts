import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Default Slack channel the bridge listens to (#agents). */
export const DEFAULT_CHANNEL_IDS = ['C0CJECFD8QP'];
export const DEFAULT_MAX_AGENT_TURNS = 6;
export const DEFAULT_RATE_LIMIT_PER_MINUTE = 5;

export interface Config {
	appToken: string;
	botToken: string;
	agentName: string;
	allowedChannelIds: Set<string>;
	allowedSenderIds: Set<string>;
	maxAgentTurns: number;
	rateLimitPerMinute: number;
}

export class ConfigError extends Error {}

export type Env = Record<string, string | undefined>;

/** Default location of the optional env file, next to the official channel plugins' files. */
export function defaultEnvFilePath(): string {
	return join(homedir(), '.claude', 'channels', 'agents-slack-channel', '.env');
}

/** Splits a comma or whitespace separated list, dropping empty entries. */
export function parseList(value: string | undefined): string[] {
	if (!value) return [];
	return value
		.split(/[\s,]+/)
		.map(s => s.trim())
		.filter(Boolean);
}

/** Parses KEY=VALUE lines. Supports comments, `export ` prefixes and quoted values. */
export function parseEnvFile(content: string): Record<string, string> {
	const out: Record<string, string> = {};
	for (const raw of content.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line || line.startsWith('#')) continue;
		const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
		if (!m) continue;
		let value = m[2].trim();
		if (
			value.length >= 2 &&
			((value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'")))
		) {
			value = value.slice(1, -1);
		}
		out[m[1]] = value;
	}
	return out;
}

/**
 * Merges the env file (if present) under the process environment.
 * Values already set in the process environment win.
 */
export function withEnvFile(env: Env): Env {
	const path = env.AGENTS_SLACK_ENV_FILE || defaultEnvFilePath();
	if (!existsSync(path)) return env;
	const fromFile = parseEnvFile(readFileSync(path, 'utf8'));
	const merged: Env = { ...fromFile };
	for (const [k, v] of Object.entries(env)) {
		if (v !== undefined && v !== '') merged[k] = v;
	}
	return merged;
}

function parsePositiveInt(name: string, value: string | undefined, fallback: number): number {
	if (value === undefined || value.trim() === '') return fallback;
	const n = Number(value);
	if (!Number.isInteger(n) || n < 1) {
		throw new ConfigError(`${name} must be a positive integer, got "${value}"`);
	}
	return n;
}

export function loadConfig(env: Env): Config {
	const problems: string[] = [];
	const appToken = env.SLACK_APP_TOKEN?.trim() ?? '';
	const botToken = env.SLACK_BOT_TOKEN?.trim() ?? '';
	const agentName = env.AGENT_NAME?.trim() ?? '';

	if (!appToken.startsWith('xapp-')) {
		problems.push('SLACK_APP_TOKEN is missing or does not start with xapp-');
	}
	if (!botToken.startsWith('xoxb-')) {
		problems.push('SLACK_BOT_TOKEN is missing or does not start with xoxb-');
	}
	if (!agentName) {
		problems.push('AGENT_NAME is missing (for example AGENT_NAME=Goo)');
	} else if (/[[\]()\n]/.test(agentName) || agentName.length > 40) {
		problems.push('AGENT_NAME must be at most 40 characters and contain no brackets or parentheses');
	}

	const channelList = parseList(env.ALLOWED_CHANNEL_IDS);
	const allowedChannelIds = new Set(channelList.length ? channelList : DEFAULT_CHANNEL_IDS);
	const allowedSenderIds = new Set(parseList(env.ALLOWED_SENDER_IDS));
	if (allowedSenderIds.size === 0) {
		problems.push(
			'ALLOWED_SENDER_IDS is empty: list the Slack user ids of teammates and the bot user ids of their agents'
		);
	}

	let maxAgentTurns = DEFAULT_MAX_AGENT_TURNS;
	let rateLimitPerMinute = DEFAULT_RATE_LIMIT_PER_MINUTE;
	try {
		maxAgentTurns = parsePositiveInt('MAX_AGENT_TURNS', env.MAX_AGENT_TURNS, maxAgentTurns);
	} catch (e) {
		problems.push((e as Error).message);
	}
	try {
		rateLimitPerMinute = parsePositiveInt(
			'RATE_LIMIT_PER_MINUTE',
			env.RATE_LIMIT_PER_MINUTE,
			rateLimitPerMinute
		);
	} catch (e) {
		problems.push((e as Error).message);
	}

	if (problems.length) {
		throw new ConfigError(`agents-slack-channel configuration error:\n- ${problems.join('\n- ')}`);
	}

	return {
		appToken,
		botToken,
		agentName,
		allowedChannelIds,
		allowedSenderIds,
		maxAgentTurns,
		rateLimitPerMinute,
	};
}
