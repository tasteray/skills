"""TasteRay deck generator: one self-contained HTML file, one slide at a time,
a tree of slides on the left, arrow keys to move.

Use it from a small script next to the deck (see example.py):

    import sys; sys.path.insert(0, '<skill folder>/assets')
    from build_deck import *
    d = Deck('Daily · czwartek 19.11', key='daily-2026-11-19',
             areas=['Onboarding', 'Powroty'])
    d.slide('Onboarding', 'Liczby: ...', h2='...', body=card(...), cap='...', kind='stat')
    d.write('daily-2026-11-19.html')

Slide kinds: 'stat' (SPOSTRZEŻENIE), 'done' (DONE), 'todo' (TO DO), 'ask' (DO PORUSZENIA).
Every helper returns an HTML string; combine them with +.
"""
import base64
import html as H
import json
import mimetypes

# Colours of the TasteRay dark theme
BLUE = '#3970ff'   # brand blue (progress bar)
INK = '#6698ff'    # default data colour
MINT = '#7adbc0'   # good / done / target reached
RED = '#E8615A'    # the problem, the loss
WARM = '#F2C14E'   # goal lines, "Problem:" line, to-do markers
DIM = '#82828a'    # secondary, small samples
OFF = '#3a3a42'    # empty

# Lucide icons (https://lucide.dev, ISC licence), inner SVG only. Add more with IC.update({...}),
# copying the inner elements from lucide.dev/icons/<name>.
IC = {
    'user': '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.74"/>',
    'mail': '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    'phone': '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
    'db': '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
    'dash': '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    'globe': '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    'bell': '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    'check': '<path d="M20 6 9 17l-5-5"/>',
    'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    'diamond': '<path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"/>',
    'help': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    'spark': '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
    'bookmark': '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
    'eye': '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    'star': '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    'languages': '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
    'alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    'share': '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
    'moon': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    'megaphone': '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    'image': '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    'film': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/>',
    'chart': '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
}


def esc(t):
    """Escape text that comes from data (names, titles typed by users)."""
    return H.escape(str(t))


# ---------- small building blocks ----------

def ic(name, color=INK, size=22):
    """A Lucide icon as a standalone inline <svg> (for HTML rows, card headers)."""
    return (f'<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" stroke="{color}" '
            f'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{IC[name]}</svg>')


def icon(name, x, y, size, color, sw=1.6):
    """A Lucide icon placed inside a larger SVG, centred on (x, y)."""
    k = size / 24
    return (f'<g transform="translate({x - size / 2},{y - size / 2}) scale({k})" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{IC[name]}</g>')


def image(path, alt, cls='shot', style=''):
    """Embed a real screenshot (rule: interfaces are shown as real screenshots at phone width).
    cls='cshot' for a narrow phone screenshot beside a card, 'shot' for a wider one."""
    mime = mimetypes.guess_type(path)[0] or 'image/png'
    data = base64.b64encode(open(path, 'rb').read()).decode()
    st = f' style="{style}"' if style else ''
    return f'<img class="{cls}"{st} src="data:{mime};base64,{data}" alt="{esc(alt)}">'


def card(*parts, label='', cls='', style=''):
    """A dark rounded panel. label is the small grey line on top (what the chart counts, when)."""
    lab = f'<div class="lab">{label}</div>' if label else ''
    st = f' style="{style}"' if style else ''
    return f'<div class="card {cls}"{st}>{lab}{"".join(parts)}</div>'


def pair(*cards):
    """Cards side by side (Przed / Teraz, two groups)."""
    return f'<div class="pair">{"".join(cards)}</div>'


def side(left, right):
    """A screenshot (or any narrow block) on the left, content on the right."""
    return f'<div class="cs" style="flex-wrap:nowrap;gap:28px">{left}<div style="flex:1;max-width:820px">{right}</div></div>'


def row(icon_name, color, text):
    """One line with an icon in front (Przed / Teraz lists: 'x' in RED, 'check' in MINT)."""
    return f'<div class="rl">{ic(icon_name, color, 20)}<span>{text}</span></div>'


def big(number, text, color=INK):
    """One large number with its explanation (include the date range and the source in text)."""
    return f'<div class="big"><div class="n" style="color:{color}">{number}</div><div class="who">{text}</div></div>'


