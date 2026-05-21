# Canonical Sources

A curated list of video essay channels, clip sources, and interview platforms that the `discussion-followups` skill should prefer when locating exits.

The principle: **one source from this list outranks three random uploads.** A canonical source carries credibility; a random upload does not, and the user notices.

This list is not exhaustive — it's a *preference order*. If a non-listed source clearly matches the quality bar (long-form, well-edited, intellectually honest), it can be used. If in doubt, omit.

---

## Video Essay Channels — Theme / Character / Narrative

Prefer in roughly this order, based on consistency of quality and depth:

| Channel | Strength | Typical topics |
|---|---|---|
| **Every Frame a Painting** | Cinematic craft, editing, framing | Director styles, editing patterns, visual storytelling |
| **Lessons from the Screenplay** | Screenwriting, character, structure | Character motivation, dramatic structure, dialogue craft |
| **Like Stories of Old** | Philosophy, mythology, theme | Existential and philosophical readings, archetypal analysis |
| **Nerdwriter1** | Single-shot/scene analysis | Specific moments, performance, micro-craft |
| **The Discarded Image** | Auteur studies, classic cinema | Director retrospectives, historical context |
| **Now You See It** | Genre, motif, pattern across films | Cross-film patterns, genre conventions |
| **One Hundred Years of Cinema** | Film history, eras | Historical / decade-level surveys |
| **Thomas Flight** | Modern cinema, structure | Recent films, structural analysis |
| **Patrick (H) Willems** | Long-form deep dives | Director studies, genre essays |
| **Kaptainkristian** | Stylized auteur portraits | Visual signatures, director craft |
| **Just Write** | Story structure, screenwriting | Plot, character arcs, story logic |

### Selection notes

- **Match the channel to the question type.** Every Frame a Painting / Nerdwriter for craft (Type C). Lessons from the Screenplay / Like Stories of Old for theme (Type B). Nerdwriter / Every Frame a Painting for scene analysis (Type A).
- **Avoid reaction channels** unless the user explicitly asked for reactions.
- **Avoid recap/explainer channels** ("ending explained" content) — these are plot summary, not analysis.

---

## Scene Clip Sources

Prefer in this order:

1. **Official studio channels** on YouTube (Universal Pictures, Sony Pictures, A24, etc.) — always first choice; quality is high and the link is unlikely to die
2. **Movieclips** (Fandango's licensed clip channel) — large catalog, licensed, stable
3. **Criterion Collection / MUBI** clips — for arthouse / classic films
4. **Director's official channel** when one exists (e.g., individual director YouTube accounts)

### Avoid

- Random unlicensed full-scene uploads (legal risk, link rot)
- "Best scenes from [film]" compilation channels (low quality, often muted)
- Clips behind aggressive ads or interstitials

### When no clip exists

Some scenes have no clean clip available. **Do not invent one.** Either:

- Suggest the user watch the scene at the film's natural timestamp ("around minute 78 if you have it queued")
- Drop the visual companion exit entirely and compensate with another exit type

---

## Interview / Commentary Sources

For Type C (Director / Craft) exits, prefer:

| Source | Notes |
|---|---|
| **Criterion Collection** essays and supplements | Highest editorial quality |
| **DGA Quarterly** interviews | Long-form, craft-focused |
| **Film Comment** podcast and articles | Critical depth |
| **A24 Podcast** | For A24 directors |
| **The Director's Cut** podcast (DGA) | Director-on-director interviews |
| **Indiewire / NYT / Guardian** craft interviews | Mainstream but reliable |
| **Mark Kermode** interviews (BBC) | British craft journalism standard |

### Avoid

- Junket-style press tour interviews (PR-flavored, low signal)
- Fan compilations of "best [director] quotes"
- Lip-service interviews from short film festivals without editorial vetting

---

## Soundtrack / Music Sources

For Type A (scene/song) exits with a music focus:

| Source | Use |
|---|---|
| Official soundtrack on Spotify / Apple Music | For the specific track |
| Original artist's official channel | For original recording when a film uses a cover |
| Composer's official channel | For score discussion / behind-the-scenes |
| **Vox Earworm** / **Polyphonic** | For musical analysis of film music |
| **Sideways** (YouTube) | For film music craft analysis |

---

## Cross-Reference Channels (Sibling-Film Justification)

When suggesting a sibling film, the pivot can occasionally be strengthened by linking to a video essay that already makes the connection. Channels that frequently do cross-film mapping:

- **Now You See It** — pattern-across-films essays
- **The Cinema Cartography** — auteur cross-reference
- **One Hundred Years of Cinema** — historical mapping
- **Patrick (H) Willems** — genre and motif essays

---

## Maintenance

This list should be reviewed annually. Channels die, change focus, or decline in quality. When adding or removing entries:

- Require at least 12 months of consistent quality at the listed channel's strength area
- Remove channels that pivot to reaction / explainer content
- Prefer channels with at least 50 long-form essays (not one-off viral videos)

---

## Anti-Patterns in Sourcing

### Citing a channel as canonical without verifying the specific essay exists
A channel being on this list does NOT mean every essay you'd want from them exists. The `find_video_essay` tool must confirm the specific essay. If it doesn't return a result, omit — do not invent based on "they probably have one."

### Defaulting to the most famous channel
Every Frame a Painting is a great channel — but it stopped uploading in 2017. For modern films, that channel won't have coverage. Match the channel to the era and topic.

### Mixing fan channels and canonical channels in the same exits block
If even one exit cites a low-quality source, it drags down the credibility of the others. Either everything is canonical or the block reads as random links.
