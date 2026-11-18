#!/usr/bin/env bun
/**
 * InterClaude channel: pushes events from the InterClaude Linear team (via the interclaude-hub
 * Worker) into a running Claude Code session. One-way for events; tools: login, inbox.
 * stdout is the MCP stdio transport: logs go to stderr only.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { hubUrl, tokenPath } from './config.ts'
import { HubClient } from './hub-client.ts'
import { INSTRUCTIONS } from './instructions.ts'
import { log } from './log.ts'
import { runLogin } from './login.ts'
import { isHubEvent, toNotification, type HubEvent } from './notify.ts'
import { readToken } from './token-store.ts'

const HUB = hubUrl()
const TOKEN_PATH = tokenPath()

const mcp = new Server(
  { name: 'interclaude', version: '0.1.0' },
  {
    capabilities: { experimental: { 'claude/channel': {} }, tools: {} },
    instructions: INSTRUCTIONS,
  },
)

async function emit(event: HubEvent): Promise<void> {
  const n = toNotification(event)
  await mcp.notification({ method: 'notifications/claude/channel', params: { content: n.content, meta: n.meta } })
}

const hub = new HubClient({
  hubUrl: HUB,
  getToken: () => readToken(TOKEN_PATH),
  onEvent: emit,
  onStatus: (s) => log('hub status:', s),
})

let loginInFlight: Promise<string> | undefined

function login(): Promise<string> {
  loginInFlight ??= (async () => {
    let shownUrl = ''
    try {
      const r = await runLogin({ hubUrl: HUB, tokenPath: TOKEN_PATH, onUrl: (u) => (shownUrl = u) })
      hub.restart()
      return `Zalogowano do InterClaude jako ${r.name || 'użytkownik Linear'}. Token zapisany w ${TOKEN_PATH}.`
    } catch (e) {
      return `Logowanie nie powiodło się (${(e as Error).message}). Jeśli przeglądarka się nie otworzyła, otwórz ręcznie: ${shownUrl}`
    } finally {
      loginInFlight = undefined
    }
  })()
  return loginInFlight
}

const TOOLS = [
  {
    name: 'login',
    description: 'Sign this computer in to the InterClaude hub with Linear (opens the browser). Use when the hub token is missing or rejected.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'inbox',
    description: 'Fetch InterClaude events queued for your human while no session was connected, and mark them as received.',
    inputSchema: { type: 'object', properties: {} },
  },
]

mcp.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }))

mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
  const text = (t: string, isError = false) => ({ content: [{ type: 'text', text: t }], isError })
  if (req.params.name === 'login') return text(await login())
  if (req.params.name === 'inbox') {
    const token = await readToken(TOKEN_PATH)
    if (!token) return text('Brak tokenu InterClaude. Użyj narzędzia login albo skorzystaj z /interclaude:inbox, który działa przez Linear.', true)
    try {
      const res = await fetch(`${HUB}/inbox`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.status === 401) return text('Hub odrzucił token. Użyj narzędzia login.', true)
      if (!res.ok) return text(`Hub zwrócił błąd ${res.status}.`, true)
      const events = ((await res.json()) as { events?: unknown[] }).events?.filter(isHubEvent) ?? []
      if (events.length === 0) return text('Brak zaległych zdarzeń InterClaude.')
      await fetch(`${HUB}/inbox/ack`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: events.map((e) => e.id) }),
      })
      const lines = events.map((e) => {
        const n = toNotification(e)
        return `[${n.meta.kind} ${n.meta.issue} ${e.ts}]\n${n.content}`
      })
      return text(lines.join('\n\n'))
    } catch (e) {
      return text(`Hub InterClaude jest nieosiągalny (${(e as Error).message}). Skorzystaj z /interclaude:inbox, który działa przez Linear.`, true)
    }
  }
  throw new Error(`unknown tool: ${req.params.name}`)
})

await mcp.connect(new StdioServerTransport())

async function boot(): Promise<void> {
  if (await readToken(TOKEN_PATH)) {
    hub.start()
    return
  }
  // First run: sign in through the browser, but only if the hub can actually log people in.
  try {
    const health = (await (await fetch(`${HUB}/health`)).json()) as { configured?: { login?: boolean } }
    if (!health.configured?.login) {
      log('hub login is not configured yet; events will start after an admin sets it up and you run the login tool')
      return
    }
  } catch (e) {
    log('hub unreachable at startup:', (e as Error).message)
    return
  }
  log('no InterClaude token yet, opening the browser to sign in')
  log(await login())
}

void boot()

process.stdin.on('close', () => {
  hub.stop()
  process.exit(0)
})
