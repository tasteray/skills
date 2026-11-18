import { describe, expect, it } from 'vitest'
import { env, exports } from 'cloudflare:workers'
import { hmacSha256, toHex } from '../src/crypto'
import { ALICE, BOB, commentPayload, issuePayload } from './fixtures'

async function post(payload: unknown, opts: { secret?: string; delivery?: string } = {}) {
  const body = JSON.stringify(payload)
  const sig = toHex(await hmacSha256(opts.secret ?? 'test-webhook-secret', body))
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Linear-Signature': sig }
  if (opts.delivery) headers['Linear-Delivery'] = opts.delivery
  return exports.default.fetch('https://hub.test/linear/webhook', { method: 'POST', headers, body })
}

const TEAM = { id: '29062cef-57b2-473f-9363-54166b22ac17', key: 'IC', name: 'InterClaude' }

describe('POST /linear/webhook', () => {
  it('rejects bad signatures and stale timestamps', async () => {
    const p = issuePayload({ state: 'Zatwierdzone', prevStateId: 'x', assigneeId: ALICE, team: TEAM })
    expect((await post(p, { secret: 'wrong' })).status).toBe(401)
    expect((await post({ ...p, webhookTimestamp: Date.now() - 10 * 60_000 })).status).toBe(401)
  })

  it('queues task_approved for the assignee, de-duplicates deliveries, then routes comments via the cached issue', async () => {
    const hub = env.USER_HUB.get(env.USER_HUB.idFromName(ALICE))
    const p = issuePayload({ state: 'Zatwierdzone', prevStateId: 'x', assigneeId: ALICE, creatorId: BOB, team: TEAM, id: 'wh-issue-1', identifier: 'IC-9' })
    expect((await post(p, { delivery: 'd-1' })).status).toBe(200)
    expect(await (await post(p, { delivery: 'd-1' })).json()).toMatchObject({ duplicate: true })
    const pending = await hub.pending()
    expect(pending.filter((e) => e.issue === 'IC-9').map((e) => e.kind)).toEqual(['task_approved'])

    // Assignee asks the requester a question: goes to Bob.
    const c = commentPayload({ authorId: ALICE, authorName: 'Alice', issueId: 'wh-issue-1', body: 'Pytanie do Claude (Bob): który wariant?' })
    expect((await post(c)).status).toBe(200)
    const bob = await env.USER_HUB.get(env.USER_HUB.idFromName(BOB)).pending()
    expect(bob.find((e) => e.issue === 'IC-9')).toMatchObject({ kind: 'comment', actor: 'Alice', comment: 'Pytanie do Claude (Bob): który wariant?' })
  })

  it('ignores other teams and logs the decision for /debug/recent', async () => {
    const p = issuePayload({ state: 'Zatwierdzone', prevStateId: 'x', assigneeId: ALICE, team: { id: 'team-tr', key: 'TR', name: 'TasteRay' }, identifier: 'TR-1' })
    expect((await post(p)).status).toBe(200)
    expect((await exports.default.fetch('https://hub.test/debug/recent')).status).toBe(404)
    const res = await exports.default.fetch('https://hub.test/debug/recent', { headers: { Authorization: 'Bearer test-debug-token' } })
    const body = (await res.json()) as { log: { line: string }[] }
    expect(body.log.some((l) => l.line.includes('other team'))).toBe(true)
  })

  it('claude-slack tasks are skipped without SLACK_BOT_TOKEN, not failed', async () => {
    const p = issuePayload({ state: 'Zatwierdzone', prevStateId: 'x', assigneeId: ALICE, team: TEAM, labelIds: ['d3d4ec48-f359-453a-ab1f-a836b0d7c3b4'], labels: ['interclaude-slack'], identifier: 'IC-10' })
    expect((await post(p)).status).toBe(200)
    const res = await exports.default.fetch('https://hub.test/debug/recent', { headers: { Authorization: 'Bearer test-debug-token' } })
    const body = (await res.json()) as { log: { line: string }[] }
    expect(body.log.some((l) => l.line.includes('IC-10') && l.line.includes('slack: skipped'))).toBe(true)
  })
})

describe('GET /health', () => {
  it('reports configuration without secrets', async () => {
    const res = await exports.default.fetch('https://hub.test/health')
    expect(await res.json()).toEqual({ ok: true, service: 'interclaude-hub', configured: { webhook: true, login: true, slack: false } })
  })
})