def task(text):
    """The tracker task this slide belongs to (To do slides)."""
    return f'<div class="task">Zadanie: {text}</div>'


def fields(items):
    """Label / value rows, e.g. [('Kto zobaczy', 'Wszyscy użytkownicy'), ...]."""
    rows = ''.join(f'<div class="fr"><div class="fl">{k}</div><div class="fv">{v}</div></div>' for k, v in items)
    return f'<div class="fields">{rows}</div>'


def legend(items):
    """Chart legend. items: list of (kind, colour, text); kind is 'dot', 'line' (goal) or 'dash'."""
    out = []
    for kind, col, text in items:
        if kind == 'dot':
            mark = f'<span class="dot" style="background:{col}"></span>'
        elif kind == 'line':
            mark = f'<span style="display:inline-block;width:3px;height:16px;background:{col};margin-left:10px"></span>'
        else:
            mark = f'<span style="display:inline-block;width:16px;border-top:2px dashed {col};margin-left:10px"></span>'
        out.append(f'{mark} {text}')
    return f'<div class="legend">{"".join(out)}</div>'


# ---------- charts ----------

def hbar(name, sub, value, color=INK, goal=None, prev=None):
    """One horizontal bar, value in percent (0 to 100).
    sub says what it counts ('41 z 150 osób'); goal draws a yellow line, prev a dashed grey one."""
    W = 600
    gl = (f'<line x1="{goal / 100 * W:.0f}" y1="0" x2="{goal / 100 * W:.0f}" y2="56" stroke="{WARM}" stroke-width="4"/>'
          if goal else '')
    pm = (f'<line x1="{prev / 100 * W:.0f}" y1="2" x2="{prev / 100 * W:.0f}" y2="54" stroke="#c8c8cc" '
          f'stroke-width="3" stroke-dasharray="5 5"/>' if prev else '')
    return (f'<div class="hb"><div class="hbn">{name}<span>{sub}</span></div>'
            f'<svg viewBox="0 0 {W} 56" width="100%" height="56" preserveAspectRatio="none">'
            f'<rect x="0" y="8" width="{W}" height="40" rx="10" fill="#1f1f25"/>'
            f'<rect x="0" y="8" width="{value / 100 * W:.0f}" height="40" rx="10" fill="{color}"/>{pm}{gl}</svg>'
            f'<div class="hbv" style="color:{color}">{value:.0f}%</div></div>')


def vbars(data, color=INK, total_color='#2f3a5c'):
    """A few vertical bars. data: list of (label, total, part). The part is drawn in color over
    the total (e.g. 'z reklam' inside all); pass part=total for plain bars."""
    W, Hh = 640, 260
    n = len(data)
    bw = 90
    gap = (W - n * bw) / (n + 1)
    mx = max(v for _, v, _ in data) or 1
    o = []
    for i, (lab, v, m) in enumerate(data):
        x = gap + i * (bw + gap)
        h = v / mx * (Hh - 60)
        y = Hh - 30 - h
        hm = m / mx * (Hh - 60)
        o.append(f'<rect x="{x:.0f}" y="{y:.0f}" width="{bw}" height="{h:.0f}" rx="8" fill="{total_color}"/>')
        o.append(f'<rect x="{x:.0f}" y="{Hh - 30 - hm:.0f}" width="{bw}" height="{hm:.0f}" rx="8" fill="{color}"/>')
        o.append(f'<text x="{x + bw / 2:.0f}" y="{y - 10:.0f}" text-anchor="middle" fill="#fafaf9" '
                 f'font-family="Epilogue" font-weight="600" font-size="28">{v}</text>')
        o.append(f'<text x="{x + bw / 2:.0f}" y="{Hh - 6}" text-anchor="middle" fill="{DIM}" font-size="16">{lab}</text>')
    return f'<svg viewBox="0 0 {W} {Hh}" width="100%" style="max-width:720px">{"".join(o)}</svg>'


