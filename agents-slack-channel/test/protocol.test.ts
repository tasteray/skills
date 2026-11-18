import { describe, expect, test } from 'bun:test';
import {
	agentNameFromDisplayName,
	endStatus,
	formatOutgoing,
	hasMarkerFor,
	isAddressedTo,
	mentionsUser,
	ProtocolError,
	stripProtocol,
} from '../src/protocol.ts';

describe('marker parsing', () => {
	test('matches the exact marker', () => {
		expect(hasMarkerFor('[do: Claude (Goo)] hej', 'Goo')).toBe(true);
	});
	test('is case-insensitive and tolerant of spaces', () => {
		expect(hasMarkerFor('[DO:claude( goo )] hej', 'Goo')).toBe(true);
		expect(hasMarkerFor('cos tam [ do : CLAUDE (Goo) ]', 'Goo')).toBe(true);
	});
	test('does not match another agent or a prefix of the name', () => {
		expect(hasMarkerFor('[do: Claude (Ola)] hej', 'Goo')).toBe(false);
		expect(hasMarkerFor('[do: Claude (Goofy)] hej', 'Goo')).toBe(false);
		expect(hasMarkerFor('do: Claude (Goo) bez nawiasu', 'Goo')).toBe(false);
	});
	test('escapes regex characters in the name', () => {
		expect(hasMarkerFor('[do: Claude (A.B)]', 'A.B')).toBe(true);
		expect(hasMarkerFor('[do: Claude (AxB)]', 'A.B')).toBe(false);
	});
	test('detects @-mentions of the bot user', () => {
		expect(mentionsUser('hej <@U123> zrob', 'U123')).toBe(true);
		expect(mentionsUser('hej <@U123|claude-goo>', 'U123')).toBe(true);
		expect(mentionsUser('hej <@U1234>', 'U123')).toBe(false);
		expect(mentionsUser('hej <@U123>', undefined)).toBe(false);
	});
	test('isAddressedTo accepts marker or mention', () => {
		expect(isAddressedTo('<@UBOT> sprawdz', 'Goo', 'UBOT')).toBe(true);
		expect(isAddressedTo('[do: Claude (Goo)] sprawdz', 'Goo', 'UBOT')).toBe(true);
		expect(isAddressedTo('sprawdz', 'Goo', 'UBOT')).toBe(false);
	});
});

describe('status', () => {
	test('returns the last status token', () => {
		expect(endStatus('a [czekam]')).toBe('czekam');
		expect(endStatus('a [czekam] b [KONIEC]')).toBe('koniec');
		expect(endStatus('nic')).toBeNull();
	});
});

describe('formatting', () => {
	test('adds marker, signature and status', () => {
		expect(formatOutgoing({ to: 'Ola', text: 'Gotowe.', agentName: 'Goo', status: 'czekam' })).toBe(
			'[do: Claude (Ola)]\nGotowe.\n\nClaude (Goo) [czekam]'
		);
	});
	test('omits the marker when answering a person', () => {
		expect(formatOutgoing({ text: 'Hej', agentName: 'Goo', status: 'koniec' })).toBe(
			'Hej\n\nClaude (Goo) [koniec]'
		);
	});
	test('does not duplicate protocol tokens the model wrote itself', () => {
		const out = formatOutgoing({
			to: 'Ola',
			text: '[do: Claude (Ola)] Gotowe.\nClaude (Goo) [czekam]',
			agentName: 'Goo',
			status: 'koniec',
		});
		expect(out).toBe('[do: Claude (Ola)]\nGotowe.\n\nClaude (Goo) [koniec]');
	});
	test('rejects bad targets, empty and too long text', () => {
		expect(() => formatOutgoing({ to: 'O)la', text: 'x', agentName: 'Goo', status: 'czekam' })).toThrow(
			ProtocolError
		);
		expect(() => formatOutgoing({ text: '[czekam]', agentName: 'Goo', status: 'czekam' })).toThrow(
			ProtocolError
		);
		expect(() =>
			formatOutgoing({ text: 'x'.repeat(5000), agentName: 'Goo', status: 'czekam' })
		).toThrow(ProtocolError);
	});
	test('stripProtocol removes markers and statuses', () => {
		expect(stripProtocol('[do: Claude (X)] a [czekam]')).toBe('a');
	});
	test('reads the agent name from an app display name', () => {
		expect(agentNameFromDisplayName('Claude (Ola)')).toBe('Ola');
		expect(agentNameFromDisplayName('Ola')).toBeUndefined();
		expect(agentNameFromDisplayName(undefined)).toBeUndefined();
	});
});
