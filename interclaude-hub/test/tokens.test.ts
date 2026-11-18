import { describe, expect, it } from 'vitest'
import { env, exports } from 'cloudflare:workers'
import { issueToken, parseToken } from '../src/tokens'
import { parsePort, signState, validClientState, verifyState } from '../src/oauth'
import { ALICE } from './fixtures'

describe('hub tokens', () => {
  it('issues ah1.<user>.<secret> tokens that parse back', async () => {
    const { token, hash } = await issueToken(ALICE)
    expect(token.startsWith(`ah1.${ALICE}.`)).toBe(true)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(parseToken(token)).toEqual({ userId: ALICE, secret: token.split('.')[2] })
  })

  it('rejects malformed tokens', () => {
    for (const t of [undefined, '', 'ah1.x.y', `ah2.${ALICE}.${'a'.repeat(43)}`, `ah1.${ALICE}.short`, `ah1.${ALICE}.${'a'.repeat(43)}.extra`]) {
      expect(parseToken(t)).toBeUndefined()
    }
  })

  it('the user DO accepts only stored secrets, keeps hashes only, caps at 10 tokens', async () => {
    const hub = env.USER_HUB.get(env.USER_HUB.idFromName(ALICE))
    const first = await issueToken(ALICE)
    await hub.addToken(first.hash, 'Alice')
    expect(await hub.verifySecret(parseToken(first.token)!.secret)).toBe(true)
    expect(await hub.verifySecret('a'.repeat(43))).toBe(false)
    for (let i = 0; i < 10; i++) await hub.addToken((await issueToken(ALICE)).hash, 'Alice')
    expect((await hub.info()).tokens).toBe(10)
    await hub.revokeAll()
    expect(await hub.verifySecret(parseToken(first.token)!.secret)).toBe(false)
  })

  it('HTTP endpoints require a valid token', async () => {
    const hub = env.USER_HUB.get(env.USER_HUB.idFromName(ALICE))
    const { token, hash } = await issueToken(ALICE)
    await hub.addToken(hash, 'Alice')
    const ok = await exports.default.fetch('https://hub.test/me', { headers: { Authorization: `Bearer ${token}` } })
    expect(ok.status).toBe(200)
    expect(await ok.json()).toMatchObject({ user_id: ALICE })
    const bad = await exports.default.fetch('https://hub.test/inbox', { headers: { Authorization: `Bearer ${token.slice(0, -2)}xx` } })
    expect(bad.status).toBe(401)
    const none = await exports.default.fetch('https://hub.test/ws', { headers: { Upgrade: 'websocket' } })
    expect(none.status).toBe(401)
  })
})

describe('login state', () => {
  it('round-trips port and client state, rejects tampering and expiry', async () => {
    const s = await signState({ port: 54321, clientState: 'abcdefgh1234', issuedAt: 1_000_000 }, 'k')
    expect(await verifyState(s, 'k', 1_000_000 + 60_000)).toEqual({ port: 54321, clientState: 'abcdefgh1234', issuedAt: 1_000_000 })
    expect(await verifyState(s, 'other', 1_000_000)).toBeUndefined()
    expect(await verifyState(s, 'k', 1_000_000 + 11 * 60_000)).toBeUndefined()
    expect(await verifyState(s.replace(/^./, 'x'), 'k', 1_000_000)).toBeUndefined()
  })

  it('validates ports and client state', () => {
    expect(parsePort('8080')).toBe(8080)
    expect(parsePort('80')).toBeUndefined()
    expect(parsePort('70000')).toBeUndefined()
    expect(parsePort('12ab')).toBeUndefined()
    expect(validClientState('abc')).toBe(false)
    expect(validClientState('abcdefgh_-12')).toBe(true)
    expect(validClientState('<script>alert(1)</script>')).toBe(false)
  })

  it('/login redirects to Linear with scope read and a signed state', async () => {
    const res = await exports.default.fetch('https://hub.test/login?port=54321&state=abcdefgh1234', { redirect: 'manual' })
    expect(res.status).toBe(302)
    const loc = new URL(res.headers.get('Location')!)
    expect(loc.origin + loc.pathname).toBe('https://linear.app/oauth/authorize')
    expect(loc.searchParams.get('scope')).toBe('read')
    expect(loc.searchParams.get('redirect_uri')).toBe('https://hub.test/oauth/callback')
    expect(await verifyState(loc.searchParams.get('state'), 'test-client-secret')).toMatchObject({ port: 54321 })
  })

  it('/login without port shows a Polish help page', async () => {
    const res = await exports.default.fetch('https://hub.test/login')
    expect(res.status).toBe(400)
    expect(await res.text()).toContain('Uruchom logowanie z pluginu')
  })
})
