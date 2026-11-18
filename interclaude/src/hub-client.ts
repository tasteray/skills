import { isHubEvent, type HubEvent } from './notify.ts'
import { log } from './log.ts'

export type HubStatus = 'idle' | 'connecting' | 'connected' | 'standby' | 'unauthorized' | 'no_token'

export interface HubClientOptions {
  hubUrl: string
  getToken: () => Promise<string | undefined>
  /** Must resolve once the event is handed to Claude Code; the event is acked afterwards. */
  onEvent: (event: HubEvent) => Promise<void>
  onStatus?: (status: HubStatus) => void
  minBackoffMs?: number
  maxBackoffMs?: number
  pingMs?: number
}

/** Keeps one WebSocket to the hub open, with exponential backoff and keepalive pings. */
export class HubClient {
  private ws?: WebSocket
  private attempt = 0
  private timer?: ReturnType<typeof setTimeout>
  private pinger?: ReturnType<typeof setInterval>
  private lastPong = 0
  private stopped = false
  private seen = new Set<string>()
  status: HubStatus = 'idle'

  constructor(private opts: HubClientOptions) {}

  private set(status: HubStatus) {
    this.status = status
    this.opts.onStatus?.(status)
  }

  start(): void {
    this.stopped = false
    this.attempt = 0
    clearTimeout(this.timer)
    void this.connect()
  }

  stop(): void {
    this.stopped = true
    clearTimeout(this.timer)
    clearInterval(this.pinger)
    this.ws?.close(1000, 'bye')
    this.ws = undefined
  }

  /** Re-authenticated: drop the old socket and connect with the new token. */
  restart(): void {
    this.stop()
    this.start()
  }

  backoffMs(attempt: number): number {
    const min = this.opts.minBackoffMs ?? 1000
    const max = this.opts.maxBackoffMs ?? 60_000
    const base = Math.min(max, min * 2 ** attempt)
    return Math.round(base / 2 + Math.random() * (base / 2))
  }

  private schedule(): void {
    if (this.stopped) return
    const delay = this.backoffMs(this.attempt++)
    clearTimeout(this.timer)
    this.timer = setTimeout(() => void this.connect(), delay)
  }

  private async connect(): Promise<void> {
    if (this.stopped) return
    const token = await this.opts.getToken()
    if (!token) {
      this.set('no_token')
      return
    }
    this.set('connecting')
    // Check the token over HTTP first: a WebSocket handshake failure does not expose the status code.
    try {
      const me = await fetch(`${this.opts.hubUrl}/me`, { headers: { Authorization: `Bearer ${token}` } })
      if (me.status === 401) {
        log('hub rejected the token; run the login tool')
        this.set('unauthorized')
        return
      }
    } catch (e) {
      log('hub unreachable:', (e as Error).message)
      this.schedule()
      return
    }

    const wsUrl = this.opts.hubUrl.replace(/^http/, 'ws') + '/ws'
    // Bun's WebSocket accepts headers; browsers' does not, but this runs under Bun.
    const ws = new WebSocket(wsUrl, { headers: { Authorization: `Bearer ${token}` } } as unknown as string[])
    this.ws = ws
    ws.addEventListener('message', (m) => void this.onMessage(ws, m.data))
    ws.addEventListener('close', () => {
      if (this.ws !== ws) return
      clearInterval(this.pinger)
      this.ws = undefined
      if (!this.stopped) {
        this.set('connecting')
        this.schedule()
      }
    })
    ws.addEventListener('error', () => undefined)
    ws.addEventListener('open', () => {
      this.lastPong = Date.now()
      clearInterval(this.pinger)
      const every = this.opts.pingMs ?? 30_000
      this.pinger = setInterval(() => {
        if (Date.now() - this.lastPong > every * 2.5) {
          log('hub keepalive lost, reconnecting')
          ws.close(4000, 'keepalive')
          return
        }
        try {
          ws.send('ping')
        } catch {
          // close handler reconnects
        }
      }, every)
    })
  }

  private async onMessage(ws: WebSocket, data: unknown): Promise<void> {
    const text = typeof data === 'string' ? data : ''
    if (text === 'pong') {
      this.lastPong = Date.now()
      return
    }
    this.lastPong = Date.now()
    let msg: { type?: string; event?: unknown }
    try {
      msg = JSON.parse(text)
    } catch {
      return
    }
    if (msg.type === 'hello' || msg.type === 'active') {
      this.attempt = 0
      this.set('connected')
    } else if (msg.type === 'standby') {
      this.set('standby')
      log('a newer session of yours is connected to InterClaude; this one will not receive events')
    } else if (msg.type === 'event' && isHubEvent(msg.event)) {
      const event = msg.event
      if (!this.seen.has(event.id)) {
        await this.opts.onEvent(event)
        this.seen.add(event.id)
        if (this.seen.size > 1000) this.seen = new Set([...this.seen].slice(-500))
      }
      try {
        ws.send(JSON.stringify({ type: 'ack', ids: [event.id] }))
      } catch {
        // will be redelivered and de-duplicated by id
      }
    }
  }
}
