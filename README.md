# TasteRay Skills

Psychological profiling skills for natural conversation.

## Installation

### Via Claude Code Plugin Marketplace

```bash
# Add the marketplace
/plugin marketplace add tasteray/skills

# Install the elicitation skill
/plugin install elicitation@tasteray-skills
```

### Via skills.sh

Install via [skills.sh](https://skills.sh):

```bash
# Install a specific skill
npx skills add tasteray/skills/elicitation

# Install all skills
npx skills add tasteray/skills
```

## Repository Structure

```
skills/
├── .claude-plugin/
│   └── marketplace.json   # Marketplace configuration for plugin installation
├── {skill-name}/
│   ├── SKILL.md           # Main skill file with YAML frontmatter + markdown instructions
│   └── references/        # Supporting reference files (optional)
└── README.md
```

## Skill File Format

Each skill has a `SKILL.md` with this structure:

```yaml
---
name: skill-name
description: Brief description used for skill matching/discovery. Include trigger phrases.
license: MIT
metadata:
  author: tasteray
  version: "1.0"
---

# Skill Title

Main skill instructions in markdown...
```

### Required Fields
- `name`: Unique identifier (lowercase, hyphens for spaces, max 64 chars)
- `description`: What the skill does and when to use it (max 1024 chars)

### Recommended Fields (for marketplace)
- `license`: License name (we use MIT)
- `metadata.author`: Author/organization name
- `metadata.version`: Semantic version

The YAML frontmatter `description` field is critical for skill discovery - it should include keywords and trigger phrases that help match user requests to the skill.

## Available Skills

| Skill | Description |
|-------|-------------|
| [elicitation](./elicitation/SKILL.md) | Psychological profiling through narrative identity research, self-defining memory elicitation, and Motivational Interviewing |

## Elicitation

The elicitation skill enables deep psychological profiling through patient, research-backed conversational techniques.

**Use when you need to:**
- Understand someone's core values and motivations
- Discover formative memories and life-defining experiences
- Detect emotional schemas and belief patterns
- Build psychological profiles through gradual disclosure
- Conduct user interviews that reveal deep insights
- Design conversational flows for personal discovery

**Example prompts:**
- "Help me understand this user's core motivations"
- "Design an interview to uncover their values"
- "What questions would reveal their formative experiences?"
- "Analyze this conversation for psychological patterns"

**Techniques included:**
- McAdams' Life Story Interview (8 key scenes)
- Singer's Self-Defining Memory elicitation
- OARS framework from Motivational Interviewing
- Schema detection via downward arrow technique
- Schwartz's Universal Values elicitation
- Haight's Structured Life Review
- Birren's Guided Autobiography themes

## Copyright & Sources

This skill synthesizes research from:

- **Jefferson Singer** - *The Remembered Self* (1993), Self-Defining Memory Task
- **Dan McAdams** - *The Redemptive Self* (2006), Life Story Interview
- **William Miller & Stephen Rollnick** - *Motivational Interviewing* (4th ed., 2023)
- **Jeffrey Young** - *Schema Therapy: A Practitioner's Guide* (2003)
- **Shalom Schwartz** - Theory of Basic Human Values (1992)
- **Barbara Haight** - *Handbook of Structured Life Review* (2007)
- **James Birren** - *Telling the Stories of Life* (2001)
- **James Pennebaker & Laura King** - LIWC research (1999)

## License

MIT License - See [LICENSE](./LICENSE)
