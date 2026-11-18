import { hmacSha256, timingSafeEqual, toHex } from './crypto'

/** Linear allows a minute; we accept a little clock skew on top. */
export const MAX_WEBHOOK_AGE_MS = 2 * 60 * 1000

/**
 * Verifies the `Linear-Signature` header: hex HMAC-SHA256 of the raw body keyed with the webhook secret.
 */
export async function verifyLinearSignature(rawBody: string, header: string | null, secret: string): Promise<boolean> {
  if (!header || !secret) return false
  const expected = toHex(await hmacSha256(secret, rawBody))
  return timingSafeEqual(expected, header.trim().toLowerCase())
}

/** `webhookTimestamp` (ms since epoch, in the JSON body) must be recent, to block replays. */
export function isFreshTimestamp(webhookTimestamp: unknown, now = Date.now()): boolean {
  if (typeof webhookTimestamp !== 'number' || !Number.isFinite(webhookTimestamp)) return false
  return Math.abs(now - webhookTimestamp) <= MAX_WEBHOOK_AGE_MS
}
