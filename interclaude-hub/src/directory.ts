import { DurableObject } from 'cloudflare:workers'
import type { Env } from './env'
import type { IssueInfo } from './routing'

const ISSUE_TTL_MS = 180 * 24 * 60 * 60 * 1000
const DELIVERY_TTL_MS = 48 * 60 * 60 * 1000
const LOG_KEEP = 100
const RAW_KEEP = 10
const RAW_MAX_CHARS = 8000

/**
 * Singleton ("main"). Caches InterClaude-team issue snapshots from Issue webhooks so Comment webhooks (which only
 * carry a thin issue) can be routed to the assignee or requester, de-duplicates Linear deliveries,
 * and keeps a short routing log for the guarded debug endpoint.
 */
export class Directory extends DurableObject<Env> {
  private sql: SqlStorage

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.sql = ctx.storage.sql
    this.sql.exec(`CREATE TABLE IF NOT EXISTS issues (id TEXT PRIMARY KEY, json TEXT NOT NULL, updated_at INTEGER NOT NULL)`)
    this.sql.exec(`CREATE TABLE IF NOT EXISTS deliveries (id TEXT PRIMARY KEY, at INTEGER NOT NULL)`)
    this.sql.exec(`CREATE TABLE IF NOT EXISTS log (seq INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, line TEXT NOT NULL)`)
    this.sql.exec(`CREATE TABLE IF NOT EXISTS raw (seq INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, body TEXT NOT NULL)`)
  }

  async putIssue(issue: IssueInfo): Promise<void> {
    const now = Date.now()
    this.sql.exec(`INSERT OR REPLACE INTO issues (id, json, updated_at) VALUES (?, ?, ?)`, issue.id, JSON.stringify(issue), now)
    this.sql.exec(`DELETE FROM issues WHERE updated_at < ?`, now - ISSUE_TTL_MS)
  }

  async getIssue(id: string): Promise<IssueInfo | undefined> {
    const row = this.sql.exec<{ json: string }>(`SELECT json FROM issues WHERE id = ?`, id).toArray()[0]
    return row ? (JSON.parse(row.json) as IssueInfo) : undefined
  }

  /** Returns false when this Linear delivery id was already processed. */
  async claimDelivery(id: string): Promise<boolean> {
    const now = Date.now()
    this.sql.exec(`DELETE FROM deliveries WHERE at < ?`, now - DELIVERY_TTL_MS)
    const seen = this.sql.exec(`SELECT 1 FROM deliveries WHERE id = ?`, id).toArray().length > 0
    if (seen) return false
    this.sql.exec(`INSERT INTO deliveries (id, at) VALUES (?, ?)`, id, now)
    return true
  }

  async releaseDelivery(id: string): Promise<void> {
    this.sql.exec(`DELETE FROM deliveries WHERE id = ?`, id)
  }

  async log(lines: string[], raw?: string): Promise<void> {
    const now = Date.now()
    for (const line of lines) this.sql.exec(`INSERT INTO log (at, line) VALUES (?, ?)`, now, line.slice(0, 500))
    this.sql.exec(`DELETE FROM log WHERE seq NOT IN (SELECT seq FROM log ORDER BY seq DESC LIMIT ?)`, LOG_KEEP)
    if (raw) {
      this.sql.exec(`INSERT INTO raw (at, body) VALUES (?, ?)`, now, raw.slice(0, RAW_MAX_CHARS))
      this.sql.exec(`DELETE FROM raw WHERE seq NOT IN (SELECT seq FROM raw ORDER BY seq DESC LIMIT ?)`, RAW_KEEP)
    }
  }

  async recent(): Promise<{ log: { at: string; line: string }[]; raw: { at: string; body: string }[] }> {
    const iso = (ms: number) => new Date(ms).toISOString()
    return {
      log: this.sql.exec<{ at: number; line: string }>(`SELECT at, line FROM log ORDER BY seq DESC LIMIT 50`).toArray().map((r) => ({ at: iso(r.at), line: r.line })),
      raw: this.sql.exec<{ at: number; body: string }>(`SELECT at, body FROM raw ORDER BY seq DESC`).toArray().map((r) => ({ at: iso(r.at), body: r.body })),
    }
  }
}
