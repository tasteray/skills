import { base64url, fromBase64url, hmacSha256, randomToken, timingSafeEqual } from './crypto'

export const LINEAR_AUTHORIZE_URL = 'https://linear.app/oauth/authorize'
export const LINEAR_TOKEN_URL = 'https://api.linear.app/oauth/token'
export const LINEAR_REVOKE_URL = 'https://api.linear.app/oauth/revoke'
export const LINEAR_GRAPHQL_URL = 'https://api.linear.app/graphql'
export const STATE_MAX_AGE_MS = 10 * 60 * 1000

const CLIENT_STATE_RE = /^[A-Za-z0-9_-]{8,128}$/

export interface LoginState {
  port: number
  clientState: string
  issuedAt: number
}

export function parsePort(v: string | null): number | undefined {
  if (!v || !/^\d{2,5}$/.test(v)) return undefined
  const n = Number(v)
  return n >= 1024 && n <= 65535 ? n : undefined
}

export function validClientState(v: string | null): v is string {
  return !!v && CLIENT_STATE_RE.test(v)
}

const enc = new TextEncoder()
const dec = new TextDecoder()

/** OAuth `state` we hand Linear: the plugin's port and state, signed so the callback can trust them. */
export async function signState(s: LoginState, key: string): Promise<string> {
  const body = base64url(enc.encode(JSON.stringify({ p: s.port, s: s.clientState, t: s.issuedAt, n: randomToken(8) })))
  const sig = base64url(await hmacSha256(`interclaude-state:${key}`, body))
  return `${body}.${sig}`
}

export async function verifyState(state: string | null, key: string, now = Date.now()): Promise<LoginState | undefined> {
  if (!state || state.length > 1024) return undefined
  const [body, sig] = state.split('.')
  if (!body || !sig) return undefined
  const expected = base64url(await hmacSha256(`interclaude-state:${key}`, body))
  if (!timingSafeEqual(expected, sig)) return undefined
  try {
    const v = JSON.parse(dec.decode(fromBase64url(body))) as { p: number; s: string; t: number }
    if (typeof v.t !== 'number' || now - v.t > STATE_MAX_AGE_MS || v.t - now > 60_000) return undefined
    const port = parsePort(String(v.p))
    if (!port || !validClientState(v.s)) return undefined
    return { port, clientState: v.s, issuedAt: v.t }
  } catch {
    return undefined
  }
}

export function authorizeUrl(clientId: string, redirectUri: string, state: string): string {
  const u = new URL(LINEAR_AUTHORIZE_URL)
  u.searchParams.set('client_id', clientId)
  u.searchParams.set('redirect_uri', redirectUri)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('scope', 'read')
  u.searchParams.set('state', state)
  u.searchParams.set('prompt', 'consent')
  return u.toString()
}

export interface LinearViewer {
  id: string
  name: string
  orgUrlKey?: string
}

export async function exchangeCode(code: string, redirectUri: string, clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch(LINEAR_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, redirect_uri: redirectUri, client_id: clientId, client_secret: clientSecret, grant_type: 'authorization_code' }),
  })
  if (!res.ok) throw new Error(`token exchange failed: ${res.status}`)
  const json = (await res.json()) as { access_token?: string }
  if (!json.access_token) throw new Error('token exchange: no access_token')
  return json.access_token
}

export async function fetchViewer(accessToken: string): Promise<LinearViewer> {
  const res = await fetch(LINEAR_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ query: '{ viewer { id name } organization { urlKey } }' }),
  })
  if (!res.ok) throw new Error(`viewer query failed: ${res.status}`)
  const json = (await res.json()) as { data?: { viewer?: { id: string; name: string }; organization?: { urlKey?: string } } }
  const viewer = json.data?.viewer
  if (!viewer?.id) throw new Error('viewer query: no viewer')
  return { id: viewer.id, name: viewer.name, orgUrlKey: json.data?.organization?.urlKey }
}

/** The hub only needs the identity, so the Linear access token is revoked right away. */
export async function revokeAccessToken(accessToken: string): Promise<void> {
  await fetch(LINEAR_REVOKE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Bearer ${accessToken}` },
    body: new URLSearchParams({ token: accessToken }),
  }).catch(() => undefined)
}
