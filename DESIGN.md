---
version: 2
name: Interview Coach — "Titelseite"
description: Bold editorial magazine cover on a phone. Heavy uppercase display type, black ink on warm white, one signal-yellow accent used like a highlighter. Reading pages stay calm and serif.
colors:
  paper: "#f6f4ee"
  surface: "#fffefb"
  ink: "#111110"
  ink-2: "#34332f"
  muted: "#5a5852"
  line: "#d8d4c8"
  track: "#e4e0d4"
  rule: "#111110"
  signal: "#ffd400"
  signal-wash: "#fff3b3"
  senior: "#1d6b37"
  senior-wash: "#e9f3ea"
  trap: "#b42318"
  trap-wash: "#fbecea"
  code-bg: "#151514"
  code-fg: "#ecebe5"
typography:
  display: { family: "Archivo", fallback: "Arial Black, Arial, sans-serif", source: "Google Fonts variable, wght 700..900, wdth 62..125" }
  ui: { family: "Source Sans 3", fallback: "system-ui, sans-serif", source: "local woff2 (assets/latin*.woff2)" }
  reading: { family: "Source Serif 4", fallback: "Georgia, serif", source: "Google Fonts, opsz 8..60, 400/600" }
  mono: { family: "IBM Plex Mono", fallback: "ui-monospace, Consolas, monospace", source: "Google Fonts, 400/600" }
rounded: { none: 0, sm: 3px, icon: 7px }
spacing: { unit: 4px, gutter: 16px, row: 54px }
---

# Interview Coach — DESIGN.md

## 1. Visual Theme & Atmosphere

