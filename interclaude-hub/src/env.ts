import type { UserHub } from './user-hub'
import type { Directory } from './directory'

export interface Env {
  USER_HUB: DurableObjectNamespace<UserHub>
  DIRECTORY: DurableObjectNamespace<Directory>

  // vars (wrangler.jsonc)
  /** Team id (preferred, survives renames). */
  LINEAR_TEAM_ID?: string
  /** Team key, only a fallback when a payload carries no team id. */
  LINEAR_TEAM_KEY?: string
  LINEAR_ORG_URL_KEY?: string
  SLACK_CHANNEL_ID: string
  SLACK_CLAUDE_USER_ID: string
  STATE_APPROVED: string
  STATE_REVIEW: string
  STATES_CLOSED: string
  /** Label that marks a task for the shared Claude in Slack: matched by id or by name. */
  LABEL_SHARED_CLAUDE: string
  LABEL_SHARED_CLAUDE_ID?: string
  /** Linear user id used by the shared Claude in Slack. Events for this user go to Slack instead of a socket. */
  SHARED_CLAUDE_LINEAR_USER_ID?: string

  // secrets (all optional so the Worker boots without them)
  LINEAR_WEBHOOK_SECRET?: string
  LINEAR_OAUTH_CLIENT_ID?: string
  LINEAR_OAUTH_CLIENT_SECRET?: string
  /** Optional Linear API key, only used to look up an issue a comment points at when the hub has not seen it yet. */
  LINEAR_API_KEY?: string
  SLACK_BOT_TOKEN?: string
  DEBUG_TOKEN?: string
}
