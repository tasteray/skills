import { describe, expect, test } from 'bun:test';
import { Gate, type InboundMessage, takeSlot } from '../src/gate.ts';

const CH = 'CAGENTS';
const ME = { botUserId: 'UME', botId: 'BME' };
const HUMAN = 'UHUMAN';
const OLA_AGENT = { userId: 'UOLABOT', botId: 'BOLA' };

function makeGate(overrides: Partial<ConstructorParameters<typeof Gate>[0]> = {}) {
	let t = 1_000_000;
	const clock = { now: () => t, advance: (ms: number) => (t += ms) };
	const gate = new Gate(
		{
			agentName: 'Goo',
			allowedChannelIds: new Set([CH]),
			allowedSenderIds: new Set([HUMAN, OLA_AGENT.userId]),
			maxAgentTurns: 6,
			rateLimitPerMinute: 100,
			now: clock.now,
			...overrides,
		},
		ME
	);
	return { gate, clock };
}

let tsCounter = 0;
function msg(partial: Partial<InboundMessage>): InboundMessage {
	tsCounter += 1;
	return { channel: CH, ts: `1700000000.${String(tsCounter).padStart(6, '0')}`, text: '', ...partial };
}
const toGoo = (extra = '') => `[do: Claude (Goo)] pytanie ${extra}`;
const fromOla = (text: string, threadTs = 'T1') => msg({ ...OLA_AGENT, text, threadTs });
const fromMe = (text: string, threadTs = 'T1') => msg({ userId: ME.botUserId, botId: ME.botId, text, threadTs });

describe('filtering', () => {
	test('forwards an allowlisted, addressed message', () => {
		const { gate } = makeGate();
		const d = gate.decide(msg({ userId: HUMAN, text: toGoo() }));
		expect(d.action).toBe('forward');
	});
	test('drops other channels, unknown senders, unaddressed and own messages', () => {
		const { gate } = makeGate();
		expect(gate.decide(msg({ channel: 'COTHER', userId: HUMAN, text: toGoo() }))).toEqual({
			action: 'drop',
			reason: 'channel',
		});
		expect(gate.decide(msg({ userId: 'USTRANGER', text: toGoo() }))).toEqual({
			action: 'drop',
			reason: 'sender',
		});
		expect(gate.decide(msg({ botId: 'BSTRANGER', text: toGoo() }))).toEqual({
			action: 'drop',
			reason: 'sender',
		});
		expect(gate.decide(msg({ userId: HUMAN, text: 'pytanie do wszystkich' }))).toEqual({
			action: 'drop',
			reason: 'not_addressed',
		});
		expect(gate.decide(fromMe(toGoo()))).toEqual({ action: 'drop', reason: 'self' });
	});
	test('drops edits, deletes and joins, accepts thread broadcasts', () => {
		const { gate } = makeGate();
		expect(gate.decide(msg({ userId: HUMAN, text: toGoo(), subtype: 'message_changed' })).action).toBe(
			'drop'
		);
		expect(gate.decide(msg({ userId: HUMAN, text: toGoo(), subtype: 'thread_broadcast' })).action).toBe(
			'forward'
		);
	});
	test('drops Socket Mode retries of the same message', () => {
		const { gate } = makeGate();
		const m = msg({ userId: HUMAN, text: toGoo() });
		expect(gate.decide(m).action).toBe('forward');
		expect(gate.decide({ ...m })).toEqual({ action: 'drop', reason: 'duplicate' });
	});
	test('accepts an @-mention of the bot user', () => {
		const { gate } = makeGate();
		expect(gate.decide(msg({ userId: HUMAN, text: '<@UME> zerknij' })).action).toBe('forward');
	});
	test('allowlist matches bot ids as well as bot user ids', () => {
		const { gate } = makeGate({ allowedSenderIds: new Set(['BOLA']) });
		expect(gate.decide(fromOla(toGoo())).action).toBe('forward');
	});
	test('reports the thread root for top-level messages', () => {
		const { gate } = makeGate();
		const m = msg({ userId: HUMAN, text: toGoo() });
		const d = gate.decide(m);
		expect(d.action === 'forward' && d.threadTs).toBe(m.ts);
	});
});

