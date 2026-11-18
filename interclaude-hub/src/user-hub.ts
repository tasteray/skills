import { DurableObject } from 'cloudflare:workers'
import type { Env } from './env'
import { QUEUE_CAP, QUEUE_TTL_MS, type HubEvent } from './events'
import { timingSafeEqual } from './crypto'
import { bearer, hashSecret, parseToken } from './tokens'

export const MAX_SOCKETS_PER_USER = 5
export const MAX_TOKENS_PER_USER = 10
export const MAX_CLIENT_MESSAGE_BYTES = 8 * 1024

/**
 * One instance per Linear user id. Holds that person's hub tokens (hashes only), their WebSocket
 * connections (hibernation API) and the queue of events not yet acknowledged by any client.
 */
export class UserHub extends DurableObject<Env> {
  private sql: SqlStorage

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.sql = ctx.storage.sql
    this.sql.exec(`CREATE TABLE IF NOT EXISTS tokens (hash TEXT PRIMARY KEY, name TEXT, created_at INTEGER NOT NULL, last_used_at INTEGER)`)
    this.sql.exec(`CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, payload TEXT NOT NULL)`)
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'))
  }

  // ---- tokens ---------------------------------------------------------------------------

  async addToken(hash: string, name: string): Promise<void> {
    this.sql.exec(`INSERT OR REPLACE INTO tokens (hash, name, created_at) VALUES (?, ?, ?)`, hash, name.slice(0, 100), Date.now())
    this.sql.exec(
      `DELETE FROM tokens WHERE hash NOT IN (SELECT hash FROM tokens ORDER BY created_at DESC LIMIT ?)`,
      MAX_TOKENS_PER_USER,
    )
  }

  async verifySecret(secret: string): Promise<boolean> {
    const hash = await hashSecret(secret)
    const rows = this.sql.exec<{ hash: string }>(`SELECT hash FROM tokens`).toArray()
    const match = rows.find((r) => timingSafeEqual(r.hash, hash))
    if (!match) return false
    this.sql.exec(`UPDATE tokens SET last_used_at = ? WHERE hash = ?`, Date.now(), match.hash)
    return true
  }

  async revokeAll(): Promise<void> {
    this.sql.exec(`DELETE FROM tokens`)
    for (const ws of this.ctx.getWebSockets()) ws.close(4001, 'revoked')
  }

  // ---- queue ----------------------------------------------------------------------------

  private purge(now = Date.now()): void {
    this.sql.exec(`DELETE FROM events WHERE created_at < ?`, now - QUEUE_TTL_MS)
    this.sql.exec(`DELETE FROM events WHERE id NOT IN (SELECT id FROM events ORDER BY created_at DESC, rowid DESC LIMIT ?)`, QUEUE_CAP)
  }

  /**
   * Sockets ordered oldest first. Only the newest one receives events: one person, one agent
   * session, so two sessions never both pick up the same task.
   */
  private sockets(): WebSocket[] {
    const at = (ws: WebSocket) => (ws.deserializeAttachment() as { connectedAt?: number } | null)?.connectedAt ?? 0
    return this.ctx.getWebSockets().sort((a, b) => at(a) - at(b))
  }

  private active(): WebSocket | undefined {
    return this.sockets().at(-1)
  }

  /** Stores the event until a client acks it, and pushes it to the newest open socket right away. */
  async enqueue(event: HubEvent): Promise<{ delivered: boolean; pending: number }> {
    const now = Date.now()
    this.sql.exec(`INSERT OR IGNORE INTO events (id, created_at, payload) VALUES (?, ?, ?)`, event.id, now, JSON.stringify(event))
    this.purge(now)
    let delivered = false
    const ws = this.active()
    if (ws) {
      try {
        ws.send(JSON.stringify({ type: 'event', event }))
        delivered = true
      } catch {
        // closed socket; the event stays queued
      }
    }
    if ((await this.ctx.storage.getAlarm()) === null) await this.ctx.storage.setAlarm(now + 24 * 60 * 60 * 1000)
    return { delivered, pending: this.count() }
  }

  async pending(limit = QUEUE_CAP): Promise<HubEvent[]> {
    this.purge()
    return this.sql
      .exec<{ payload: string }>(`SELECT payload FROM events ORDER BY created_at ASC, rowid ASC LIMIT ?`, Math.min(limit, QUEUE_CAP))
      .toArray()
      .map((r) => JSON.parse(r.payload) as HubEvent)
  }

  async ack(ids: string[]): Promise<number> {
    let n = 0
    for (const id of ids.slice(0, QUEUE_CAP)) {
      if (typeof id !== 'string' || id.length > 64) continue
      n += this.sql.exec(`DELETE FROM events WHERE id = ?`, id).rowsWritten
    }
    return n
  }

  count(): number {
    return this.sql.exec<{ n: number }>(`SELECT COUNT(*) AS n FROM events`).one().n
  }

  async info(): Promise<{ sockets: number; pending: number; tokens: number }> {
    return {
      sockets: this.ctx.getWebSockets().length,
      pending: this.count(),
      tokens: this.sql.exec<{ n: number }>(`SELECT COUNT(*) AS n FROM tokens`).one().n,
    }
  }

  async alarm(): Promise<void> {
    this.purge()
    if (this.count() > 0) await this.ctx.storage.setAlarm(Date.now() + 24 * 60 * 60 * 1000)
  }

  // ---- WebSocket ------------------------------------------------------------------------

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('expected websocket', { status: 426 })
    const parsed = parseToken(bearer(request))
    if (!parsed || !(await this.verifySecret(parsed.secret))) return new Response('unauthorized', { status: 401 })

    // A laptop that slept leaves stale sockets behind: drop the oldest instead of refusing the new one.
    const open = this.sockets()
    for (const ws of open.slice(0, Math.max(0, open.length - MAX_SOCKETS_PER_USER + 1))) ws.close(4008, 'too many connections')
    // The newest connection wins; older sessions stay connected but idle.
    for (const ws of this.sockets()) {
      try {
        ws.send(JSON.stringify({ type: 'standby' }))
      } catch {
        // ignore
      }
    }

    const pair = new WebSocketPair()
    const [client, server] = [pair[0], pair[1]]
    this.ctx.acceptWebSocket(server)
    server.serializeAttachment({ connectedAt: Date.now() })
    const pending = await this.pending()
    server.send(JSON.stringify({ type: 'hello', pending: pending.length }))
    for (const event of pending) server.send(JSON.stringify({ type: 'event', event }))
    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const size = typeof message === 'string' ? message.length : message.byteLength
    if (size > MAX_CLIENT_MESSAGE_BYTES || typeof message !== 'string') {
      ws.close(1009, 'message too big')
      return
    }
    let msg: { type?: unknown; ids?: unknown }
    try {
      msg = JSON.parse(message)
    } catch {
      return
    }
    if (msg.type === 'ack' && Array.isArray(msg.ids)) await this.ack(msg.ids as string[])
  }

  async webSocketClose(ws: WebSocket, code: number): Promise<void> {
    try {
      ws.close(code === 1005 || code === 1006 ? 1000 : code, 'closing')
    } catch {
      // already closed
    }
    // If the active (newest) session went away, the next newest takes over with whatever is still waiting.
    const at = (s: WebSocket) => (s.deserializeAttachment() as { connectedAt?: number } | null)?.connectedAt ?? 0
    const next = this.sockets().filter((s) => s !== ws).at(-1)
    if (!next || at(next) > at(ws)) return
    const pending = await this.pending()
    try {
      next.send(JSON.stringify({ type: 'active', pending: pending.length }))
      for (const event of pending) next.send(JSON.stringify({ type: 'event', event }))
    } catch {
      // ignore
    }
  }
}
