# tasteray-deck

TasteRay team presentations in the daily template: one HTML file, one slide at a time, a tree of
slides on the left, four slide kinds (Spostrzeżenie, Zrobione, Do zrobienia, Do poruszenia) and the
team's rules for content and look.

Install in Claude Code:

```
/plugin marketplace add tasteray/skills
/plugin install tasteray-deck@tasteray-skills
```

(If `tasteray-skills` is already added: `/plugin marketplace update tasteray-skills` first.)
Then ask Claude "zrób prezentację na daily". Needs Python 3, nothing else.

Try it: run `assets/example.py` from any folder; it writes `example-deck.html` there (made-up data,
one slide per kind).