describe('loop counter', () => {
	test('escalates once after MAX_AGENT_TURNS agent messages, then drops', () => {
		const { gate } = makeGate({ maxAgentTurns: 4 });
		// agents alternate: Ola, me, Ola, me -> 4 agent turns
		expect(gate.decide(fromOla(toGoo('1'))).action).toBe('forward');
		gate.decide(fromMe('[do: Claude (Ola)] a'));
		expect(gate.decide(fromOla(toGoo('3'))).action).toBe('forward');
		gate.decide(fromMe('[do: Claude (Ola)] b'));
		const d = gate.decide(fromOla(toGoo('5')));
		expect(d.action).toBe('escalate');
		expect(d.action === 'escalate' && d.agentTurns).toBe(5);
		expect(gate.decide(fromOla(toGoo('6')))).toEqual({ action: 'drop', reason: 'loop_limit' });
	});
	test('counts agent messages addressed to other agents too', () => {
		const { gate } = makeGate({ maxAgentTurns: 2 });
		gate.decide(fromOla('[do: Claude (Kasia)] x'));
		gate.decide(fromOla('[do: Claude (Kasia)] y'));
		expect(gate.decide(fromOla(toGoo())).action).toBe('escalate');
	});
	test('an allowlisted human message resets the counter', () => {
		const { gate } = makeGate({ maxAgentTurns: 2 });
		gate.decide(fromOla(toGoo()));
		gate.decide(fromMe('a'));
		expect(gate.decide(fromOla(toGoo())).action).toBe('escalate');
		gate.decide(msg({ userId: HUMAN, text: 'dalej', threadTs: 'T1' }));
		expect(gate.snapshot(CH, 'T1')?.agentTurns).toBe(0);
		expect(gate.decide(fromOla(toGoo())).action).toBe('forward');
	});
	test('a non-allowlisted human does not reset the counter', () => {
		const { gate } = makeGate({ maxAgentTurns: 1 });
		gate.decide(fromOla(toGoo()));
		gate.decide(msg({ userId: 'USTRANGER', text: 'dalej', threadTs: 'T1' }));
		expect(gate.decide(fromOla(toGoo())).action).toBe('escalate');
	});
	test('threads are counted separately', () => {
		const { gate } = makeGate({ maxAgentTurns: 1 });
		gate.decide(fromOla(toGoo(), 'T1'));
		expect(gate.decide(fromOla(toGoo(), 'T2')).action).toBe('forward');
	});
	test('stops forwarding agent messages after [koniec], a human reopens', () => {
		const { gate } = makeGate();
		expect(gate.decide(fromOla(`${toGoo()} [koniec]`)).action).toBe('forward');
		expect(gate.decide(fromOla(toGoo()))).toEqual({ action: 'drop', reason: 'closed' });
		expect(gate.checkReply(CH, 'T1').ok).toBe(false);
		gate.decide(msg({ userId: HUMAN, text: 'jeszcze jedno', threadTs: 'T1' }));
		expect(gate.decide(fromOla(toGoo())).action).toBe('forward');
	});
	test('own [koniec] closes the thread', () => {
		const { gate } = makeGate();
		gate.decide(fromMe('[do: Claude (Ola)] ok [koniec]'));
		expect(gate.decide(fromOla(toGoo()))).toEqual({ action: 'drop', reason: 'closed' });
	});
	test('checkReply refuses at the limit and in other channels', () => {
		const { gate } = makeGate({ maxAgentTurns: 2 });
		expect(gate.checkReply(CH, 'T1').ok).toBe(true);
		gate.decide(fromOla(toGoo()));
		gate.decide(fromMe('x'));
		expect(gate.checkReply(CH, 'T1').ok).toBe(false);
		expect(gate.checkReply('COTHER', undefined).ok).toBe(false);
		expect(gate.checkReply(CH, undefined).ok).toBe(true);
	});
	test('markClosed blocks further replies', () => {
		const { gate } = makeGate();
		gate.markClosed(CH, 'T9');
		expect(gate.checkReply(CH, 'T9').ok).toBe(false);
	});
});

describe('rate limit', () => {
	test('takeSlot allows up to the limit per minute', () => {
		const times: number[] = [];
		expect(takeSlot(times, 0, 2)).toBe(true);
		expect(takeSlot(times, 1000, 2)).toBe(true);
		expect(takeSlot(times, 2000, 2)).toBe(false);
		expect(takeSlot(times, 60_000, 2)).toBe(true);
	});
	test('drops forwards over the per-thread limit and recovers after a minute', () => {
		const { gate, clock } = makeGate({ rateLimitPerMinute: 2 });
		const h = (t: string) => msg({ userId: HUMAN, text: toGoo(t), threadTs: 'T1' });
		expect(gate.decide(h('1')).action).toBe('forward');
		expect(gate.decide(h('2')).action).toBe('forward');
		expect(gate.decide(h('3'))).toEqual({ action: 'drop', reason: 'rate_limit' });
		expect(gate.decide(msg({ userId: HUMAN, text: toGoo(), threadTs: 'T2' })).action).toBe('forward');
		clock.advance(60_000);
		expect(gate.decide(h('4')).action).toBe('forward');
	});
	test('limits replies per thread', () => {
		const { gate } = makeGate({ rateLimitPerMinute: 1 });
		expect(gate.checkReply(CH, 'T1').ok).toBe(true);
		expect(gate.checkReply(CH, 'T1').ok).toBe(false);
	});
});
