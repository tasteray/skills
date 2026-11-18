import type { Env } from './env'
import { isFreshTimestamp, verifyLinearSignature } from './signature'
import { commentIssueId, configFromEnv, issueFromData, routeComment, routeIssue, slackText, type Delivery, type IssueInfo, type RouteResult } from './routing'
import { postSlack } from './slack'
import { LINEAR_GRAPHQL_URL } from './oauth'

export const MAX_WEBHOOK_BYTES = 512 * 1024

const json = (body: unknown, status = 200) => Response.json(body, { status })

function directory(env: Env) {
  return env.DIRECTORY.get(env.DIRECTORY.idFromName('main'))
}

/** Fallback when a comment lands on an issue the hub has not seen yet. Only with LINEAR_API_KEY. */
async function lookupIssue(env: Env, id: string): Promise<IssueInfo | undefined> {
  if (!env.LINEAR_API_KEY) return undefined
  const res = await fetch(LINEAR_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: env.LINEAR_API_KEY },
    body: JSON.stringify({
      query: 'query($id:String!){ issue(id:$id){ id identifier title url team{id key} state{name} assignee{id} creator{id} labels{nodes{name}} } }',
      variables: { id },
    }),
  })
  if (!res.ok) return undefined
  const body = (await res.json()) as { data?: { issue?: Record<string, unknown> } }
  return body.data?.issue ? issueFromData(body.data.issue) : undefined
}

export async function dispatch(env: Env, deliveries: Delivery[]): Promise<string[]> {
  const lines: string[] = []
  for (const d of deliveries) {
    const label = `${d.event.kind} ${d.event.issue}`
    if (d.target.type === 'slack') {
      if (!env.SLACK_BOT_TOKEN) {
        lines.push(`${label} -> slack: skipped (no SLACK_BOT_TOKEN)`)
        continue
      }
      const r = await postSlack(env.SLACK_BOT_TOKEN, env.SLACK_CHANNEL_ID, slackText(d.event, env.SLACK_CLAUDE_USER_ID))
      lines.push(`${label} -> slack: ${r.ok ? 'posted' : `error ${r.error}`}`)
    } else {
      const hub = env.USER_HUB.get(env.USER_HUB.idFromName(d.target.userId))
      const r = await hub.enqueue(d.event)
      lines.push(`${label} -> user ${d.target.userId}: ${r.delivered ? 'pushed' : 'queued'} (pending ${r.pending})`)
    }
  }
  return lines
}

export async function handleWebhook(request: Request, env: Env): Promise<Response> {
  if (!env.LINEAR_WEBHOOK_SECRET) return json({ error: 'webhook secret not configured' }, 503)
  const len = Number(request.headers.get('Content-Length') ?? '0')
  if (len > MAX_WEBHOOK_BYTES) return json({ error: 'too large' }, 413)
  const raw = await request.text()
  if (raw.length > MAX_WEBHOOK_BYTES) return json({ error: 'too large' }, 413)
  if (!(await verifyLinearSignature(raw, request.headers.get('Linear-Signature'), env.LINEAR_WEBHOOK_SECRET))) {
    return json({ error: 'bad signature' }, 401)
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(raw)
  } catch {
    return json({ error: 'bad json' }, 400)
  }
  if (!isFreshTimestamp(payload.webhookTimestamp)) return json({ error: 'stale' }, 401)

  const dir = directory(env)
  const deliveryId = request.headers.get('Linear-Delivery')?.slice(0, 100)
  if (deliveryId && !(await dir.claimDelivery(deliveryId))) return json({ ok: true, duplicate: true })

  try {
    const cfg = configFromEnv(env)
    let result: RouteResult
    if (payload.type === 'Issue') {
      result = routeIssue(payload, cfg)
      if (result.issue && payload.action !== 'remove') await dir.putIssue(result.issue)
    } else if (payload.type === 'Comment') {
      const issueId = commentIssueId(payload)
      let issue = issueId ? await dir.getIssue(issueId) : undefined
      if (!issue && issueId) {
        issue = await lookupIssue(env, issueId)
        if (issue) await dir.putIssue(issue)
      }
      result = routeComment(payload, issue, cfg)
    } else {
      result = { deliveries: [], skipped: [`type ${String(payload.type)}: ignored`] }
    }

    const lines = await dispatch(env, result.deliveries)
    const head = `${String(payload.type)}.${String(payload.action)} ${result.issue?.identifier ?? ''}`.trim()
    const all = [...lines, ...result.skipped].map((l) => `${head}: ${l}`)
    if (all.length === 0) all.push(`${head}: no event`)
    for (const l of all) console.log(l)
    await dir.log(all, raw)
    return json({ ok: true, delivered: result.deliveries.length })
  } catch (err) {
    if (deliveryId) await dir.releaseDelivery(deliveryId)
    console.error('webhook failed', err)
    return json({ error: 'internal' }, 500)
  }
}
