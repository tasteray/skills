import { COMMENT_MAX_CHARS, type EventKind, type HubEvent, truncate } from './events'

export interface RoutingConfig {
  teamId?: string
  teamKey?: string
  approved: string
  review: string
  closed: string[]
  sharedLabel: string
  sharedLabelId?: string
  sharedClaudeUserId?: string
}

/** Everything the router needs to know about an issue. Cached by the Directory from Issue webhooks. */
export interface IssueInfo {
  id: string
  identifier: string
  title: string
  url: string
  teamKey?: string
  teamId?: string
  stateName?: string
  assigneeId?: string
  creatorId?: string
  labelNames: string[]
  labelIds?: string[]
}

export type Target = { type: 'user'; userId: string } | { type: 'slack' }

export interface Delivery {
  target: Target
  event: HubEvent
}

export interface RouteResult {
  /** Issue snapshot to cache (Issue webhooks only). */
  issue?: IssueInfo
  /** Issue id a Comment points at, when the router needs it looked up. */
  needsIssue?: string
  deliveries: Delivery[]
  skipped: string[]
}

type Json = Record<string, unknown>

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.length > 0 ? v : undefined)
const obj = (v: unknown): Json | undefined => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : undefined)

export function configFromEnv(env: {
  LINEAR_TEAM_KEY?: string
  LINEAR_TEAM_ID?: string
  STATE_APPROVED: string
  STATE_REVIEW: string
  STATES_CLOSED: string
  LABEL_SHARED_CLAUDE: string
  LABEL_SHARED_CLAUDE_ID?: string
  SHARED_CLAUDE_LINEAR_USER_ID?: string
}): RoutingConfig {
  return {
    teamId: str(env.LINEAR_TEAM_ID),
    teamKey: str(env.LINEAR_TEAM_KEY),
    approved: env.STATE_APPROVED,
    review: env.STATE_REVIEW,
    closed: env.STATES_CLOSED.split(',').map((s) => s.trim()).filter(Boolean),
    sharedLabel: env.LABEL_SHARED_CLAUDE,
    sharedLabelId: str(env.LABEL_SHARED_CLAUDE_ID),
    sharedClaudeUserId: str(env.SHARED_CLAUDE_LINEAR_USER_ID),
  }
}

/** Builds an IssueInfo from an Issue webhook `data` object (or a GraphQL issue node). */
export function issueFromData(data: Json): IssueInfo | undefined {
  const id = str(data.id)
  if (!id) return undefined
  const team = obj(data.team)
  const state = obj(data.state)
  const labelsField = data.labels
  const labelNodes = Array.isArray(labelsField) ? labelsField : Array.isArray(obj(labelsField)?.nodes) ? (obj(labelsField)!.nodes as unknown[]) : []
  return {
    id,
    identifier: str(data.identifier) ?? id,
    title: str(data.title) ?? '',
    url: str(data.url) ?? '',
    teamKey: str(team?.key),
    teamId: str(data.teamId) ?? str(team?.id),
    stateName: str(state?.name),
    assigneeId: str(data.assigneeId) ?? str(obj(data.assignee)?.id),
    creatorId: str(data.creatorId) ?? str(obj(data.creator)?.id),
    labelNames: labelNodes.map((l) => str(obj(l)?.name)).filter((n): n is string => !!n),
    labelIds: [
      ...(Array.isArray(data.labelIds) ? data.labelIds : []),
      ...labelNodes.map((l) => obj(l)?.id),
    ].filter((n): n is string => typeof n === 'string'),
  }
}

export function isTeamIssue(issue: Pick<IssueInfo, 'teamKey' | 'teamId'>, cfg: RoutingConfig): boolean {
  if (cfg.teamId && issue.teamId) return issue.teamId === cfg.teamId
  if (cfg.teamKey && issue.teamKey) return issue.teamKey === cfg.teamKey
  return false
}

export function isShared(issue: IssueInfo, cfg: RoutingConfig): boolean {
  if (cfg.sharedLabelId && issue.labelIds?.includes(cfg.sharedLabelId)) return true
  return issue.labelNames.includes(cfg.sharedLabel)
}

function makeEvent(kind: EventKind, issue: IssueInfo, actor: string, ts: string, extra: Partial<HubEvent> = {}): HubEvent {
  return {
    id: crypto.randomUUID(),
    kind,
    issue: issue.identifier,
    issue_id: issue.id,
    title: issue.title,
    url: issue.url,
    state: issue.stateName ?? '',
    actor,
    ts,
    ...extra,
  }
}

function userTarget(userId: string, cfg: RoutingConfig): Target {
  return cfg.sharedClaudeUserId && userId === cfg.sharedClaudeUserId ? { type: 'slack' } : { type: 'user', userId }
}

function actorName(payload: Json): string {
  const actor = obj(payload.actor)
  return str(actor?.name) ?? str(actor?.email) ?? 'ktoś'
}

