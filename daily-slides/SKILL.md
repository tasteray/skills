---
name: daily-slides
description: Use when asked for a TasteRay team presentation in the daily template ("zrób prezentację na daily", "slajdy na daily", "deck na spotkanie zespołu"): one HTML file, one slide at a time, a tree of slides on the left. Carries the team's rules for what goes on a slide (one point, dated numbers, no interim A/B results) and how it looks (TasteRay fonts and colours, drawn charts, real screenshots).
---

# Daily slides

You build one self-contained HTML file with `assets/build_deck.py`. The page shows one slide at a
time; on the left a tree of areas and slides, "Slajd N z M · zostało K" and a progress bar.
Arrow keys and the tree both navigate; the browser remembers the current slide.

## Self-improving

This file is the single source of truth for the deck rules, and it learns. Every time the person you build for reacts to a slide (a correction, a complaint, or praise of something that finally works), in the same turn: fix the slide, then write the lesson into the rules below as a positive rule with the date and their words in quotes. Sharpen an existing rule instead of adding a near-duplicate; replace a rule they overturned; delete one that went stale. Edit the source in the `tasteray/skills` repository (commit to main, per its CLAUDE.md), not an installed copy. Done when the rule is committed, not only said in the conversation.

## Work loop

1. **Ask first, then gather.** At the start ask the person, in one message: which period the deck
   covers, which areas or topics, and which sources you may use (repositories, data tools,
   meeting notes, Slack channels). Use only what you can actually reach; say which source you
   could not read instead of guessing. Then collect what happened from the sources of truth:
   - what was said and decided: daily and other meetings (meeting notes or transcripts), Slack
     threads; decisions come from there, read the exact words, never invent them;
   - what was built: commits and merged pull requests in the named repositories;
   - what is live: what is actually on production (check it, merged is not live);
   - the numbers: PostHog, the Funnels panel, Sentry.
   The task tracker says what was planned, not what happened; use it only for task names.
2. **Write each slide's point first, before any code.** For every slide, one sentence: the point,
   and what follows from it for the team (what to do, or not to do). Drop slides that have no
   point. Show this list to the person who asked before building, if they are in the conversation.
3. **Build.** Copy `assets/example.py` next to the deck (e.g. `daily-2026-11-19.py`), set its
   `ASSETS` line to the absolute path of this skill's `assets` folder, replace its
   slides, set the title and `key` (unique per deck, e.g. `daily-2026-11-19`), run it with
   `python3`. Keep screenshots in an `img/` folder next to it and embed them with `image()`.
4. **Look at every slide in a browser** at about 1440×900, with the arrow keys. Check: nothing
   clipped or overflowing, Polish letters (ą ę ł ń ś ź ż) drawn in the headline font, the slide
   fits one screen where possible. Fix and look again.
5. **Sync the task tracker.** Every Done or To do slide carries its tracker task id as a small linked chip in the tag line (24.11.2026: "Czy slajdy z wykonanymi zadaniami mają ich symbole z lineara"). The task's column tells the same story as the slide: shipped to the test version but not production is In Review, not Done. Every "next step" a slide promises has a task in the queue; create it if missing.
6. **Cold read.** Render every slide to PNG and give only the PNGs to a fresh subagent with no context: per slide its one-sentence meaning, what confuses in 5 seconds, a score 1-10, one fix. Tell it the deck owner's fixed choices so it does not argue with them. Fix everything under 9, re-render, re-run. Done when every slide scores 9+, or what remains is only the owner's own choices; say which. (23.11.2026: "Weryfikuj każdy slajd pod kątem czytelności. Musi być 10 na 10.")
7. **Deliver** the HTML file path. Never send it to anyone yourself.

## Rules for content

