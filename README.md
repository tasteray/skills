# TasteRay Skills

Skills that give AI agents the ability to understand people — what drives them, what they value, and what they'll love next.

Built on the open [Agent Skills](https://agentskills.io) standard. Works with [Claude Code](https://claude.ai/code), [Claude Cowork](https://claude.com/blog/cowork-research-preview), [OpenClaw](https://openclaw.ai/), [Cursor](https://cursor.com/), [OpenAI Codex](https://developers.openai.com/codex), [Gemini CLI](https://geminicli.com), [Windsurf](https://codeium.com/windsurf), [GitHub Copilot](https://github.com/features/copilot), [Goose](https://block.github.io/goose/), [Roo Code](https://roocode.com), and [other compatible agents](https://agentskills.io/home).

## What These Skills Do

TasteRay skills turn your AI agent into a perceptive conversationalist. Instead of asking blunt survey questions, the agent uses research-backed techniques to understand users through natural dialogue — then applies that understanding to deliver genuinely personalized recommendations.

The skills work together:

1. **Elicitation** — Understands who someone is through conversation
2. **Recommendations** — Uses that understanding to recommend what they'll love
3. **Discussion Follow-ups** — Closes every deep discussion with concrete next steps (clips, video essays, sibling films) instead of leaving the user with a wall of analysis

## Elicitation

Deep psychological profiling through patient, research-backed conversation. Your agent learns to uncover values, motivations, and formative experiences — not by interrogating, but by creating space for authentic self-disclosure.

**What it enables:**
- Understand someone's core values and motivations
- Discover formative memories and life-defining experiences
- Detect emotional schemas and belief patterns
- Build psychological profiles through gradual disclosure
- Conduct user interviews that reveal deep insights

**Grounded in research from:**
- McAdams' Life Story Interview (8 key scenes)
- Singer's Self-Defining Memory elicitation
- OARS framework from Motivational Interviewing
- Schema detection via downward arrow technique
- Schwartz's Universal Values elicitation
- Haight's Structured Life Review
- Birren's Guided Autobiography themes

**Try it:**
- "Help me understand this user's core motivations"
- "Design an interview to uncover their values"
- "Analyze this conversation for psychological patterns"

## Recommendations

Personalized recommendations powered by the TasteRay API. Your agent builds rich context from conversation — preferences, constraints, history, psychological profile — then delivers recommendations with explanations that connect to what actually matters to the user.

**Supported verticals:**
- Movies & TV
- Restaurants
- Products
- Travel destinations
- Jobs

**What it enables:**
- Answer "what would I like?" with genuine personalization
- Rank and score items based on individual taste
- Explain *why* something is a good match
- Combine with elicitation for deeper psychological context

**Try it:**
- "Recommend some movies for me"
- "What restaurant would I like near downtown?"
- "Help me find my next travel destination"
- "Why would I like this movie?"

## Discussion Follow-ups

Every deep analysis — a scene breakdown, a character study, a thematic dive — should hand the user somewhere to go. This skill enforces the **Depth → Bridge → 2–4 typed Exits** structure on top of any deep response: a one-line bridge that closes the emotional loop, plus 2–4 concrete next steps (clip, video essay, sibling film with a one-line "why this for *you*"), pivoted from the specific conversation rather than generic.

**What it enables:**
- End deep dives with a multimodal next step (clip, video essay, soundtrack, sibling scene)
- Surface sibling films with a pivot grounded in the actual conversation, not algorithmic similarity
- Match the modality of the follow-up to the modality of the question (sensory questions → visual companions; thematic questions → films + essays; craft questions → filmography + interview)
- Refuse to hallucinate URLs, attributions, or availability claims
- Gracefully degrade when canonical sources aren't available

**Grounded in:**
- Choice-overload research (Iyengar & Lepper) — hard cap at 4 exits
- Hick's Law — one CTA, not competing CTAs
- Curation-as-trust theory — quality of sources outweighs quantity
- Multimodal response design — match the modality of the question

**Try it:**
- "Tell me about the funeral scene in Captain Fantastic" (Type A — Scene/Song/Moment)
- "Why does this character do what they do?" (Type B — Character/Theme)
- "Why does this director frame the scene this way?" (Type C — Director/Craft)
- "How does this compare to [other film]?" (Type D — Comparative)

## About TasteRay

[TasteRay](https://www.tasteray.com) is an Emotional AI Recommendations API. It delivers personalized recommendations with human-readable explanations across 25+ verticals — movies, restaurants, travel, jobs, books, music, and more — using frontier LLMs combined with real-time web grounding.

The [TasteRay API](https://api.tasteray.com) accepts user context in any format (conversation excerpts, preference lists, unstructured profiles) and returns ranked recommendations with match scores, "why match" explanations, and key decision factors. Simple REST JSON interface, <3s p95 latency, 99.9% uptime SLA.

These skills bring TasteRay's capabilities directly into any compatible AI agent — no integration work required.

## Installation

Install via [skills.sh](https://skills.sh):

```bash
# Install a specific skill
npx skills add tasteray/skills/elicitation
npx skills add tasteray/skills/recommendations
npx skills add tasteray/skills/discussion-followups

# Install all skills
npx skills add tasteray/skills
```

## License

MIT — See [LICENSE](./LICENSE)
