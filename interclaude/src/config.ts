import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * Deployed hub (Cloudflare workers.dev URL of the interclaude-hub Worker; check it after the first deploy).
 * Override with INTERCLAUDE_HUB_URL, for example for a preview deploy.
 */
export const DEFAULT_HUB_URL = 'https://interclaude-hub.tasteray.workers.dev'

export function hubUrl(env: Record<string, string | undefined> = process.env): string {
  return (env.INTERCLAUDE_HUB_URL?.trim() || DEFAULT_HUB_URL).replace(/\/+$/, '')
}

export function tokenPath(home = homedir()): string {
  return join(home, '.claude', 'channels', 'interclaude', 'token')
}
