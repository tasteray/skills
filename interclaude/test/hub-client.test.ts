import { describe, expect, it } from 'bun:test'
import { HubClient } from '../src/hub-client.ts'
import type { HubEvent } from '../src/notify.ts'

const TOKEN = `ah1.aaaaaaaa-0000-4000-8000-000000000001.${'x'.repeat(43)}`
const ev = (id: string): HubEvent => ({ id, kind: 'task_approved', issue: 'IC-1', issue_id: 'i', title: 't', url: 'u', state: 'Zatwierdzone', actor: 'a', ts: 'now' })
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('HubClient', () => {
  it('connects with the bearer token, delivers events once, acks them, and reconnects after a drop', async () => {
    const acks: string[] = []
    let connections = 0
    let authHeader = ''
    const server = Bun.serve({
      port: 0,
      fetch(req, srv) {
        const u = new URL(req.url)
        if (u.pathname === '/me') return Response.json({ ok: true })
        authHeader = req.headers.get('Authorization') ?? ''
        return srv.upgrade(req) ? undefined : new Response('no', { status: 400 })
      },
      websocket: {
        open(ws) {
          connections++
          ws.send(JSON.stringify({ type: 'hello', pending: 1 }))
          ws.send(JSON.stringify({ type: 'event', event: ev('e1') }))
          ws.send(JSON.stringify({ type: 'event', event: ev('e1') }))
          if (connections === 1) setTimeout(() => ws.close(1011, 'drop'), 100)
        },
        message(_ws, m) {
          const msg = JSON.parse(String(m))
          if (msg.type === 'ack') acks.push(...msg.ids)
        },
      },
    })
    const got: string[] = []
    const client = new HubClient({
      hubUrl: `http://127.0.0.1:${server.port}`,
      getToken: async () => TOKEN,
      onEvent: async (e) => {
        got.push(e.id)
      },
      minBackoffMs: 20,
      maxBackoffMs: 50,
    })
    client.start()
    await wait(500)
    client.stop()
    server.stop(true)
    expect(authHeader).toBe(`Bearer ${TOKEN}`)
    expect(connections).toBeGreaterThanOrEqual(2)
    expect(got).toEqual(['e1'])
    expect(acks.filter((a) => a === 'e1').length).toBeGreaterThanOrEqual(2)
  })

  it('stops retrying when the hub rejects the token', async () => {
    let calls = 0
    const server = Bun.serve({
      port: 0,
      fetch() {
        calls++
        return new Response('unauthorized', { status: 401 })
      },
    })
    const statuses: string[] = []
    const client = new HubClient({ hubUrl: `http://127.0.0.1:${server.port}`, getToken: async () => TOKEN, onEvent: async () => {}, onStatus: (s) => statuses.push(s), minBackoffMs: 10 })
    client.start()
    await wait(200)
    client.stop()
    server.stop(true)
    expect(statuses.at(-1)).toBe('unauthorized')
    expect(calls).toBe(1)
  })

  it('reports no_token without a token', async () => {
    const client = new HubClient({ hubUrl: 'http://127.0.0.1:1', getToken: async () => undefined, onEvent: async () => {} })
    client.start()
    await wait(20)
    expect(client.status).toBe('no_token')
  })

  it('backoff grows and is capped', () => {
    const c = new HubClient({ hubUrl: 'x', getToken: async () => undefined, onEvent: async () => {}, minBackoffMs: 1000, maxBackoffMs: 60_000 })
    expect(c.backoffMs(0)).toBeLessThanOrEqual(1000)
    expect(c.backoffMs(20)).toBeLessThanOrEqual(60_000)
    expect(c.backoffMs(20)).toBeGreaterThanOrEqual(30_000)
  })
})
