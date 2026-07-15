# TasteRay Skills Repository

Commit directly to main

## Purpose

This repository contains skills for TasteRay's psychological profiling capabilities. Skills encode research-backed techniques for understanding users through natural conversation.

## Repository Structure

```
/
├── .gitignore
├── CLAUDE.md          # This file
├── LICENSE            # MIT License
├── README.md          # Skill catalog and installation
└── <skill-name>/
    ├── SKILL.md       # Main skill file with YAML frontmatter
    └── references/    # Supporting research and technique details
        └── *.md
```

## Skill File Format

Each skill has a `SKILL.md` file with YAML frontmatter:

```yaml
---
name: skill-name
description: 'Multi-line description of when to use this skill.
  Include specific use cases and trigger phrases.'
---
```

The body contains:
- Core principles and philosophy
- Research foundations with citations
- Specific techniques with examples
- Anti-patterns (what NOT to do)
- References section linking to detailed reference files

## Adding New Skills

1. Create a directory with the skill name (lowercase, hyphenated)
2. Add `SKILL.md` with proper YAML frontmatter
3. Add reference files in `references/` subdirectory
4. Update `README.md` with the new skill
5. Commit directly to main

## Installation

Skills are installed via the skills.sh installer:

```bash
npx skills add tasteray/skills/<skill-name>
```

Or install all skills:

```bash
npx skills add tasteray/skills
```

## Conventions

- Use academic citations where possible
- Include specific conversational examples
- Document anti-patterns explicitly
- Keep reference files focused on single topics
- Cross-reference between related techniques

## Session concierge — resource fit-check

Proposing the right session setup is Claude's job, not the user's. When the first real task of a session arrives, check — BEFORE starting work — whether the session has what the task needs:

1. Infer what the task touches using the resource map below.
2. Compare with what is actually available: cloned repos, MCP servers (probe via tool search — availability varies per user and environment), skills.
3. If something relevant is missing, open the reply with a short section "Setup for this task" / "Zestaw na to zadanie" (match the user's language): what's missing, why it matters (one phrase each), and the exact next step written for a non-technical reader. Do it yourself when possible (`add_repo` tool if present, MCP authorization links); ask the user only for what genuinely requires them. Start any work that can safely proceed in parallel.
4. If nothing is missing, don't mention resources at all — just do the task.
5. Never guess the other side of a cross-repo contract: if the task touches a contract whose other repo is not connected, treat that repo as missing.

### TasteRay resource map

Repos:
- `tasteray-mvp` — the app (Next.js): chat/Ray, onboarding, UI, API; owns the main D1 (`tasteray-d1`: users, titles, content, `notification_log`). PRs target `preview`, never `main`.
- `tasteray-postman` (brain) — cards, scenarios, picker, notification delivery, brain admin dashboard, Janina/Sherlock; own D1 (`tasteray-postman-d1`) and writes to mvp's D1. Merges to `main` auto-deploy.
- `tasteray-admin` — main admin SPA (separate from brain's dashboard).
- `tasteray-funnels` — funnels worker (same D1 binding pattern).
- `skills` — TasteRay product skills (elicitation, recommendations); connect only when editing them.

Cross-repo contracts (need BOTH repos in the session):
- Notifications end-to-end: brain writes `notification_log` in mvp's D1; the mvp bell reads it.
- Cards iframe: mvp `/cards` page ↔ brain ray-feed postMessage protocol (`'close-feed'`, `'no-cards'`, `cards:analytics`).
- Notification deep links `/cards?card=<id>`: brain generates them, mvp preserves them through login.

| Task type | Repos | MCP / skills |
|---|---|---|
| Cards, notifications, scenarios | `tasteray-postman`; add `tasteray-mvp` when touching mvp's D1, deep links, or `/cards` | Cloudflare (prod D1, logs), PostHog |
| App: chat, onboarding, UI | `tasteray-mvp`; add `tasteray-postman` at card touchpoints | ai-sdk, natively-expert, PostHog |
| Main admin panel | `tasteray-admin` + `tasteray-mvp` | GitHub |
| Data, metrics, reports | usually no repo needed | PostHog; Cloudflare for prod D1 |
| Ray profiling skills | `skills` | deep-research |
| PR review / CI babysitting | the PR's repo | GitHub MCP, /code-review, subscribe_pr_activity |

MCP notes: PostHog, GitHub, Slack, Gmail, Drive and Calendar are usually already connected in web sessions. Cloudflare Developer Platform and Linear are installed but need a ONE-TIME OAuth login — when relevant, generate the authorization link and walk the user through it. GitHub MCP scope follows the session's repos.

Adding a missing repo mid-session: use the `add_repo` tool (claude-code-remote MCP) if available; otherwise tell the user, in plain words, to start a new session from an environment that includes the needed repos.

> Duplicated verbatim in the CLAUDE.md of `tasteray-mvp`, `tasteray-postman`, and `skills` so it loads regardless of which repo the session includes — update all copies together.
