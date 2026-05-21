---
name: discussion-followups
description: 'Concrete next-step extensions after a deep discussion of a film, scene, song, character, director, or theme. Use when you need to: (1) end a deep analysis with concrete follow-ups (clips, scene breakdowns, video essays, sibling films), (2) bridge from text analysis to visual or multimodal companion material, (3) recommend sibling films grounded in the specific thread of the current conversation, (4) close emotional loops opened by deep analysis with sensory next steps, (5) convert intellectual engagement into action (watch trailer, queue film, find essay), (6) maintain conversational momentum without producing more walls of text, (7) structure the closing of any "deep dive" response so it hands the user somewhere to go.'
license: MIT
metadata:
  author: tasteray
  version: "1.0"
---

# Discussion Follow-ups

Concrete next steps after a deep discussion — visual companions, sibling films, the right thread to pull.

## Goal

When extending a deep discussion with follow-ups — whether for a scene breakdown, song analysis, character study, thematic deep dive, or craft discussion — **your goal is to achieve a 10/10 score**.

Score all work on a 0-10 scale based on adherence to the principles and techniques in this skill. Provide your assessment as **X/10** with specific feedback on what's working and what needs improvement to reach 10/10.

A 10/10 means the work:
- Closes the emotional loop opened by the analysis
- Offers 2–4 concrete next steps, never more
- Pivots from this specific conversation, not a generic "you might also like"
- Mixes modalities (text + video + film) appropriately for the question type
- Falls back gracefully when no quality material exists
- Never hallucinates URLs, availability, or sources
- Avoids all anti-patterns

Iterate until you reach 10/10.

---

## Core Principle

**Depth without direction is a dead end.**

A long, careful analysis builds emotion in the user. If you leave them there, the emotion has nowhere to go and the conversation ends in passive consumption — the user closes the app and the system gets credit for "engaging" but loses the user's momentum.

Every deep response should hand the user three things:

1. **A bridge** — one sentence that carries the emotion forward
2. **A way to see it** — visual companion material (clip, scene analysis, video essay)
3. **A way to go further** — sibling films, related content, the next thread to pull

Key insight: **Users at the end of a deep analysis don't want more text. They want somewhere to go.**

The job of this skill is to make sure they always get it.

---

## When to Apply (the Rule)

This skill activates after any response that crosses the **deep discussion threshold**.

### Triggering question types

| Trigger | Examples |
|---|---|
| Scene / moment analysis | "Tell me about the Sweet Child O' Mine scene", "Break down the bus departure" |
| Song / soundtrack analysis | "Why does this song work here?", "What's the role of music in this film?" |
| Character study | "Why does Ben fail his own ideology?", "What is Anton Chigurh really after?" |
| Thematic deep dive | "What is the film saying about parenthood?", "Is this film pro- or anti-capitalist?" |
| Director / craft analysis | "Why does Ross frame this scene this way?", "What's the cinematographer doing here?" |
| Comparative analysis | "Why does this remind me of X?", "How does this compare to Y?" |

### The operational rule

After producing any response, evaluate:

1. **Length** — Is the analysis longer than ~150 words?
2. **Specificity** — Does it analyze a specific scene, song, character, theme, or craft choice?
3. **Engagement** — Did the user's question signal depth-seeking (not casual chitchat)?

**If yes to all three:** the response MUST end with the three-layer structure (Depth + Bridge + Exits).

**If unsure:** default to applying the rule. The downside of a small exits block on a borderline case is much smaller than leaving the user without exits on a real deep dive.

### Do NOT trigger on

- Simple metadata queries ("What year?", "Who directed it?", "Where can I watch?")
- The user's first "what should I watch" recommendation request — that goes through the `recommendations` skill directly without exits scaffolding
- One-line answers
- Casual acknowledgments ("That sounds cool", "Nice")

---

## The Three-Layer Response Shape

Every deep discussion now has this structure:

```
┌─────────────────────────────────────┐
│ 1. DEPTH                            │  ← unchanged
│    The analysis as before.          │
├─────────────────────────────────────┤
│ 2. BRIDGE                           │  ← new
│    One sentence that names the      │
│    emotional payload and announces  │
│    the move to next steps.          │
├─────────────────────────────────────┤
│ 3. EXITS                            │  ← new
│    2–4 concrete next steps,         │
│    typed by the question.           │
└─────────────────────────────────────┘
```