def lines(labels, series, ymax, goal=None, ticks=None, now=None, min_n=30, unit='%'):
    """Line chart: history solid, forecast dashed, points with fewer than min_n people faded.

    labels: x-axis labels for history plus forecast points, e.g. ['5.08', ..., '18.11', '25.11'].
    series: list of dicts {'color': INK, 'hist': [(people, value), ...], 'fc': [value, ...]}
            'hist' covers the first len(hist) labels, 'fc' continues after the last history point.
    now: index of the last real point (default: the longest history); a 'prognoza' line is drawn
         there when any series has a forecast.
    ticks: indexes of labels to print (default: first, middle, now, last).
    """
    W, Hh, L, R, T, B = 420, 300, 40, 52, 16, 34
    N = len(labels)
    if now is None:
        now = max(len(s['hist']) for s in series) - 1
    X = lambda i: L + i * (W - L - R) / max(N - 1, 1)
    Y = lambda v: T + (1 - v / ymax) * (Hh - T - B)
    o = []
    for g in [ymax * k / 3 for k in range(4)]:
        o.append(f'<line x1="{L}" x2="{W - R}" y1="{Y(g):.0f}" y2="{Y(g):.0f}" stroke="#222228"/>'
                 f'<text x="{L - 8}" y="{Y(g) + 5:.0f}" text-anchor="end" fill="{DIM}" font-size="13">{g:.0f}{unit}</text>')
    if goal is not None:
        o.append(f'<line x1="{L}" x2="{W - R}" y1="{Y(goal):.0f}" y2="{Y(goal):.0f}" stroke="{WARM}" stroke-width="2" stroke-dasharray="5 5"/>')
    if any(s.get('fc') for s in series):
        o.append(f'<line x1="{X(now):.0f}" x2="{X(now):.0f}" y1="{T}" y2="{Hh - B}" stroke="{OFF}"/>'
                 f'<text x="{X(now) + 4:.0f}" y="{T + 12}" fill="{DIM}" font-size="12">prognoza</text>')
    for s in series:
        col, h, f = s['color'], s['hist'], s.get('fc') or []
        for i in range(len(h) - 1):
            ok = h[i][0] >= min_n and h[i + 1][0] >= min_n
            o.append(f'<line x1="{X(i):.0f}" y1="{Y(h[i][1]):.0f}" x2="{X(i + 1):.0f}" y2="{Y(h[i + 1][1]):.0f}" '
                     f'stroke="{col}" stroke-width="{3.5 if ok else 2}" stroke-opacity="{1 if ok else .35}" '
                     f'stroke-linecap="round"{"" if ok else " stroke-dasharray=\"1 5\""}/>')
        last_i = len(h) - 1
        if f:
            pts = [(last_i, h[-1][1])] + [(last_i + 1 + j, v) for j, v in enumerate(f)]
            o.append(f'<polyline points="{" ".join(f"{X(i):.0f},{Y(v):.0f}" for i, v in pts)}" fill="none" '
                     f'stroke="{col}" stroke-width="3" stroke-dasharray="7 6"/>')
            o.append(f'<text x="{X(pts[-1][0]) + 6:.0f}" y="{Y(f[-1]) + 6:.0f}" fill="{col}" font-family="Epilogue" '
                     f'font-weight="600" font-size="17">{f[-1]:.0f}{unit}</text>')
        if h[-1][0] >= min_n:
            o.append(f'<circle cx="{X(last_i):.0f}" cy="{Y(h[-1][1]):.0f}" r="5" fill="{col}"/>')
    for i in (ticks if ticks is not None else sorted({0, N // 2, now, N - 1})):
        o.append(f'<text x="{X(i):.0f}" y="{Hh - 10}" text-anchor="middle" fill="{DIM}" font-size="12">{labels[i]}</text>')
    return f'<svg viewBox="0 0 {W} {Hh}" width="100%">{"".join(o)}</svg>'


def journey(steps, W=1000):
    """A mechanism drawn as icons on a line (Przed / Teraz, what happens step by step).
    steps: list of (icon, title, subtitle, colour, solid). solid=False draws a step that has not
    happened yet (dashed circle, dotted line leading to it)."""
    n = len(steps)
    P = 130 if W >= 900 else 100
    xs = [P + i * (W - 2 * P) / max(n - 1, 1) for i in range(n)]
    j = []
    for i in range(n - 1):
        x1, x2 = xs[i] + 56, xs[i + 1] - 56
        dash = '' if steps[i + 1][4] else ' stroke-dasharray="2 12"'
        col = '#2f3a5c' if steps[i + 1][4] else '#2a2a30'
        j.append(f'<line x1="{x1}" y1="70" x2="{x2}" y2="70" stroke="{col}" stroke-width="4" stroke-linecap="round"{dash}/>')
    for x, (icn, a, b, col, solid) in zip(xs, steps):
        j.append(f'<circle cx="{x}" cy="70" r="52" fill="#121214" stroke="{col}" stroke-width="3"'
                 f'{"" if solid else " stroke-dasharray=\"6 7\""}/>')
        j.append(icon(icn, x, 70, 46, col))
        j.append(f'<text x="{x}" y="164" text-anchor="middle" class="ja" fill="{"#fafaf9" if solid else DIM}">{a}</text>')
        j.append(f'<text x="{x}" y="194" text-anchor="middle" class="jb">{b}</text>')
    return f'<svg class="journey" viewBox="0 0 {W} 210">{"".join(j)}</svg>'


def grid(total, on, cols, color=INK, size=22, gap=8):
    """'41 z 150' as dots: total circles, the first `on` filled."""
    out = []
    for i in range(total):
        r, c = divmod(i, cols)
        f = i < on
        out.append(f'<circle cx="{c * (size + gap) + size / 2}" cy="{r * (size + gap) + size / 2}" r="{size / 2 - 1}" '
                   f'fill="{color if f else "none"}" stroke="{color if f else OFF}" stroke-width="2"/>')
    rows = (total + cols - 1) // cols
    w = cols * (size + gap) - gap
    h = rows * (size + gap) - gap
    return f'<svg class="g" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{"".join(out)}</svg>'


# ---------- the deck ----------

TAGS = {'stat': ('SPOSTRZEŻENIE', 'var(--ink)'), 'done': ('DONE', 'var(--mint)'),
        'todo': ('TO DO', 'var(--warm)'), 'ask': ('DO PORUSZENIA', 'var(--warm)')}
KIND_ORDER = {'stat': 0, 'done': 1, 'ask': 1, 'todo': 2}


class Deck:
    def __init__(self, title, key, areas=None):
        """title: shown on top of the tree, e.g. 'Daily · czwartek 19.11'.
        key: unique per deck, remembers the current slide in the browser, e.g. 'daily-2026-11-19'.
        areas: order of areas in the tree; slides inside an area go Spostrzeżenie, Done, To do."""
        self.title, self.key, self.areas, self.slides = title, key, list(areas or []), []

    def slide(self, area, tree, h2, body, cap='', kind='done', problem=''):
        """area: the tree group. tree: short name in the tree. h2: the point of the slide.
        body: HTML from the helpers. cap: date range, definition, source, consequence.
        kind: 'stat' | 'done' | 'todo' | 'ask'. problem: the warm 'Problem: ...' line (done, todo)."""
        if kind not in TAGS:
            raise ValueError(f'kind must be one of {list(TAGS)}')
        if area not in self.areas:
            self.areas.append(area)
        self.slides.append((area, tree, problem, h2, body, cap, kind))

    def html(self):
        for (_, tree, prob, h2, _, cap, _) in self.slides:
            for t in (tree, prob, h2, cap):
                if '—' in t or '–' in t:
                    raise ValueError(f'em or en dash in slide text: {t[:80]}')
        order = {a: i for i, a in enumerate(self.areas)}
        slides = sorted(self.slides, key=lambda x: (order[x[0]], KIND_ORDER[x[6]]))
        secs = []
        for (area, tree, prob, h2, body, cap, kind) in slides:
            tg, tc = TAGS[kind]
            secs.append(
                f'<section class="slide" data-area="{esc(area)}" data-k="{kind}" data-t="{esc(tree)}">\n'
                f'<div class="tag"><b style="color:{tc}">{tg}</b>{"" if kind == "ask" else " · " + esc(area.upper())}</div>\n'
                + (f'<div class="prob">Problem: {prob}</div>\n' if prob else '')
                + f'<h2>{h2}</h2>\n<div class="body">{body}</div>\n'
                + (f'<div class="cap">{cap}</div>\n' if cap else '')
                + '</section>')
        mark = lambda name, col: (f'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="{col}" '
                                  f'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">{IC[name]}</svg>')
        marks = {'done': mark('check', MINT), 'stat': mark('chart', INK), 'todo': mark('diamond', WARM),
                 'ask': mark('diamond', WARM)}
        return PAGE.format(title=esc(self.title), slides='\n'.join(secs), key=self.key,
                           marks=json.dumps(marks))

    def write(self, path):
        with open(path, 'w', encoding='utf-8') as f:
            f.write(self.html())
        return path


PAGE = '''<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Epilogue:wght@500;600&family=Hanken+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{{--bg:#0a0a0b;--card:#121214;--fg:#fafaf9;--fg2:#c8c8cc;--dim:#82828a;--line:rgba(255,255,255,.08);--warm:#F2C14E;--mint:#7adbc0;--blue:#3970ff;--ink:#6698ff}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 'Hanken Grotesk',-apple-system,sans-serif}}
.wrap{{display:grid;grid-template-columns:270px 1fr;min-height:100vh}}
nav{{border-right:1px solid var(--line);padding:28px 18px;font-size:14px;background:#0d0d0f}}
nav h1{{font-family:Epilogue,sans-serif;font-weight:600;font-size:16px;margin:0 0 4px}}
nav .meta{{color:var(--dim);font-size:13px;margin-bottom:10px}}
.prog{{height:4px;background:var(--line);border-radius:2px;margin-bottom:20px}}.prog i{{display:block;width:0;height:100%;background:var(--blue);border-radius:2px;transition:width .2s}}
nav .area{{font-family:Epilogue,sans-serif;font-weight:500;font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin:18px 0 6px;color:var(--dim)}}
nav a{{display:flex;gap:8px;align-items:center;padding:4px 0 4px 2px;color:var(--fg2);text-decoration:none;cursor:pointer}}
nav a svg{{flex:none}}nav a.seen{{color:#55555c}}nav a.cur{{color:var(--fg);font-weight:600}}nav a.cur::before{{content:"›";margin-left:-12px;width:4px}}
main{{padding:44px 56px;display:flex;flex-direction:column}}
.slide{{display:none;max-width:1120px}}.slide.on{{display:flex;flex-direction:column;gap:20px}}
.body{{display:flex;flex-direction:column;gap:20px}}
.tag{{font-family:Epilogue,sans-serif;font-size:14px;letter-spacing:.14em;color:var(--dim)}}
.prob{{color:var(--warm);font-size:16px}}
.task{{font-size:15px;color:var(--fg2);border-left:3px solid var(--warm);padding:4px 0 4px 12px}}
.slide h2{{font-family:Epilogue,sans-serif;font-weight:600;font-size:38px;line-height:1.14;letter-spacing:-.5px;margin:0;max-width:1000px}}
.cap{{color:var(--dim);font-size:15px;max-width:1000px}}.cap a{{color:var(--fg2)}}
.pair{{display:flex;gap:24px;flex-wrap:wrap}}
.card{{flex:1;min-width:300px;background:var(--card);border-radius:16px;padding:26px 30px;display:flex;flex-direction:column;gap:14px}}
.lab{{font-size:17px;color:var(--fg2)}}
.n{{font-family:Epilogue,sans-serif;font-weight:600;font-size:56px;line-height:1.05;letter-spacing:-1.5px}}
.who{{font-size:16px;color:var(--dim)}}
svg.g{{max-width:100%;height:auto;max-height:170px;width:auto}}.card svg.g{{align-self:flex-start}}
.journey{{width:100%;max-width:1000px;height:auto;margin:10px 0}}
.journey .ja{{font-family:Epilogue,sans-serif;font-weight:600;font-size:24px}}.journey .jb{{font-size:19px;fill:var(--dim)}}
.big{{display:flex;align-items:baseline;gap:18px;flex-wrap:wrap}}
.legend{{display:flex;align-items:center;gap:8px;font-size:15px;color:var(--dim);flex-wrap:wrap}}
.dot{{width:12px;height:12px;border-radius:50%;display:inline-block;margin-left:10px}}.dot:first-child{{margin-left:0}}
.shot{{width:100%;max-width:560px;border-radius:10px;border:1px solid var(--line)}}
.cs{{display:flex;gap:36px;align-items:flex-start;flex-wrap:wrap}}.cshot{{width:250px;flex:none;border-radius:14px;border:1px solid var(--line)}}
.fields{{flex:1;min-width:300px;max-width:620px;display:flex;flex-direction:column}}.fr{{display:grid;grid-template-columns:170px 1fr;gap:18px;padding:12px 0;border-top:1px solid var(--line)}}.fr:first-child{{border-top:0;padding-top:0}}.fl{{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);padding-top:3px;line-height:1.4}}.fv{{font-size:15px;color:var(--fg);line-height:1.45}}
.rl{{display:flex;gap:12px;align-items:flex-start;font-size:17px;color:var(--fg);line-height:1.45}}.rl svg{{flex:none;margin-top:3px}}
.compact .hb{{padding:0}}.compact .hb svg{{height:28px}}.compact .hbv{{font-size:28px}}.compact .hbn{{font-size:16px}}.compact .hbn span{{font-size:12px}}
.hb{{display:grid;grid-template-columns:190px 1fr 110px;gap:20px;align-items:center;padding:8px 0}}.hbn{{font-size:20px;display:flex;flex-direction:column}}.hbn span{{font-size:14px;color:var(--dim)}}.hbv{{font-family:Epilogue,sans-serif;font-weight:600;font-size:48px;text-align:right}}
.ctrl{{margin-top:auto;padding-top:30px;display:flex;gap:10px}}
.ctrl button{{font:inherit;font-size:14px;padding:9px 16px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}}
@media (max-width:760px){{.wrap{{grid-template-columns:1fr}}nav{{border-right:0;border-bottom:1px solid var(--line)}}main{{padding:24px 16px}}.slide h2{{font-size:26px}}.n{{font-size:42px}}.cs{{flex-wrap:wrap!important}}.hb{{grid-template-columns:120px 1fr 70px;gap:10px}}.hbv{{font-size:30px}}}}
</style></head><body>
<div class="wrap">
<nav id="tree"><h1>{title}</h1><div class="meta" id="count"></div><div class="prog"><i id="bar"></i></div></nav>
<main>
{slides}
<div class="ctrl"><button id="prev">← wstecz</button><button id="next">dalej →</button></div>
</main></div>
<script>
const MARK={marks},KEY='tasteray-deck-{key}';
const S=[...document.querySelectorAll('.slide')],tree=document.getElementById('tree');let cur=0,seen=new Set();
try{{cur=+(localStorage.getItem(KEY)||0);if(!(cur<S.length))cur=0}}catch(e){{}}
let last='';const links=S.map((s,i)=>{{if(s.dataset.area!==last){{last=s.dataset.area;const h=document.createElement('div');h.className='area';h.textContent=last;tree.appendChild(h)}}const a=document.createElement('a');a.innerHTML=MARK[s.dataset.k];a.appendChild(document.createTextNode(s.dataset.t));a.onclick=()=>go(i);tree.appendChild(a);return a}});
function go(i){{cur=Math.max(0,Math.min(S.length-1,i));seen.add(cur);S.forEach((s,j)=>s.classList.toggle('on',j===cur));links.forEach((a,j)=>{{a.className=j===cur?'cur':(seen.has(j)?'seen':'')}});document.getElementById('count').textContent=`Slajd ${{cur+1}} z ${{S.length}} · zostało ${{S.length-cur-1}}`;document.getElementById('bar').style.width=((cur+1)/S.length*100)+'%';try{{localStorage.setItem(KEY,cur)}}catch(e){{}}}}
document.getElementById('prev').onclick=()=>go(cur-1);document.getElementById('next').onclick=()=>go(cur+1);
addEventListener('keydown',e=>{{if(e.key==='ArrowRight'||e.key==='ArrowDown')go(cur+1);if(e.key==='ArrowLeft'||e.key==='ArrowUp')go(cur-1)}});go(cur);
</script></body></html>'''
