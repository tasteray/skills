import type { Env } from './env'
import { handleWebhook } from './webhook'
import { page } from './html'
import { authorizeUrl, exchangeCode, fetchViewer, parsePort, revokeAccessToken, signState, validClientState, verifyState } from './oauth'
import { RateLimiter } from './ratelimit'
import { bearer, issueToken, parseToken } from './tokens'
import { timingSafeEqual } from './crypto'

export { UserHub } from './user-hub'
export { Directory } from './directory'

const webhookLimiter = new RateLimiter(600, 60_000)
const loginLimiter = new RateLimiter(30, 60_000)
const apiLimiter = new RateLimiter(120, 60_000)

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ?? 'unknown'
}

function oauthConfigured(env: Env): env is Env & { LINEAR_OAUTH_CLIENT_ID: string; LINEAR_OAUTH_CLIENT_SECRET: string } {
  return !!env.LINEAR_OAUTH_CLIENT_ID && !!env.LINEAR_OAUTH_CLIENT_SECRET
}

async function login(request: Request, env: Env, url: URL): Promise<Response> {
  if (!oauthConfigured(env)) {
    return page(
      'Logowanie jeszcze nie działa',
      'Hub InterClaude nie ma jeszcze skonfigurowanej aplikacji OAuth w Linear (brakuje sekretów LINEAR_OAUTH_CLIENT_ID i LINEAR_OAUTH_CLIENT_SECRET w Workerze interclaude-hub). Daj znać osobie, która administruje hubem, a potem spróbuj ponownie.',
      503,
    )
  }
  const port = parsePort(url.searchParams.get('port'))
  const clientState = url.searchParams.get('state')
  if (!port || !validClientState(clientState)) {
    return page('Nieprawidłowe logowanie', 'Uruchom logowanie z pluginu interclaude (narzędzie login), nie otwieraj tego adresu ręcznie.', 400)
  }
  const state = await signState({ port, clientState, issuedAt: Date.now() }, env.LINEAR_OAUTH_CLIENT_SECRET)
  return Response.redirect(authorizeUrl(env.LINEAR_OAUTH_CLIENT_ID, `${url.origin}/oauth/callback`, state), 302)
}

async function oauthCallback(request: Request, env: Env, url: URL): Promise<Response> {
  if (!oauthConfigured(env)) return page('Logowanie jeszcze nie działa', 'Brakuje konfiguracji OAuth w hubie.', 503)
  const state = await verifyState(url.searchParams.get('state'), env.LINEAR_OAUTH_CLIENT_SECRET)
  if (!state) return page('Logowanie wygasło', 'Link logowania jest nieważny albo wygasł. Uruchom logowanie jeszcze raz z pluginu.', 400)
  const code = url.searchParams.get('code')
  if (!code || code.length > 512) return page('Logowanie przerwane', 'Linear nie zwrócił kodu autoryzacji. Spróbuj ponownie.', 400)

  let viewer
  try {
    const accessToken = await exchangeCode(code, `${url.origin}/oauth/callback`, env.LINEAR_OAUTH_CLIENT_ID, env.LINEAR_OAUTH_CLIENT_SECRET)
    try {
      viewer = await fetchViewer(accessToken)
    } finally {
      await revokeAccessToken(accessToken)
    }
  } catch (err) {
    console.error('oauth callback failed', err)
    return page('Logowanie nie powiodło się', 'Nie udało się potwierdzić konta w Linear. Spróbuj ponownie za chwilę.', 502)
  }
  if (env.LINEAR_ORG_URL_KEY && viewer.orgUrlKey !== env.LINEAR_ORG_URL_KEY) {
    return page('Złe konto Linear', 'To konto nie należy do workspace’u zespołu. Zaloguj się kontem firmowym.', 403)
  }

  const { token, hash } = await issueToken(viewer.id)
  await env.USER_HUB.get(env.USER_HUB.idFromName(viewer.id)).addToken(hash, viewer.name)
  console.log(`login: issued hub token for ${viewer.id}`)
  const target = new URL(`http://127.0.0.1:${state.port}/callback`)
  target.searchParams.set('token', token)
  target.searchParams.set('state', state.clientState)
  target.searchParams.set('name', viewer.name)
  return new Response(null, { status: 302, headers: { Location: target.toString(), 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } })
}

