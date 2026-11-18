export const TEAM = { id: 'team-ic', key: 'IC', name: 'InterClaude' }
export const ALICE = 'aaaaaaaa-0000-4000-8000-000000000001'
export const BOB = 'bbbbbbbb-0000-4000-8000-000000000002'
export const SHARED = 'cccccccc-0000-4000-8000-000000000003'

export const cfg = {
  teamId: 'team-ic',
  approved: 'Zatwierdzone',
  review: 'Do sprawdzenia',
  closed: ['Gotowe', 'Odrzucone'],
  sharedLabel: 'interclaude-slack',
  sharedLabelId: 'label-shared-id',
}

/** Shape follows Linear's Issue webhook: data carries team, state, labels, assigneeId and creatorId. */
export function issuePayload(opts: {
  action?: 'create' | 'update' | 'remove'
  state: string
  prevStateId?: string | null
  assigneeId?: string
  prevAssigneeId?: string | null
  creatorId?: string
  labels?: string[]
  labelIds?: string[]
  team?: { id: string; key: string; name: string }
  id?: string
  identifier?: string
  ts?: number
}) {
  const from: Record<string, unknown> = { updatedAt: '2026-11-18T10:00:00.000Z' }
  if (opts.prevStateId !== undefined) from.stateId = opts.prevStateId
  if (opts.prevAssigneeId !== undefined) from.assigneeId = opts.prevAssigneeId
  return {
    action: opts.action ?? 'update',
    type: 'Issue',
    createdAt: '2026-11-18T10:00:01.000Z',
    actor: { id: BOB, name: 'Bob Builder', type: 'user' },
    url: 'https://linear.app/x/issue/AGT-7/zrob-cos',
    webhookTimestamp: opts.ts ?? Date.now(),
    webhookId: 'wh-1',
    organizationId: 'org-1',
    data: {
      id: opts.id ?? 'issue-7',
      identifier: opts.identifier ?? 'AGT-7',
      title: 'Zrób coś',
      url: 'https://linear.app/x/issue/AGT-7/zrob-cos',
      teamId: (opts.team ?? TEAM).id,
      team: opts.team ?? TEAM,
      stateId: `state-${opts.state}`,
      state: { id: `state-${opts.state}`, name: opts.state, type: 'unstarted' },
      assigneeId: opts.assigneeId,
      creatorId: opts.creatorId ?? BOB,
      labels: (opts.labels ?? []).map((name) => ({ id: `label-${name}`, name })),
      labelIds: opts.labelIds ?? (opts.labels ?? []).map((name) => `label-${name}`),
    },
    ...(opts.action === 'update' || opts.action === undefined ? { updatedFrom: from } : {}),
  }
}

export function commentPayload(opts: { authorId?: string; authorName?: string; issueId?: string; body?: string; action?: string; ts?: number }) {
  return {
    action: opts.action ?? 'create',
    type: 'Comment',
    createdAt: '2026-11-18T10:05:00.000Z',
    actor: { id: opts.authorId, name: opts.authorName ?? 'Someone', type: 'user' },
    url: 'https://linear.app/x/issue/AGT-7/zrob-cos#comment-1',
    webhookTimestamp: opts.ts ?? Date.now(),
    data: {
      id: 'comment-1',
      body: opts.body ?? 'Pytanie do Claude (Alice): czy to pilne?',
      issueId: opts.issueId ?? 'issue-7',
      issue: { id: opts.issueId ?? 'issue-7', title: 'Zrób coś' },
      userId: opts.authorId,
      user: opts.authorId ? { id: opts.authorId, name: opts.authorName ?? 'Someone' } : undefined,
      createdAt: '2026-11-18T10:05:00.000Z',
      url: 'https://linear.app/x/issue/AGT-7/zrob-cos#comment-1',
    },
  }
}
