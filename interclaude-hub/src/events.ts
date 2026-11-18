export type EventKind = 'task_approved' | 'comment' | 'task_ready_for_review' | 'task_closed'

/** What a plugin receives over the socket or from /inbox. Stable contract with the interclaude plugin. */
export interface HubEvent {
  id: string
  kind: EventKind
  issue: string
  issue_id: string
  title: string
  url: string
  state: string
  actor: string
  comment?: string
  comment_url?: string
  ts: string
}

export const COMMENT_MAX_CHARS = 4000
export const QUEUE_CAP = 200
export const QUEUE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '…'
}
