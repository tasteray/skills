# Quality Rules

Each quality rule with its rationale and the specific failure mode it prevents.

A "next steps" block that violates these is worse than no block at all — because it converts a trust-building moment into a trust-eroding one.

---

## Rule 1: Max 4 exits

### The rule
Three exits is the sweet spot. Two is fine. Four is the ceiling. Never five or more.

### Rationale
Each exit is a request for the user's attention. More than four exits trigger choice paralysis — the user closes the app instead of choosing. Research on choice overload (Iyengar & Lepper) shows decision quality drops sharply past ~3–4 options when the choices are similar in kind.

In addition: every additional exit dilutes the curation signal. Two perfect exits say "I picked these specifically for you." Six exits say "here's a list."

### Failure mode
**Symptom:** User reads the exits, doesn't pick any, scrolls away.
**Diagnosis:** Block was too long. They couldn't choose.

### How to enforce
- Hard cap at 4. If you're tempted to add a 5th, you have to remove one.
- Prefer 3 over 4 unless the 4th meaningfully adds a missing modality.

---

## Rule 2: Every exit has a pivot

### The rule
Every exit must contain a phrase that connects it to *this specific conversation*. If the exit could be copy-pasted into a different conversation about a different film and still make sense, it is generic and must be rewritten.

### Rationale
The exits block is the moment where the system either proves it was listening or proves it wasn't. A pivot ("since you noticed the funeral scene as a transfer of love…") is concrete evidence of listening. A bare film title is the algorithm's giveaway.

Psychologically, the pivot does two things:
1. Validates the user's perceptiveness ("the system noticed what you noticed")
2. Earns trust for the recommendation ("if it understood my reading, it probably understands my taste")

### Failure mode
**Symptom:** Exits look generic, identical in flavor to "people also watched."
**Diagnosis:** No pivots. The block could appear in any conversation.

### How to enforce
- Read each exit. Ask: *would this make sense if dropped into a conversation about a different film?* If yes — rewrite.
- The pivot phrase often borrows a specific 2–4 word fragment from the analysis itself ("transfer of love under pressure", "ideology cracks", "controlled artistry"). Reuse the actual language. It signals continuity.

---

## Rule 3: Graceful fallback

### The rule
If you cannot confidently locate a quality video essay or clip, leave it out. An exits block of two strong items is better than three with one mediocre filler.

### Rationale
The exits block sets a quality expectation. The user opens the first link. If it's bad — low audio, fan compilation, dead link, off-topic content — the credibility of the entire block (and the system) collapses with one click.

One bad link erodes more trust than one missing link.

### Failure mode
**Symptom:** User clicks the first exit, gets bad content, doesn't click another.
**Diagnosis:** A weak source was included to "fill" the block. Should have been omitted.

### How to enforce
- Default to omitting any exit you can't verify with the tools.
- Compensate with one more strong exit of a different type if needed.
- A 2-item block is fine. A 4-item block with one weak item is not.

---

## Rule 4: Visual format separation

### The rule
The exits block is visually distinct from the analysis. Use a markdown horizontal rule (`---`) or a clearly labeled section header (e.g., `**Watch it deeper**`). The exits do not bleed into the prose of the analysis.

### Rationale
Visual separation does two things:
1. **Cognitive shift:** signals to the reader that the mode has changed — from reading to choosing
2. **Scannability:** lets users who have read enough analysis jump straight to action without re-reading

Without separation, the exits feel like more prose, and the user keeps reading instead of acting. The bridge sentence + horizontal rule is the moment of mode-switch.

### Failure mode
**Symptom:** Exits get lost in the body of the response; user finishes reading without noticing them.
**Diagnosis:** No visual break. The exits read as continuation of the analysis.

### How to enforce
- Always insert a `---` between analysis and bridge, or use clearly bolded section headers.
- Section labels in bold ("**Watch it deeper**", "**If this stayed with you**").
- Italics for film titles. Standard format consistently.

---

## Rule 5: One CTA, not both

### The rule
Either offer concrete exits **or** offer to continue the conversation ("I can break down X — want me to?"). Not both at full strength. If a continuation thread is hotter than the exits, prefer the continuation; if exits are stronger, end with at most one quiet (small, footnote-style) question.

### Rationale
Two simultaneous calls-to-action at equal weight paralyze choice. The user has to decide: pick an exit or ask the continuation? Most users decide by closing the app.

Hick's Law: reaction time increases with the log of the number of choices. With two equally-weighted CTAs at the bottom, the user is choosing between *modes* (act vs. continue), not just options — that's harder.