/** Routes an Issue webhook (cases a, c, d, e). */
export function routeIssue(payload: Json, cfg: RoutingConfig): RouteResult {
  const data = obj(payload.data)
  const issue = data ? issueFromData(data) : undefined
  if (!issue) return { deliveries: [], skipped: ['issue: no data'] }
  if (!isTeamIssue(issue, cfg)) return { deliveries: [], skipped: [`issue ${issue.identifier}: other team`] }
  const result: RouteResult = { issue, deliveries: [], skipped: [] }
  if (payload.action !== 'update') return result

  const from = obj(payload.updatedFrom) ?? {}
  const stateChanged = 'stateId' in from && from.stateId !== data!.stateId
  const assigneeChanged = 'assigneeId' in from && from.assigneeId !== issue.assigneeId
  const state = issue.stateName ?? ''
  const actor = actorName(payload)
  const ts = str(payload.createdAt) ?? new Date().toISOString()
  const shared = isShared(issue, cfg)

  if (state === cfg.approved && (stateChanged || assigneeChanged)) {
    if (shared) {
      result.deliveries.push({ target: { type: 'slack' }, event: makeEvent('task_approved', issue, actor, ts) })
    } else if (issue.assigneeId) {
      result.deliveries.push({ target: userTarget(issue.assigneeId, cfg), event: makeEvent('task_approved', issue, actor, ts) })
    } else {
      result.skipped.push(`${issue.identifier}: approved without assignee`)
    }
  } else if (stateChanged && state === cfg.review) {
    if (issue.creatorId) {
      result.deliveries.push({ target: userTarget(issue.creatorId, cfg), event: makeEvent('task_ready_for_review', issue, actor, ts) })
    } else {
      result.skipped.push(`${issue.identifier}: review without creator`)
    }
  } else if (stateChanged && cfg.closed.includes(state)) {
    if (issue.assigneeId) {
      result.deliveries.push({ target: userTarget(issue.assigneeId, cfg), event: makeEvent('task_closed', issue, actor, ts) })
    } else {
      result.skipped.push(`${issue.identifier}: closed without assignee`)
    }
  }
  return result
}

/** Comment payloads carry only a thin `issue`; the caller supplies the cached IssueInfo. */
export function commentIssueId(payload: Json): string | undefined {
  const data = obj(payload.data)
  return str(data?.issueId) ?? str(obj(data?.issue)?.id)
}

/** Routes a Comment webhook (case b). `issue` comes from the Directory cache or a Linear lookup. */
export function routeComment(payload: Json, issue: IssueInfo | undefined, cfg: RoutingConfig): RouteResult {
  const data = obj(payload.data)
  if (!data) return { deliveries: [], skipped: ['comment: no data'] }
  if (payload.action !== 'create') return { deliveries: [], skipped: [] }
  if (!issue) return { deliveries: [], skipped: [`comment ${str(data.id)}: unknown issue ${commentIssueId(payload)}`] }

  // A thin issue object in the comment can carry fresher title/team; prefer cached routing fields.
  const thin = obj(data.issue)
  const merged: IssueInfo = {
    ...issue,
    identifier: issue.identifier || str(thin?.identifier) || issue.id,
    title: str(thin?.title) ?? issue.title,
    url: issue.url || str(thin?.url) || '',
    teamKey: issue.teamKey ?? str(obj(thin?.team)?.key),
    teamId: issue.teamId ?? str(thin?.teamId),
  }
  if (!isTeamIssue(merged, cfg)) return { deliveries: [], skipped: [`comment on ${merged.identifier}: other team`] }

  const authorId = str(data.userId) ?? str(obj(data.user)?.id)
  if (!authorId) return { deliveries: [], skipped: [`comment on ${merged.identifier}: no human author`] }

  const target = authorId === merged.assigneeId ? merged.creatorId : merged.assigneeId
  if (!target) return { deliveries: [], skipped: [`comment on ${merged.identifier}: nobody to notify`] }
  if (target === authorId) return { deliveries: [], skipped: [`comment on ${merged.identifier}: author is the target`] }

  const actor = str(obj(data.user)?.name) ?? actorName(payload)
  const ts = str(data.createdAt) ?? str(payload.createdAt) ?? new Date().toISOString()
  const body = truncate(str(data.body) ?? '', COMMENT_MAX_CHARS)
  const event = makeEvent('comment', merged, actor, ts, { comment: body, comment_url: str(data.url) ?? str(payload.url) })
  return { deliveries: [{ target: userTarget(target, cfg), event }], skipped: [] }
}

const SLACK_TEMPLATES: Record<EventKind, (e: HubEvent) => string> = {
  task_approved: (e) => `zadanie ${e.issue} jest zatwierdzone: ${e.title} ${e.url}`,
  comment: (e) => `nowy komentarz od ${e.actor} w ${e.issue}: ${e.title} ${e.comment_url || e.url}`,
  task_ready_for_review: (e) => `zadanie ${e.issue} czeka na sprawdzenie: ${e.title} ${e.url}`,
  task_closed: (e) => `zadanie ${e.issue} jest zamknięte (${e.state}): ${e.title} ${e.url}`,
}

/** Slack text for the shared Claude. The literal mention is what wakes it. */
export function slackText(event: HubEvent, claudeUserId: string): string {
  const safe = (s: string) => s.replace(/[<>]/g, '').replace(/@(channel|here|everyone)/gi, '$1')
  const text = SLACK_TEMPLATES[event.kind]({ ...event, title: safe(event.title), actor: safe(event.actor) })
  return `<@${claudeUserId}> ${text}`
}
