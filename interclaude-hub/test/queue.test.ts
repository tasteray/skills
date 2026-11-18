import { describe, expect, it } from 'vitest'
import { env, exports } from 'cloudflare:workers'
import { runInDurableObject } from 'cloudflare:test'
import type { HubEvent } from '../src/events'
import { issueToken } from '../src/tokens'
import type { UserHub } from '../src/user-hub'
import { BOB } from './fixtures'

let n = 0
function ev(kind: HubEvent['kind'] = 'task_approved'): HubEvent {
  n++
  return { id: `ev-${n}`, kind, issue: `IC-${n}`, issue_id: `i-${n}`, title: 't', url: 'u', state: 'Zatwierdzone', actor: 'a', ts: new Date().toISOString() }
}

function hubFor(name: string) {
  return env.USER_HUB.get(env.USER_HUB.idFromName(name))
}

async function connect(userId: string) {
  const hub = hubFor(userId)
  const { token, hash } = await issueToken(userId)
  await hub.addToken(hash, 'x')
  const res = await exports.default.fetch('https://hub.test/ws', { headers: { Upgrade: 'websocket', Authorization: `Bearer ${token}` } })
  expect(res.status).toBe(101)
  const ws = res.webSocket!
  const messages: { type: string; event?: HubEvent; pending?: number }[] = []
  ws.addEventListener('message', (m) => {
    messages.push(JSON.parse(m.data as string))
  })
  ws.accept()
  return { ws, messages, token }
}

const tick = () => new Promise((r) => setTimeout(r, 50))

describe('offline queue', () => {
  it('stores events while offline, serves /inbox, and deletes on ack', async () => {
    const user = '00000000-0000-4000-8000-000000000101'
    const hub = hubFor(user)
    const a = ev()
    const b = ev('comment')
    expect(await hub.enqueue(a)).toEqual({ delivered: false, pending: 1 })
    await hub.enqueue(b)
    await hub.enqueue(a) // same id twice is stored once
    expect((await hub.pending()).map((e) => e.id)).toEqual([a.id, b.id])
    expect(await hub.ack([a.id, 'unknown'])).toBe(1)
    expect((await hub.pending()).map((e) => e.id)).toEqual([b.id])
  })

  it('keeps at most 200 events, dropping the oldest', async () => {
    const hub = hubFor('00000000-0000-4000-8000-000000000102')
    const ids: string[] = []
    for (let i = 0; i < 205; i++) {
      const e = ev()
      ids.push(e.id)
      await hub.enqueue(e)
    }
    const pending = await hub.pending()
    expect(pending).toHaveLength(200)
    expect(pending[0]!.id).toBe(ids[5])
  })

  it('drops events older than 7 days', async () => {
    const hub = hubFor('00000000-0000-4000-8000-000000000103')
    const old = ev()
    await hub.enqueue(old)
    await runInDurableObject(hub, async (_i: UserHub, state) => {
      state.storage.sql.exec(`UPDATE events SET created_at = ?`, Date.now() - 8 * 24 * 60 * 60 * 1000)
    })
    const fresh = ev()
    await hub.enqueue(fresh)
    expect((await hub.pending()).map((e) => e.id)).toEqual([fresh.id])
  })

  it('flushes pending events on connect and pushes new ones live; ack over the socket clears them', async () => {
    const user = '00000000-0000-4000-8000-000000000104'
    const hub = hubFor(user)
    const offline = ev()
    await hub.enqueue(offline)
    const c = await connect(user)
    await tick()
    expect(c.messages[0]).toEqual({ type: 'hello', pending: 1 })
    expect(c.messages[1]).toMatchObject({ type: 'event', event: { id: offline.id } })
    const live = ev()
    expect((await hub.enqueue(live)).delivered).toBe(true)
    await tick()
    expect(c.messages.at(-1)).toMatchObject({ type: 'event', event: { id: live.id } })
    c.ws.send(JSON.stringify({ type: 'ack', ids: [offline.id, live.id] }))
    await tick()
    expect(await hub.pending()).toHaveLength(0)
    c.ws.close()
  })

  it('pushes each event to the newest connection only', async () => {
    const user = '00000000-0000-4000-8000-000000000105'
    const hub = hubFor(user)
    const first = await connect(user)
    await tick()
    const second = await connect(user)
    await tick()
    expect(first.messages.at(-1)).toEqual({ type: 'standby' })
    const e = ev()
    await hub.enqueue(e)
    await tick()
    expect(second.messages.some((m) => m.event?.id === e.id)).toBe(true)
    expect(first.messages.some((m) => m.event?.id === e.id)).toBe(false)
    first.ws.close()
    second.ws.close()
  })

  it('/inbox and /inbox/ack work over HTTP', async () => {
    const hub = hubFor(BOB)
    const { token, hash } = await issueToken(BOB)
    await hub.addToken(hash, 'Bob')
    const e = ev('task_ready_for_review')
    await hub.enqueue(e)
    const auth = { Authorization: `Bearer ${token}` }
    const inbox = (await (await exports.default.fetch('https://hub.test/inbox', { headers: auth })).json()) as { events: HubEvent[] }
    expect(inbox.events.map((x) => x.id)).toContain(e.id)
    const ack = await exports.default.fetch('https://hub.test/inbox/ack', { method: 'POST', headers: auth, body: JSON.stringify({ ids: [e.id] }) })
    expect(await ack.json()).toEqual({ acked: 1 })
  })
})
