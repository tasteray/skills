import { randomToken, sha256Hex } from './crypto'

/**
 * Hub tokens look like `ah1.<linear user id>.<secret>`. The user id routes the request to that
 * user's Durable Object, which stores only sha256(secret) and checks it there.
 */
const TOKEN_RE = /^ah1\.([0-9a-f-]{8,64})\.([A-Za-z0-9_-]{40,64})$/

export interface ParsedToken {
  userId: string
  secret: string
}

export function parseToken(token: string | null | undefined): ParsedToken | undefined {
  if (!token) return undefined
  const m = TOKEN_RE.exec(token.trim())
  return m ? { userId: m[1]!, secret: m[2]! } : undefined
}

export function bearer(request: Request): string | undefined {
  const h = request.headers.get('Authorization')
  const m = h ? /^Bearer\s+(\S+)$/i.exec(h) : null
  return m?.[1]
}

export async function issueToken(userId: string): Promise<{ token: string; hash: string }> {
  const secret = randomToken(32)
  return { token: `ah1.${userId}.${secret}`, hash: await sha256Hex(secret) }
}

export const hashSecret = sha256Hex
