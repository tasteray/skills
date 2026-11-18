import { describe, expect, test } from 'bun:test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigError, loadConfig, parseEnvFile, parseList, withEnvFile } from '../src/config.ts';

const base = {
	SLACK_APP_TOKEN: 'xapp-1-test',
	SLACK_BOT_TOKEN: 'xoxb-test',
	AGENT_NAME: 'Goo',
	ALLOWED_SENDER_IDS: 'U1, U2 ,UBOT',
};

describe('config', () => {
	test('applies defaults', () => {
		const c = loadConfig(base);
		expect([...c.allowedChannelIds]).toEqual(['C0CJECFD8QP']);
		expect([...c.allowedSenderIds]).toEqual(['U1', 'U2', 'UBOT']);
		expect(c.maxAgentTurns).toBe(6);
		expect(c.rateLimitPerMinute).toBe(5);
	});
	test('reads overrides', () => {
		const c = loadConfig({ ...base, ALLOWED_CHANNEL_IDS: 'C1,C2', MAX_AGENT_TURNS: '3' });
		expect([...c.allowedChannelIds]).toEqual(['C1', 'C2']);
		expect(c.maxAgentTurns).toBe(3);
	});
	test('reports every problem at once', () => {
		try {
			loadConfig({ SLACK_BOT_TOKEN: 'xoxp-user-token', MAX_AGENT_TURNS: '0' });
			throw new Error('expected ConfigError');
		} catch (e) {
			expect(e).toBeInstanceOf(ConfigError);
			const m = (e as Error).message;
			for (const key of ['SLACK_APP_TOKEN', 'SLACK_BOT_TOKEN', 'AGENT_NAME', 'ALLOWED_SENDER_IDS', 'MAX_AGENT_TURNS']) {
				expect(m).toContain(key);
			}
		}
	});
	test('rejects agent names that break the marker', () => {
		expect(() => loadConfig({ ...base, AGENT_NAME: 'Go(o)' })).toThrow(ConfigError);
	});
	test('parseList splits on commas and whitespace', () => {
		expect(parseList(' a, b  c,,')).toEqual(['a', 'b', 'c']);
		expect(parseList(undefined)).toEqual([]);
	});
	test('env file fills gaps, process env wins', () => {
		expect(parseEnvFile('# c\nexport A="1"\nB = \'2\'\nbad line\n')).toEqual({ A: '1', B: '2' });
		const dir = mkdtempSync(join(tmpdir(), 'asc-'));
		const file = join(dir, '.env');
		writeFileSync(file, 'AGENT_NAME=FromFile\nSLACK_APP_TOKEN=xapp-file\n');
		const env = withEnvFile({ AGENTS_SLACK_ENV_FILE: file, AGENT_NAME: 'FromEnv', SLACK_APP_TOKEN: '' });
		expect(env.AGENT_NAME).toBe('FromEnv');
		expect(env.SLACK_APP_TOKEN).toBe('xapp-file');
	});
});