### Failure mode
**Symptom:** User reads the response, hesitates, takes no action, the conversation dies.
**Diagnosis:** Double CTA at equal weight. Indecision.

### How to enforce
- If the exits feel like the right closure, drop the continuation question entirely.
- If the continuation thread is hotter (there's a clearly more interesting place to go in the conversation), prefer it and use fewer or no exits.
- If you keep both, the continuation must be visually subordinated: shorter, lower-emphasis, ideally one short line at the very end.

---

## Rule 6: Source quality over quantity

### The rule
Prefer one canonical source (from [canonical-sources.md](./canonical-sources.md)) over three random uploads. A weak source destroys trust faster than a missing source.

### Rationale
The user does not click 3 exits to triangulate quality. They click the first one. If it's good, they may click another. If it's bad, they're done.

Therefore: every exit must be as strong as the first one. Quantity is irrelevant.

### Failure mode
**Symptom:** User reports "those video essays you linked are kinda mid."
**Diagnosis:** Low-quality sources were included to fill the block.

### How to enforce
- Reference the canonical sources list first.
- For non-listed sources, hold them to the same quality bar: long-form, well-edited, intellectually serious.
- Avoid reaction channels, "ending explained" channels, fan compilations.

---

## Rule 7: Availability awareness, only when known

### The rule
For film exits, include a one-token availability hint *only if confirmed* by the `check_availability` tool. If unknown, omit. Never guess.

### Rationale
A correct availability hint is the difference between intention ("I'll watch that someday") and action ("I'll watch that tonight on Netflix"). It's high value.

But a *wrong* hint destroys trust in a uniquely damaging way: the user opens Netflix, the film isn't there, they feel deceived. They won't trust future hints — even correct ones.

False positives are catastrophic. True negatives (no hint when one would have helped) are just slightly suboptimal.

### Failure mode
**Symptom:** "You said it was on Netflix but it's not."
**Diagnosis:** Guessed at availability. Should have omitted.

### How to enforce
- Only include availability hints when the tool returns a result.
- Tool unavailable? Omit the hint entirely.
- Never reason from "popular streaming film" → "probably on Netflix."

---

## Rule 8: Never hallucinate URLs, titles, or claims

### The cardinal rule
A hallucinated YouTube link, a misattributed video essay, a wrong streaming claim — these break trust irrecoverably. **Use the tools or omit.** No exceptions.

### Rationale
The exits block lives or dies on its first dead or wrong link. The user clicks once. If it's broken or wrong, the system has lied to them — even if the analysis above was excellent. Trust in the system collapses, and it doesn't easily recover.

The cost-benefit is asymmetric: an exit that's omitted costs a small amount of "less helpful." An exit that's wrong costs the user's trust in everything else the system says.

### Failure mode
**Symptom:** "That YouTube link doesn't exist." OR "That essay is by a different channel."
**Diagnosis:** Hallucination. Should never happen.

### How to enforce
- All clip and video essay exits must come from a tool result (`find_scene_video`, `find_video_essay`).
- All availability hints must come from `check_availability`.
- If the tool returns nothing, the exit does not appear. Period.
- Film titles and years can be cited from general knowledge — but verify spelling and year when in doubt.

---

## Compound Failure Mode: The Cumulative Trust Drop

Each rule violation individually causes a small trust loss. Multiple violations compound non-linearly:

| Violations | Approximate trust impact |
|---|---|
| 0 | Trust stable or rising — system feels curated |
| 1 (minor) | Trust slightly dented — user notices but forgives |
| 2 (related) | Trust noticeably down — user starts questioning the analysis above |
| 3+ | Trust collapses — user no longer trusts the analysis itself, attributes everything to algorithmic noise |

The lesson: it's not "how many rules can I bend?" It's "every rule is load-bearing for the whole response, including the analysis the user just read and trusted."

---

## Self-Check Before Sending

Before producing the final exits block, walk this checklist:

1. ☐ Are there 2–4 exits, no more?
2. ☐ Does every exit have a pivot phrase from this specific conversation?
3. ☐ Did I omit anything I couldn't verify?
4. ☐ Is there a visual separator before the exits?
5. ☐ Is there at most one CTA (either exits OR a continuation question, not both at equal weight)?
6. ☐ Are all sources from the canonical list or comparable quality?
7. ☐ Are availability hints only present when verified?
8. ☐ Did I avoid inventing any URL, title, or claim?

If any answer is no — fix it before sending. The exits block is the user's last impression of the response. It carries disproportionate weight.