A **magazine cover** ("Titelseite"), not a SaaS landing page and not a quiet manual. The first screen
must feel like a confident headline: huge, heavy, flush-left uppercase type ("BEREIT FÜR JEDES
INTERVIEW." with a blinking yellow block cursor), a thick framed progress bar, big mono numbers.
Categories are numbered like magazine sections ("01 — DATENBANKEN").

Energy lives in the **display layer only** (headlines, section heads, header wordmark). The reading
layer (topic article text) stays calm: serif, 68ch, generous line height. Loud cover, quiet pages.

Exactly **one** accent: **signal yellow**, used as a highlighter — progress fills, the cursor, the
highlight band behind a topic title, the kern block, the install call-to-action, the open-question marker.
Green and red exist only as meaning (senior point, trap), never as decoration.

## 2. Color Palette & Roles

### Light (warm white)
| Token | Hex | Role |
|---|---|---|
| `paper` | `#f6f4ee` | Page + header background (warm white) |
| `surface` | `#fffefb` | Inputs, cards in the older views |
| `ink` | `#111110` | Text, headlines, 3px section rules, P1 marker, "next" pager |
| `ink-2` | `#34332f` | Long reading text |
| `muted` | `#5a5852` | Meta, counts, captions (AA on paper) |
| `line` | `#d8d4c8` | Hairlines between rows |
| `track` | `#e4e0d4` | Unfilled part of small progress bars |
| `signal` | `#ffd400` | THE accent. **Only ever a fill, never text on light backgrounds** |
| `signal-wash` | `#fff3b3` | Kern block, "kein Projekt" badge, honest-gap box, iOS install hint |
| `senior` / `senior-wash` | `#1d6b37` / `#e9f3ea` | "Senior-Punkte" block |
| `trap` / `trap-wash` | `#b42318` / `#fbecea` | Trap block |
| `code-bg` / `code-fg` | `#151514` / `#ecebe5` | Code blocks (dark in both modes) |

### Dark (black + yellow)
| Token | Hex | Role |
|---|---|---|
| `paper` | `#0e0e0d` | Background |
| `surface` | `#181817` | Panels |
| `ink` | `#f3f1eb` | Text and rules |
| `ink-2` | `#d9d7cf` | Reading text |
| `muted` | `#a6a39a` | Meta |
| `line` / `track` | `#2f2e2a` / `#2b2a26` | Hairlines / bar track |
| `signal` | `#ffd400` | Accent |
| `signal-wash` | `#2a250c` | Kern block |
| `senior` / `trap` | `#6fd08f` / `#ff8a7a` | Meaning colours |

Rules: no gradients as decoration, no glassmorphism, no glow, no mesh, no purple/violet anywhere.
Text on `signal` is always `#111110` (in both modes). The topic-title highlighter is a **hard-stop band**
(a flat yellow stripe behind the lower part of the line, not a soft gradient); in dark mode it moves down
to an underline-like stripe so light text never sits on yellow.

## 3. Typography Rules

Four faces, each with one job:
- **Archivo** (variable, 700–900, width 62–125%): display only — cover headline, header wordmark, tech
  name, category heads, section heads in articles, topic h1. Renders German umlauts (Ä Ö Ü) cleanly even
  uppercase at 0.9 line height. Fallback Arial Black.
- **Source Sans 3** (local, offline): UI text, rows, buttons, kern/senior/trap blocks, questions.
- **Source Serif 4**: the long-form reading text of topic pages only.
- **IBM Plex Mono**: numbers, counts, kickers, markers, code. Always `tabular-nums`.

| Token | Face | Size / lh | Weight / width | Use |
|---|---|---|---|---|
| `cover` | Archivo | clamp(46px, 15.5vw, 112px) / 0.9 | 900 / 80%, uppercase, -0.02em | Home headline, one line per span, never wraps |
| `wordmark` | Archivo | 19px (21px ≥600) | 900 / 82% (<440px), 100% (≥440px), uppercase | Header "INTERVIEW COACH" |
| `tech-h1` | Archivo | clamp(40px, 12vw, 76px) / 0.92 | 900 / 80%, uppercase | Tech page title |
| `topic-h1` | Archivo | clamp(29px, 8.4vw, 54px) / 1.06 | 900 / 80%, sentence case, no auto-hyphens | Topic title, with yellow highlighter |
| `cat-h` | Archivo | clamp(23px, 7vw, 32px) / 1 | 900 / 75%, uppercase | "01 — DATENBANKEN" |
| `sec-h` | Archivo | 24px | 900 / 80%, uppercase | "ALLE THEMEN", "ÜBUNGSKARTEN" |
| `article h2` | Archivo | 23px / 1.15 | 900 / 87.5% | Sections inside topic pages (under a 3px rule) |
| `score` | Plex Mono | clamp(40px, 12vw, 64px) | 600 | "213 / 407" on home |
| `reading` | Serif | 17.5px (18px ≥600) / 1.65 | 400 | Topic text, measure 68ch, hyphens auto |
| `body-ui` | Sans | 17px / 1.45 | 400–800 | Rows, buttons |
| `label` | Mono | 11–13px | 600, 0.06em, uppercase | Kickers that carry data |

Principles: flush-left everywhere; no centred headings; no italic display; headings never skip levels;
the topic title is never uppercased (long German compounds stay readable).

## 4. Component Stylings

- **Header (sticky)**: 64px, paper background, **3px ink rule** below. 38px icon + bold uppercase
  wordmark left; right: yellow install button (↓, text "Installieren" from 440px, hidden when not
  installable) and a 44px outlined theme toggle (◐). The iOS install hint appears as a full-width
  yellow-wash strip inside the sticky header.
- **Home cover**: mono kicker row ("THEMEN · 51 TECHNOLOGIEN"), the `cover` headline in three lines
  with a blinking yellow block cursor (static under reduced motion), then `score` number + "THEMEN
  GESCHRIEBEN", a **22px progress bar framed by a 2px ink border**, one lede line, the full-width yellow
  "↓ App installieren" button (only when installable), then a 3-column mono stat strip under a 3px rule.
- **Category section**: 3px ink rule, `cat-h` index "01" + short ink dash + name + mono count, a
  12px yellow progress bar, then tech rows.
- **Tech row**: 54px min height, hairline below, bold name, 56×8px mini bar, mono `d/n`. Untouched
  techs muted but tappable.
- **Tech page**: mono kicker with a yellow square (category), `tech-h1`, proof badge + projects,
  framed 18px progress bar + big mono count, then "ALLE THEMEN" list.
- **Topic row**: P1 ink-filled square, P2 2px outline, P3 dashed muted; bold title; badges; right mono
  "23 Fragen" or muted "folgt".
- **Topic head**: back link (mono uppercase), crumbs, `topic-h1` with the yellow highlighter band, 3px rule.
- **Kern / Senior / Trap**: wash background + 6px coloured left bar.
- **Questions** (`details`): hairline list, mono `+`; when open the marker becomes `–` on a yellow square.
- **Pager**: 2px ink-outlined "← Zurück" and ink-filled "Weiter →" with a yellow bar after the label.
- **Buttons**: ink fill or 2px ink outline, 3px radius, ≥48px; install CTA = yellow fill + ink text + ink border.
- **Focus**: 3px signal outline + 1px ink ring.

## 5. Layout Principles

- Mobile first at 360px (checked down to 320px: no horizontal scroll). Gutter 16px + safe areas.
  Content column max 760px; reading measure 68ch.
- 4px base unit. Sections separated by **3px ink rules**; rows by 1px hairlines.
- No cards for lists: lists are ruled rows. Boxes only for kern/senior/trap, code and the older practice views.
- Tables, `pre` and SVG plates scroll/scale inside themselves; the page never scrolls sideways.

## 6. Depth & Elevation

Flat. No shadows. Weight comes from type size, 3px rules and solid fills.

## 7. Do's and Don'ts

Do
- One loud headline per screen, set in Archivo 900 uppercase, flush-left.
- Use yellow as a fill/highlighter only; text on yellow is always near-black.
- Every number in Plex Mono, tabular.
- Keep SVG diagrams on a light plate in dark mode.
- Every user-facing label in German.

Don't
- Purple/blue gradients, glow, glassmorphism, mesh backgrounds, centred hero over dark mesh.
- Three equal feature cards, icon tiles above headings, cards inside cards.
- Pill buttons, big rounded corners, drop shadows.
- Yellow as text colour on light backgrounds; grey text on coloured fills; text under 11px.
- Uppercase or display type for long reading text.

## 8. Responsive Behavior

| Width | Change |
|---|---|
| 320–439 | Wordmark condensed (82%); install button icon-only (↓) with aria-label. |
| ≥ 440 | Wordmark full width; install button shows "Installieren". |
| ≥ 600 | Wordmark 21px; pager two columns; reading text 18px. Display sizes keep scaling via clamp(). |

Touch targets ≥ 44px (rows 54px, buttons 48px).

## 9. Icon

64×64 SVG (`assets/icon.svg`): near-black rounded square, a heavy warm-white "Q" ring, and the Q's tail
is a **yellow block cursor** knocked out of the ring (same motif as the home headline). PNGs for install:
`icon-192.png`, `icon-512.png` (purpose any) and `maskable-192/512.png` (full-bleed, motif in the safe zone),
rendered from the SVG with headless Chrome. Bump `?v=` in index.html, manifest and sw.js when it changes.

## 10. Agent Prompt Guide

"Bold editorial magazine cover on a phone: Archivo 900 uppercase display (80% width) for headlines,
Source Sans 3 for UI, Source Serif 4 for reading, IBM Plex Mono for numbers. Ink #111110 on warm white
#f6f4ee, 3px ink section rules, ONE accent signal yellow #ffd400 used only as a fill/highlighter
(progress, block cursor, title highlight, kern, install button). Dark: #0e0e0d + same yellow.
Flat, 3px radius, no shadows, no gradients, no purple, flush-left, all labels German."
