import { describe, expect, it } from 'vitest'
import { routeComment, routeIssue, slackText, type IssueInfo } from '../src/routing'
import { ALICE, BOB, SHARED, cfg, commentPayload, issuePayload } from './fixtures'

const issue: IssueInfo = {
  id: 'issue-7',
  identifier: 'AGT-7',
  title: 'Zrób coś',
  url: 'https://linear.app/x/issue/AGT-7/zrob-cos',
  teamId: 'team-ic',
  stateName: 'W toku',
  assigneeId: ALICE,
  creatorId: BOB,
  labelNames: [],
}

describe('routeIssue', () => {
  it('a) moved to Zatwierdzone: task_approved to the assignee', () => {
    const r = routeIssue(issuePayload({ state: 'Zatwierdzone', prevStateId: 'state-Do akceptacji', assigneeId: ALICE }), cfg)
    expect(r.deliveries).toHaveLength(1)
    expect(r.deliveries[0]!.target).toEqual({ type: 'user', userId: ALICE })
    expect(r.deliveries[0]!.event).toMatchObject({ kind: 'task_approved', issue: 'AGT-7', title: 'Zrób coś', state: 'Zatwierdzone', actor: 'Bob Builder' })
    expect(r.issue?.creatorId).toBe(BOB)
  })

  it('a) reassigned while in Zatwierdzone: task_approved to the new assignee', () => {
    const r = routeIssue(issuePayload({ state: 'Zatwierdzone', prevAssigneeId: BOB, assigneeId: ALICE }), cfg)
    expect(r.deliveries.map((d) => d.target)).toEqual([{ type: 'user', userId: ALICE }])
  })

  it('a) approved without assignee is skipped', () => {
    const r = routeIssue(issuePayload({ state: 'Zatwierdzone', prevStateId: 'x' }), cfg)
    expect(r.deliveries).toHaveLength(0)
    expect(r.skipped[0]).toMatch(/without assignee/)
  })

  it('a) other edits of an approved issue do not re-notify', () => {
    const r = routeIssue(issuePayload({ state: 'Zatwierdzone', assigneeId: ALICE }), cfg)
    expect(r.deliveries).toHaveLength(0)
  })

  it('e) claude-slack + Zatwierdzone goes to Slack, not to the assignee', () => {
    const r = routeIssue(issuePayload({ state: 'Zatwierdzone', prevStateId: 'x', assigneeId: ALICE, labels: ['interclaude-slack'] }), cfg)
    expect(r.deliveries).toHaveLength(1)
    expect(r.deliveries[0]!.target).toEqual({ type: 'slack' })
    expect(slackText(r.deliveries[0]!.event, 'U09JLS5J7PT')).toBe(
      '<@U09JLS5J7PT> zadanie AGT-7 jest zatwierdzone: Zrób coś https://linear.app/x/issue/AGT-7/zrob-cos',
    )
  })

  it('c) moved to Do sprawdzenia: task_ready_for_review to the creator', () => {
    const r = routeIssue(issuePayload({ state: 'Do sprawdzenia', prevStateId: 'x', assigneeId: ALICE, creatorId: BOB }), cfg)
    expect(r.deliveries.map((d) => [d.target, d.event.kind])).toEqual([[{ type: 'user', userId: BOB }, 'task_ready_for_review']])
  })

  it('d) moved to Odrzucone or Gotowe: task_closed to the assignee', () => {
    for (const state of ['Odrzucone', 'Gotowe']) {
      const r = routeIssue(issuePayload({ state, prevStateId: 'x', assigneeId: ALICE }), cfg)
      expect(r.deliveries.map((d) => [d.target, d.event.kind])).toEqual([[{ type: 'user', userId: ALICE }, 'task_closed']])
    }
  })

  it('ignores other states, other teams, creates and removes', () => {
    expect(routeIssue(issuePayload({ state: 'W toku', prevStateId: 'x', assigneeId: ALICE }), cfg).deliveries).toHaveLength(0)
    const other = routeIssue(issuePayload({ state: 'Zatwierdzone', prevStateId: 'x', assigneeId: ALICE, team: { id: 'team-tr', key: 'TR', name: 'TasteRay' } }), cfg)
    expect(other.deliveries).toHaveLength(0)
    expect(other.issue).toBeUndefined()
    const created = routeIssue(issuePayload({ action: 'create', state: 'Zatwierdzone', assigneeId: ALICE }), cfg)
    expect(created.deliveries).toHaveLength(0)
    expect(created.issue?.identifier).toBe('AGT-7')
    expect(routeIssue(issuePayload({ action: 'remove', state: 'Zatwierdzone', assigneeId: ALICE }), cfg).deliveries).toHaveLength(0)
  })

  it('matches the team by id, so renaming the team key does not matter', () => {
    const p = issuePayload({ state: 'Zatwierdzone', prevStateId: 'x', assigneeId: ALICE, team: { id: 'team-ic', key: 'RENAMED', name: 'x' } })
    expect(routeIssue(p, cfg).deliveries).toHaveLength(1)
    const q = issuePayload({ state: 'Zatwierdzone', prevStateId: 'x', assigneeId: ALICE, team: { id: 'other', key: 'IC', name: 'x' } })
    expect(routeIssue(q, cfg).deliveries).toHaveLength(0)
    expect(routeIssue(q, { ...cfg, teamId: undefined, teamKey: 'IC' }).deliveries).toHaveLength(1)
  })

  it('e) matches the shared label by id even after a rename', () => {
    const p = issuePayload({ state: 'Zatwierdzone', prevStateId: 'x', assigneeId: ALICE, labels: ['old-name'], labelIds: ['label-shared-id'] })
    expect(routeIssue(p, cfg).deliveries[0]!.target).toEqual({ type: 'slack' })
  })

  it('routes events for SHARED_CLAUDE_LINEAR_USER_ID to Slack', () => {
    const r = routeIssue(issuePayload({ state: 'Zatwierdzone', prevStateId: 'x', assigneeId: SHARED }), { ...cfg, sharedClaudeUserId: SHARED })
    expect(r.deliveries[0]!.target).toEqual({ type: 'slack' })
    const r2 = routeIssue(issuePayload({ state: 'Do sprawdzenia', prevStateId: 'x', assigneeId: ALICE, creatorId: SHARED }), { ...cfg, sharedClaudeUserId: SHARED })
    expect(r2.deliveries[0]!.target).toEqual({ type: 'slack' })
    expect(slackText(r2.deliveries[0]!.event, 'U1')).toMatch(/^<@U1> zadanie AGT-7 czeka na sprawdzenie/)
  })
})

