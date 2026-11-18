import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { TOKEN_RE, writeToken } from './token-store.ts'

export interface LoginResult {
  name: string
}

export interface LoginOptions {
  hubUrl: string
  tokenPath: string
  /** Opens the login URL. Defaults to the system browser. */
  open?: (url: string) => void | Promise<void>
  timeoutMs?: number
  /** Called with the login URL so it can be shown if no browser opens. */
  onUrl?: (url: string) => void
}

export function openBrowser(url: string): void {
  const [cmd, args] =
    process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '""', url]] : ['xdg-open', [url]]
  try {
    const child = spawn(cmd as string, args as string[], { stdio: 'ignore', detached: true })
    child.on('error', () => undefined)
    child.unref()
  } catch {
    // no browser available; the URL is still returned to the caller
  }
}

const page = (title: string, text: string) =>
  `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>${title}</title></head>` +
  `<body style="font:16px system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem"><h1>${title}</h1><p>${text}</p></body></html>`

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

/**
 * Browser login: a one-shot server on 127.0.0.1 receives the hub token after Linear OAuth
 * (hub /login -> Linear -> hub /oauth/callback -> http://127.0.0.1:<port>/callback).
 */
export async function runLogin(opts: LoginOptions): Promise<LoginResult> {
  const state = randomBytes(24).toString('base64url')
  let resolve!: (r: LoginResult) => void
  let reject!: (e: Error) => void
  const done = new Promise<LoginResult>((res, rej) => {
    resolve = res
    reject = rej
  })

  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    async fetch(req) {
      const url = new URL(req.url)
      if (url.pathname !== '/callback') return new Response('not found', { status: 404 })
      const token = url.searchParams.get('token') ?? ''
      if (url.searchParams.get('state') !== state || !TOKEN_RE.test(token)) {
        return new Response(page('Logowanie nieudane', 'Nieprawidłowa odpowiedź huba. Uruchom logowanie jeszcze raz.'), {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
      }
      try {
        await writeToken(opts.tokenPath, token)
      } catch (e) {
        reject(e as Error)
        return new Response('error', { status: 500 })
      }
      const name = (url.searchParams.get('name') ?? '').slice(0, 100)
      resolve({ name })
      return new Response(page('Zalogowano do InterClaude', `Konto: ${escapeHtml(name)}. Możesz zamknąć tę kartę i wrócić do Claude Code.`), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    },
  })

  const loginUrl = `${opts.hubUrl}/login?port=${server.port}&state=${state}`
  opts.onUrl?.(loginUrl)
  const timer = setTimeout(() => reject(new Error('login timed out')), opts.timeoutMs ?? 5 * 60 * 1000)
  try {
    await (opts.open ?? openBrowser)(loginUrl)
    return await done
  } finally {
    clearTimeout(timer)
    setTimeout(() => server.stop(true), 500)
  }
}
