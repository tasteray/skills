#!/usr/bin/env bash
# One-time setup of interclaude-hub: deploy, set the webhook secret, create the Linear webhook.
# Needs: wrangler logged in to the TasteRay Cloudflare account, and LINEAR_API_KEY (a Linear
# personal API key of a workspace admin) in the environment. Secrets are never printed.
set -euo pipefail
cd "$(dirname "$0")/.."

: "${LINEAR_API_KEY:?Set LINEAR_API_KEY to a Linear personal API key (Settings > Security & access)}"
TEAM_ID="${LINEAR_TEAM_ID:-$(node -e "console.log(require('fs').readFileSync('wrangler.jsonc','utf8').match(/\"LINEAR_TEAM_ID\":\s*\"([^\"]+)\"/)[1])")}"

bun install --frozen-lockfile
deploy_out="$(npx wrangler deploy 2>&1 | tee /dev/stderr)"
HUB_URL="${HUB_URL:-$(grep -oE 'https://[a-z0-9.-]+\.workers\.dev' <<<"$deploy_out" | head -1)}"
: "${HUB_URL:?Could not read the Worker URL from wrangler output; pass HUB_URL=https://...}"
echo "Hub URL: $HUB_URL"

secret="$(openssl rand -hex 32)"
printf '%s' "$secret" | npx wrangler secret put LINEAR_WEBHOOK_SECRET >/dev/null
echo "LINEAR_WEBHOOK_SECRET set"

body="$(SECRET="$secret" URL="$HUB_URL/linear/webhook" TEAM="$TEAM_ID" node -e '
  process.stdout.write(JSON.stringify({
    query: "mutation($input: WebhookCreateInput!) { webhookCreate(input: $input) { success webhook { id url enabled } } }",
    variables: { input: { label: "InterClaude hub", url: process.env.URL, teamId: process.env.TEAM, resourceTypes: ["Issue", "Comment"], secret: process.env.SECRET, enabled: true } },
  }))')"
printf '%s' "$body" | curl -sS https://api.linear.app/graphql -H 'Content-Type: application/json' -H "Authorization: $LINEAR_API_KEY" --data @- \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s);if(!r.data?.webhookCreate?.success){console.error(JSON.stringify(r.errors??r));process.exit(1)}console.log("Linear webhook created:",r.data.webhookCreate.webhook.id)})'

curl -sS "$HUB_URL/health"; echo
