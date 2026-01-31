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
