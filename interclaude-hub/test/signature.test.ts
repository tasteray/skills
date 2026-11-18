import { describe, expect, it } from 'vitest'
import { isFreshTimestamp, verifyLinearSignature } from '../src/signature'
import { hmacSha256, toHex } from '../src/crypto'

const secret = 'lin_wh_secret'
const body = JSON.stringify({ type: 'Issue', webhookTimestamp: 1 })

describe('verifyLinearSignature', () => {
  it('accepts the hex HMAC-SHA256 of the raw body', async () => {
    const sig = toHex(await hmacSha256(secret, body))
    expect(await verifyLinearSignature(body, sig, secret)).toBe(true)
    expect(await verifyLinearSignature(body, sig.toUpperCase(), secret)).toBe(true)
  })

  it('rejects a wrong secret, a changed body and a missing header', async () => {
    const sig = toHex(await hmacSha256(secret, body))
    expect(await verifyLinearSignature(body, sig, 'other')).toBe(false)
    expect(await verifyLinearSignature(body + ' ', sig, secret)).toBe(false)
    expect(await verifyLinearSignature(body, null, secret)).toBe(false)
    expect(await verifyLinearSignature(body, '', secret)).toBe(false)
    expect(await verifyLinearSignature(body, sig, '')).toBe(false)
  })
})

describe('isFreshTimestamp', () => {
  const now = 1_800_000_000_000
  it('accepts recent timestamps and small clock skew', () => {
    expect(isFreshTimestamp(now - 30_000, now)).toBe(true)
    expect(isFreshTimestamp(now + 30_000, now)).toBe(true)
  })
  it('rejects old, missing or non-numeric timestamps', () => {
    expect(isFreshTimestamp(now - 10 * 60_000, now)).toBe(false)
    expect(isFreshTimestamp(undefined, now)).toBe(false)
    expect(isFreshTimestamp(String(now), now)).toBe(false)
  })
})