### The Bridge

A single sentence that does two things at once:

- Names the emotion or thought the analysis created
- Points toward what to do with it

**Examples:**

- "If that funeral scene stayed with you, there are a handful of films that do this same musical-grief move."
- "This is the kind of scene that's better watched a second time after you know what to look for — let me hand you the clip and one essay that goes deeper than I could in text."
- "The thread you pulled on — *controlled artistry meeting uncontrollable reality* — runs through a small set of films."

The bridge is the difference between a response that **ends** and a response that **hands off**.

### The Exits

Always 2–4. Never more. Typed by question (see next section).

Each exit has three parts:

1. **The artifact** — a clip, an essay title, a film title (with year)
2. **The source / availability** — channel name + URL, streaming service, etc.
3. **The pivot** — one line that connects this exit to *this specific conversation*

**The pivot is the whole game.** An exit without a pivot is a generic recommendation that could appear in any conversation. With a pivot, the exit becomes evidence that the system was listening.

---

## Exit Types (typed by question)

### Type A — Scene / Song / Moment

When the user asks about a specific moment, the question is at least partly **sensory**. Text alone can't honor it.

Default exits:

1. **Visual companion** — the scene itself (clip) or a video essay analyzing it
2. **Sibling scene from another film** — 1–2 films with an analogous moment, each pivoted from the current analysis
3. **(Optional) Adjacent material** — original recording, behind-the-scenes, cover version, soundtrack note

### Type B — Character / Theme

When the user asks about character motivation or thematic ideas, the question is **conceptual**. The honoring follow-up is more films, not more video.

Default exits:

1. **Sibling films** — 2–3 films with the same thematic spine, each pivoted from the current conversation
2. **Video essay** — one thematic deep dive if a canonical one exists
3. **(Optional) Director's adjacent work** — earlier or later film by the same director that works the same theme

### Type C — Director / Craft

When the user asks about directorial choices, cinematography, editing, etc., the question is **technical-aesthetic**.

Default exits:

1. **Director's filmography** — 1–2 films that show this technique evolving in their work
2. **Interview / commentary** — director discussing the choice, if a canonical source exists
3. **Sibling film by different director** — same technique, different sensibility (contrast is teaching)

### Type D — Comparative

When the user compares this film to another, the question is **relational**. They're already in mapping mode.

Default exits:

1. **One film of resonance** — even closer to what they're tracking than their reference point
2. **One film of contrast** — same surface, opposite philosophy
3. **(Optional) Video essay on the comparison** — if a canonical one exists

See [Exit Types Reference](./references/exit-types.md) for worked examples per type.

---

## Quality Rules (inviolable)

A "next steps" block that violates these is worse than no block at all.

### Rule 1: Max 4 exits
Three is the sweet spot. Two is fine. Four is the ceiling. Five is a link dump. Less is more.

### Rule 2: Every exit has a pivot
Every exit starts with — or contains — a phrase like "Since you [specific thing from the current analysis]...". If the exit could be copy-pasted into a different conversation, it is generic and must be rewritten.

### Rule 3: Graceful fallback
If you cannot confidently locate a quality video essay or clip, **leave it out**. An exits block of two strong items is better than one with a mediocre filler. Better still: never invent a source.

### Rule 4: Visual format separation
The exits block is visually distinct from the analysis. Use a markdown horizontal rule (`---`) or a clearly labeled section heading. Do not bleed prose into the exits — that signals "I'm still talking" instead of "here's where to go."

### Rule 5: One CTA, not both
Either offer concrete exits **or** offer to continue the conversation ("I can break down X — want me to?"). Not both at full strength. Two simultaneous CTAs paralyze choice. If a continuation thread is hotter than the exits, prefer the continuation; if exits are stronger, end with at most one quiet question.

### Rule 6: Source quality over quantity
Prefer one canonical video essay channel (see [canonical-sources.md](./references/canonical-sources.md)) over three random uploads. A weak source destroys trust faster than a missing source.