1. One slide = one point and one chart. Two points = two slides. Nothing changed = no numbers slide.
   No teletext: a headline of about eight words, labels of two to five words, one short grey
   source line; the rest is said aloud (23.11.2026: "Na slajdach nie może być teletekstu. Ludzie
   tego nie będą czytać.").
2. The headline (`h2`) is the point: what we did, what we will do, or what the data shows and why.
   Never a bare problem or a state ("działa, ale…"). It matches the picture exactly, numbers
   included ("Do aplikacji trafia 27 zamiast 5, ale znika 33 zamiast 10"). A cause the data only
   shows alongside is written as such ("Spadek przyszedł razem ze zniknięciem AD-25").
3. "Fixed X" alone is not a point. A numbers slide needs a consequence (in the headline or caption).
4. Every number carries its date range, says what it counts, and shows its base ("41 z 150 osób,
   12.11 do 18.11"; under a normalised "100": "z 256 kont"). No number without a range. A number
   from one test account says so; an estimate says "ok.".
5. Compare against several weeks, never against one peak week.
6. Breakdowns (country, web vs app, variant, source) only when the groups differ and that
   difference is the point; then show that one cut. Default is the overall number.
7. Groups under 30 people: no conclusion; show them faded (`lines()` does it with `min_n`) or
   leave them out.
8. Never show a running A/B test's interim result; a split goes on a slide only after its planned end.
9. Use the real names of things people see (screen titles, button labels), never "pytanie 1",
   "krok 2". An ad is its code plus its headline: AD-25 „Wiesz, czego nie chcesz?” (23.11.2026:
   "nie piszesz w ogóle jaka to jest reklama"). Use a non-breaking hyphen in codes so they never wrap.
10. Decisions and deadlines only if someone actually made them; a tracker due date is not a decision.
11. Source of truth is what happened (commits, production, data), not the task tracker.
12. Conclusions and decisions, never addressees ("Do X:") or invented attributions.
13. Done slides hold finished work only; each answers: what was done, is it fixed (on production
    since when), what is next. Put that in the caption. Work that is only in the test version says
    so in the card label ("W WERSJI TESTOWEJ"), never "TERAZ". Before against after compares the
    same measure on both sides, named once above the cards.
13a. A finding whose cause we know gets a follow-up slide right after it that shows the cause
    (23.11.2026: "potem nie ma followup a przecież mamy teorię dlaczego tak się dzieje").
14. Done and To do slides carry `problem=`: the problem the work solved, shown as a small
    warm-yellow "Problem: …" line above the headline.
15. Retention (team decision of 19.11.2026): core retention counts only people who use the mobile
    app; browser-only users are shown separately.

## Rules for the look

16. Anything about an interface: a real screenshot at phone width (from the browser or a phone),
    never a mock-up drawn from memory, cropped to what matters (empty backdrop cut off; 23.11.2026:
    "strasznie długa karta"). A two-step feature gets two screenshots side by side with a short
    caption under each.
17. Charts over tables and text (23.11.2026: "Jak najmniej rzeczy pokazuj w tabelach i jako tekst.
    Jak najwięcej w wykresach liniowych, w wykresach przepływów (Sankey) wtedy kiedy trzeba, w
    wykresach słupkowych"). When the person names a chart type, use exactly that one. Pick by
    what the data is:
    - **Trend over weeks:** line chart, one line per thing, its name written at the end of the line
      (leader lines when ends crowd), value labels on the main lines, the base under each x label,
      stopped things marked "· ostatnio 12.11". Never a legend dot (23.11.2026: "zielona kropka z
      dupy, która nic nie oznacza"), never a dot grid or table for a trend.
    - **Flow or loss of people:** Sankey normalised to 100, real base under the "100"; before
      against after as two Sankeys on the same scale, one above the other (23.11.2026: "Przepływy
      i gubienie pokazujemy sankeyem a nie tablicami"). End states are fair and exhaustive (e.g.
      "weszło na stronę / weszło do aplikacji / zniknęło", 23.11.2026: "Tak będzie fair"); a middle
      step only when the data splits every branch exactly.
    - **What ran when** (ads, campaigns, releases): calendar view, continuous days in columns, one
      row per item under its parent, cell brightness = volume with a labelled scale, a red "koniec
      D.M" at the end of each stopped row, a dashed marker on the key day.
    - **Comparison of a few values:** bars, `hbar()` or `vbars()`.
    - **Mechanism that is not a flow:** `journey()`, or Przed / Teraz with `pair()` and parallel rows.
    - **A single count of people:** `big()` or `grid()`.
    Sankey and calendar have no helper yet: draw them as inline SVG in the deck script.
18. Never text boxes joined by arrows, never a raw dashboard screenshot, never emoji as icons.
    Every colour sits next to the name it stands for; a colour that needs a legend is a bug.
    Icons are Lucide (`IC` in `build_deck.py`; add more from lucide.dev with `IC.update`).
19. No em or en dashes anywhere (`Deck.write` refuses them in headlines, problems and captions).
20. The caption (`cap=`) under the chart: date range, what the number means in one sentence, source.
21. Colours have meaning: `INK` the default data, `RED` the problem or loss, `MINT` good or done,
    `WARM` goals, `DIM` secondary or small samples. Fonts are fixed: Epilogue for headlines,
    Hanken Grotesk for text (TasteRay design system).

## Slide kinds

| kind | badge | tree marker | use for |
|---|---|---|---|
| `stat` | SPOSTRZEŻENIE | chart, blue | something we noticed (data, a user's words, a bug) and what follows from it |
| `done` | DONE | check, mint | finished work |
| `todo` | TO DO | diamond, yellow | what we do next |
| `ask` | DO PORUSZENIA | diamond, yellow | a blocker or a question for the team, no area |

Inside each area slides go Spostrzeżenie, Done, To do. These four kinds are the only ones: a store review, a data point or a bug report is content of a Spostrzeżenie, not a kind of its own. Areas follow the order given to `Deck(areas=[...])`.

## Helpers (all return HTML strings, combine with `+`)

- `card(*parts, label=, cls='compact', style=)`: dark panel; `label` says what and when.
- `pair(card, card)`, `side(screenshot, content)`, `image(path, alt, cls='cshot'|'shot')`
- `hbar(name, sub, value%, color, goal=, prev=)`, `vbars([(label, total, part)])`,
  `lines(labels, series, ymax, goal=)`, `grid(total, on, cols)`, `big(number, text, color)`
- `journey([(icon, title, subtitle, color, solid)])`, `row(icon, color, text)`,
  `fields([(label, value)])`, `legend([('dot'|'line'|'dash', color, text)])`, `task(text)`

`assets/example.py` shows one slide of each kind (made-up data): a Spostrzeżenie with a real screenshot beside the chart, a Done slide with Przed / Teraz, a To do slide and a Do poruszenia slide.
