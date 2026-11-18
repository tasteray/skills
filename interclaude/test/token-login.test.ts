import { afterAll, describe, expect, it } from 'bun:test'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readToken, writeToken } from '../src/token-store.ts'
import { runLogin } from '../src/login.ts'
import { hubUrl, tokenPath } from '../src/config.ts'

const dir = await mkdtemp(join(tmpdir(), 'interclaude-'))
afterAll(() => rm(dir, { recursive: true, force: true }))
const TOKEN = `ah1.aaaaaaaa-0000-4000-8000-000000000001.${'x'.repeat(43)}`

describe('config', () => {
  it('uses INTERCLAUDE_HUB_URL and the per-plugin token path', () => {
    expect(hubUrl({ INTERCLAUDE_HUB_URL: 'http://localhost:8787/' })).toBe('http://localhost:8787')
    expect(hubUrl({})).toMatch(/^https:\/\//)
    expect(tokenPath('/home/u')).toBe('/home/u/.claude/channels/interclaude/token')
  })
})

describe('token store', () => {
  it('writes the token with 0600 and reads it back', async () => {
    const p = join(dir, 'a', 'token')
    await writeToken(p, TOKEN)
    expect((await stat(p)).mode & 0o777).toBe(0o600)
    expect((await stat(join(dir, 'a'))).mode & 0o777).toBe(0o700)
    expect(await readToken(p)).toBe(TOKEN)
  })
  it('refuses malformed tokens and ignores garbage files', async () => {
    await expect(writeToken(join(dir, 'b', 'token'), 'nope')).rejects.toThrow()
    expect(await readToken(join(dir, 'missing'))).toBeUndefined()
  })
})

describe('runLogin', () => {
  it('receives the token on the local callback after the hub redirect', async () => {
    // Fake hub: /login redirects straight back to the local callback, like the real one does after Linear OAuth.
    const hub = Bun.serve({
      port: 0,
      fetch(req) {
        const u = new URL(req.url)
        const back = new URL(`http://127.0.0.1:${u.searchParams.get('port')}/callback`)
        back.searchParams.set('token', TOKEN)
        back.searchParams.set('state', u.searchParams.get('state')!)
        back.searchParams.set('name', 'Alice')
        return Response.redirect(back.toString(), 302)
      },
    })
    const p = join(dir, 'login', 'token')
    let page = ''
    const r = await runLogin({
      hubUrl: `http://127.0.0.1:${hub.port}`,
      tokenPath: p,
      open: async (url) => {
        page = await (await fetch(url)).text()
      },
      timeoutMs: 5000,
    })
    hub.stop(true)
    expect(r.name).toBe('Alice')
    expect(await readToken(p)).toBe(TOKEN)
    expect(page).toContain('Zalogowano do InterClaude')
  })

  it('rejects a callback with the wrong state', async () => {
    let status = 0
    const p = runLogin({
      hubUrl: 'http://127.0.0.1:1',
      tokenPath: join(dir, 'bad', 'token'),
      open: async (url) => {
        const port = new URL(url).searchParams.get('port')
        status = (await fetch(`http://127.0.0.1:${port}/callback?token=${TOKEN}&state=wrong`)).status
      },
      timeoutMs: 300,
    })
    await expect(p).rejects.toThrow('timed out')
    expect(status).toBe(400)
  })
})