describe('routeComment', () => {
  it('b) comment by someone else goes to the assignee', () => {
    const r = routeComment(commentPayload({ authorId: BOB, authorName: 'Bob Builder' }), issue, cfg)
    expect(r.deliveries).toHaveLength(1)
    expect(r.deliveries[0]!.target).toEqual({ type: 'user', userId: ALICE })
    expect(r.deliveries[0]!.event).toMatchObject({ kind: 'comment', actor: 'Bob Builder', comment: 'Pytanie do Claude (Alice): czy to pilne?' })
  })

  it('b) comment by the assignee goes to the creator (the requester)', () => {
    const r = routeComment(commentPayload({ authorId: ALICE }), issue, cfg)
    expect(r.deliveries.map((d) => d.target)).toEqual([{ type: 'user', userId: BOB }])
  })

  it('b) skips when the author is the target', () => {
    const own = { ...issue, creatorId: ALICE }
    const r = routeComment(commentPayload({ authorId: ALICE }), own, cfg)
    expect(r.deliveries).toHaveLength(0)
    expect(r.skipped[0]).toMatch(/author is the target/)
  })

  it('b) skips unknown issues, other teams, bot comments, edits and unassigned issues', () => {
    expect(routeComment(commentPayload({ authorId: BOB }), undefined, cfg).skipped[0]).toMatch(/unknown issue/)
    expect(routeComment(commentPayload({ authorId: BOB }), { ...issue, teamId: 'team-tr' }, cfg).deliveries).toHaveLength(0)
    expect(routeComment(commentPayload({}), issue, cfg).skipped[0]).toMatch(/no human author/)
    expect(routeComment(commentPayload({ authorId: BOB, action: 'update' }), issue, cfg).deliveries).toHaveLength(0)
    expect(routeComment(commentPayload({ authorId: BOB }), { ...issue, assigneeId: undefined }, cfg).deliveries).toHaveLength(0)
  })

  it('b) truncates the comment body to 4000 chars', () => {
    const r = routeComment(commentPayload({ authorId: BOB, body: 'x'.repeat(5000) }), issue, cfg)
    expect(r.deliveries[0]!.event.comment!.length).toBe(4000)
  })
})

describe('slackText', () => {
  it('strips mentions and angle brackets from user-controlled text', () => {
    const r = routeIssue(issuePayload({ state: 'Zatwierdzone', prevStateId: 'x', labels: ['interclaude-slack'] }), cfg)
    const e = { ...r.deliveries[0]!.event, title: 'hej <!channel> @here' }
    expect(slackText(e, 'U1')).toBe('<@U1> zadanie AGT-7 jest zatwierdzone: hej !channel here https://linear.app/x/issue/AGT-7/zrob-cos')
  })
})