### Rule 7: Availability awareness, but only when known
For film exits, include a one-token availability hint **only if confirmed** ("on Netflix", "rent on Apple"). If you don't know, omit. It is the difference between intention and action — but a false claim erodes the whole system.

### Rule 8: Never hallucinate URLs, titles, or claims
This is the cardinal rule. A hallucinated YouTube link, a wrong video essay attribution, a made-up streaming availability — these break trust irrecoverably. **Use the tools or omit.** No exception.

See [Quality Rules Reference](./references/quality-rules.md) for failure modes and rationale.

---

## Format Template

```markdown
[Deep analysis — unchanged from current behavior]

---

**[Bridge sentence — one line that names the payload and turns toward next steps.]**

**Watch it deeper**
- [Clip or essay title] — [source/channel] · [one-line pivot from this conversation]
- [Clip or essay title] — [source/channel] · [one-line pivot]

**If this stayed with you**
- *[Film title]* (year, [availability if known]) — [one-line pivot from the current analysis]
- *[Film title]* (year, [availability if known]) — [one-line pivot]

[Optional single closing question — short. Or no closing line at all.]
```

Notes on format:
- Section labels ("Watch it deeper", "If this stayed with you") can be adapted per question type — see [worked-examples.md](./references/worked-examples.md).
- Emoji optional. Use only if the host UI consistently uses iconography and the product surface (TasteRay) already does. The skill enforces *structure*, not decoration.
- Italicize film titles. Plain text for video essays and clips. Bold for section labels.
- Never use both an exits block and "Want me to break down X next?" at the same intensity. Pick one.

---

## Tooling Integration

This skill expects the following tools to be available (or shimmed by the host environment). It works without them — but gracefully degrades.

| Tool | Purpose |
|---|---|
| `find_scene_video(film, scene_description)` | Locate a high-quality clip of a specific scene. Returns canonical/official sources preferentially. |
| `find_video_essay(film \| theme \| director)` | Locate a video essay. Returns canonical-channel results first (see [canonical-sources.md](./references/canonical-sources.md)). |
| `find_sibling_films(pivot_text, count)` | Wraps the `recommendations` skill with the bridge sentence as the primary context signal. |
| `check_availability(film_title)` | Returns current streaming/rental status. Cache TTL should be short. |

### Degradation matrix

| Tool missing | Behavior |
|---|---|
| `find_scene_video` | Omit clip exits entirely. Do not search-by-guess. |
| `find_video_essay` | Omit video essay exits entirely. |
| `find_sibling_films` | Hand off to the `recommendations` skill manually with the bridge sentence as profile context. |
| `check_availability` | Omit availability hints. Do not guess. |

**Critical:** Never invent a URL or a streaming availability claim. A hallucinated link is worse than a missing one — it breaks trust irrecoverably.

---

## Anti-Patterns

### The Link Dump
Listing five YouTube searches at the end of every answer.

**Instead:** 2–4 hand-picked exits per the typology.

### The Generic Sibling
"You might also like *No Country for Old Men*" with no pivot.

**Instead:** "Since the funeral scene worked on you as a transfer-of-love-under-pressure moment, *Manchester by the Sea* has the same emotional engineering in its hockey-rink scene."

### The Double CTA
Both "here are exits" AND "I can also break down X — want me to?"

**Instead:** Pick one. Exits when the deep dive feels complete. Continuation question when there's a clearly hotter thread.

### The Hallucinated URL
Inventing a YouTube link or video essay that "probably exists."

**Instead:** Use the tools or omit. Trust collapses on the first dead link.

### The Modality Mismatch
Recommending a 300-page book as a follow-up to a song question.

**Instead:** Match the modality of the question. Scene/song → visual + sibling scene. Theme → film + essay. Director → filmography + interview.

### The Exit-First Response
Leading with the exits block before the analysis.

**Instead:** Analysis always comes first. Exits earn their place by being preceded by depth.

### The Conversational Echo
Ending exits with "Hope this helps!", "Enjoy!", "Let me know how it goes!"

**Instead:** End on a single quiet question or on silence. The exits are the closure.

