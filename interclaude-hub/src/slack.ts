export async function postSlack(token: string, channel: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ channel, text, unfurl_links: false, unfurl_media: false }),
  })
  const json = (await res.json().catch(() => ({ ok: false, error: `http ${res.status}` }))) as { ok: boolean; error?: string }
  return json
}