async function authedHub(request: Request, env: Env) {
  const parsed = parseToken(bearer(request))
  if (!parsed) return undefined
  const hub = env.USER_HUB.get(env.USER_HUB.idFromName(parsed.userId))
  return (await hub.verifySecret(parsed.secret)) ? { hub, userId: parsed.userId } : undefined
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const ip = clientIp(request)
    const route = `${request.method} ${url.pathname}`

    switch (route) {
      case 'GET /':
      case 'GET /health':
        return json({
          ok: true,
          service: 'interclaude-hub',
          configured: { webhook: !!env.LINEAR_WEBHOOK_SECRET, login: oauthConfigured(env), slack: !!env.SLACK_BOT_TOKEN },
        })

      case 'POST /linear/webhook':
        if (!webhookLimiter.allow(ip)) return json({ error: 'rate limited' }, 429)
        return handleWebhook(request, env)

      case 'GET /login':
        if (!loginLimiter.allow(ip)) return page('Za dużo prób', 'Odczekaj minutę i spróbuj ponownie.', 429)
        return login(request, env, url)

      case 'GET /oauth/callback':
        if (!loginLimiter.allow(ip)) return page('Za dużo prób', 'Odczekaj minutę i spróbuj ponownie.', 429)
        return oauthCallback(request, env, url)

      case 'GET /ws': {
        if (!apiLimiter.allow(ip)) return json({ error: 'rate limited' }, 429)
        if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return json({ error: 'expected websocket' }, 426)
        const parsed = parseToken(bearer(request))
        if (!parsed) return json({ error: 'unauthorized' }, 401)
        return env.USER_HUB.get(env.USER_HUB.idFromName(parsed.userId)).fetch(request)
      }

      case 'GET /me': {
        if (!apiLimiter.allow(ip)) return json({ error: 'rate limited' }, 429)
        const a = await authedHub(request, env)
        if (!a) return json({ error: 'unauthorized' }, 401)
        return json({ user_id: a.userId, ...(await a.hub.info()) })
      }

      case 'GET /inbox': {
        if (!apiLimiter.allow(ip)) return json({ error: 'rate limited' }, 429)
        const a = await authedHub(request, env)
        if (!a) return json({ error: 'unauthorized' }, 401)
        return json({ events: await a.hub.pending() })
      }

      case 'POST /inbox/ack': {
        if (!apiLimiter.allow(ip)) return json({ error: 'rate limited' }, 429)
        const a = await authedHub(request, env)
        if (!a) return json({ error: 'unauthorized' }, 401)
        const text = await request.text()
        if (text.length > 32 * 1024) return json({ error: 'too large' }, 413)
        let ids: unknown
        try {
          ids = (JSON.parse(text) as { ids?: unknown }).ids
        } catch {
          return json({ error: 'bad json' }, 400)
        }
        if (!Array.isArray(ids)) return json({ error: 'ids must be an array' }, 400)
        return json({ acked: await a.hub.ack(ids.filter((i): i is string => typeof i === 'string')) })
      }

      case 'GET /debug/recent': {
        const token = bearer(request)
        if (!env.DEBUG_TOKEN || !token || !timingSafeEqual(token, env.DEBUG_TOKEN)) return json({ error: 'not found' }, 404)
        return json(await env.DIRECTORY.get(env.DIRECTORY.idFromName('main')).recent())
      }

      default:
        return json({ error: 'not found' }, 404)
    }
  },
} satisfies ExportedHandler<Env>