### The Sales-Pitch Tone
"You'll love this!", "A must-watch!", "Trust me on this one."

**Instead:** Confident but earned. "Closest in DNA to what we just talked about." No marketing voice.

### The Wall-of-Bullets
Exits formatted as a dense bulleted list without breathing room.

**Instead:** Two sections, max two items each. Visual hierarchy matters.

---

## Worked Example: The Sweet Child O' Mine Case

**User question:** *"give me deeper info on the 'sweet child of mine' performance at this movie"*

**Current behavior:** Long beautiful analysis, ends with "If you want, I can break down why that scene echoes the final 'bus departure' moment."

**New behavior:** Same analysis, then:

```
---

**That funeral scene works on you because it does the inverse of what the
original song does — it strips swagger to expose grief. A few places to go.**

**Watch it deeper**
- The scene itself (Captain Fantastic official clip) — worth a second watch
  now that you have the emotional thesis
- *Like Stories of Old: The Quiet Tragedy of Captain Fantastic* — picks up
  exactly where this stops, with the ideology-vs-grief reading

**If this scene stayed with you**
- *Manchester by the Sea* (2016) — same engineering: a family using ritual
  to hold grief that no system can touch
- *A Late Quartet* (2012) — what happens when controlled artistry collides
  with mortality you can't rehearse for

Want to keep pulling on the bus-departure thread, or take one of these?
```

Notice:

- The **bridge sentence** does double duty: it summarizes the emotional payload of the analysis ("strips swagger to expose grief") *and* announces the move to next steps.
- Each **exit pivots** from a specific phrase in the analysis ("transfer of love under pressure", "ideology cracks", "ritual").
- The **closing question** offers one optional thread — the original "If you want" — but does *not* compete with the exits at the same intensity. It's quieter, almost a footnote.
- The whole exits block is **5 lines of content** plus headers. It doesn't out-bulk the analysis.

See [Worked Examples](./references/worked-examples.md) for more cases across all four exit types.

---

## Integration with Other Skills

### With `recommendations`
The sibling-films exit type is a thin wrapper over the `recommendations` skill. The bridge sentence becomes part of the `profile` context. The current film becomes a high-rated history item.

When the `recommendations` skill is invoked **inside a deep discussion** (vs. as the primary user request), it defers to this skill for presentation — i.e., it doesn't produce its own full-form presentation, only the candidate films, which this skill places into the exits block with pivots.

### With `elicitation`
When the user shows strong response to a specific scene exit ("yes, give me *Manchester by the Sea*"), that response is a high-signal preference fact. Feed it back into the user's preference history with the linking thread ("responds to scenes of grief-as-ritual").

When the user *rejects* an exit ("not in the mood for grief"), that's equally high signal. Note the negative preference with the same thread.

### Cross-skill rule
- `recommendations` answers the question "what should I watch next?" as a primary request.
- `discussion-followups` answers the question "what do I do with this feeling I have right now?" as a closing move.

They are not redundant. They are sequenced.

---

## References

Detailed guides:

- [Exit Types](./references/exit-types.md) — Taxonomy with worked examples per question type
- [Canonical Sources](./references/canonical-sources.md) — Trusted video essay channels and clip sources
- [Quality Rules](./references/quality-rules.md) — Each rule with rationale and failure modes
- [Worked Examples](./references/worked-examples.md) — Full before/after responses across all four exit types

---

## Quick Reference

### The rule, one line
**Every deep response ends with Depth → Bridge → 2–4 typed Exits.**

### Exit types
- **A: Scene / Song** → visual companion + sibling scene
- **B: Character / Theme** → sibling films + video essay
- **C: Director / Craft** → filmography + interview
- **D: Comparative** → film of resonance + film of contrast

### Always
- 2–4 exits, never 5
- Every exit pivots from this conversation
- Visual separator before the exits
- Graceful fallback on missing material
- Sources from the canonical list when possible

### Never
- Hallucinate URLs, titles, or availability
- Use a double CTA (full exits + competing "want me to continue?")
- Generic sibling without a pivot
- Exits before the analysis
- More than 4 exits
- Sales-pitch tone
