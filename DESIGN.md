---
version: 1
name: Interview Coach — "Werkhandbuch"
description: A precise Swiss technical manual for reading long German interview topics on a phone. Ink on paper, hairline rules, one signal-yellow accent.
colors:
  paper: "#fafaf7"
  surface: "#ffffff"
  ink: "#141413"
  ink-2: "#3a3a37"
  muted: "#5d5d58"
  line: "#dedcd5"
  rule: "#141413"
  signal: "#ffcc00"
  signal-ink: "#7a5a00"
  signal-wash: "#fff6cc"
  senior: "#1d6b37"
  senior-wash: "#ecf5ee"
  trap: "#b42318"
  trap-wash: "#fcefed"
  code-bg: "#17181a"
  code-fg: "#e9e7e1"
typography:
  ui: { family: "Source Sans 3", fallback: "system-ui, sans-serif", source: "local woff2 (assets/latin*.woff2)" }
  reading: { family: "Source Serif 4", fallback: "Georgia, serif", source: "Google Fonts, opsz 8..60, 400/600" }
  mono: { family: "IBM Plex Mono", fallback: "ui-monospace, Consolas, monospace", source: "Google Fonts, 400/600" }
rounded: { none: 0, sm: 3px, md: 6px }
spacing: { unit: 4px, gutter: 16px, row: 48px }
---

# Interview Coach — DESIGN.md

## 1. Visual Theme & Atmosphere

A **Swiss technical manual** ("Werkhandbuch"), not a SaaS landing page. The reader is a senior engineer who
reads long, dense German pages on a phone before an interview. The design is calm, exact and dense:
ink on paper, strong black rules that separate sections, hairlines between rows, numbers set in a mono
face, and exactly **one** colour that is allowed to shout: **signal yellow**, used like a highlighter
pen in a printed manual (progress, the current priority, the core statement). Green and red exist only
as meaning (senior point, trap), never as decoration.

- Density: high, but every row has 48px of tap height.
- Ornament: none. Structure comes from rules, type weight and alignment.
- Feeling: "a well-kept engineering binder", flush-left, asymmetric.

## 2. Color Palette & Roles

### Light (paper)
| Token | Hex | Role |
|---|---|---|
| `paper` | `#fafaf7` | Page background (cool off-white, not cream) |
| `surface` | `#ffffff` | Inputs, open question panels |
| `ink` | `#141413` | Body text, headings, strong rules, P1 marker fill |
| `ink-2` | `#3a3a37` | Reading text in long articles (slightly softer than ink) |
| `muted` | `#5d5d58` | Meta lines, counts, captions (7:1 on paper) |
| `line` | `#dedcd5` | Hairlines between rows, table rules |
| `signal` | `#ffcc00` | THE accent. Fills only in light mode: progress bars, kern bar, link underline, focus ring |
| `signal-ink` | `#7a5a00` | Accent when it must be text on paper (AA 6.4:1) |
| `signal-wash` | `#fff6cc` | Kern block background |
| `senior` / `senior-wash` | `#1d6b37` / `#ecf5ee` | "Senior-Punkte" block |
| `trap` / `trap-wash` | `#b42318` / `#fcefed` | Trap / trick-question block |
| `code-bg` / `code-fg` | `#17181a` / `#e9e7e1` | Code blocks (dark in both modes) |

### Dark (night reading)
| Token | Hex | Role |
|---|---|---|
| `paper` | `#111111` | Page background |
| `surface` | `#1a1a19` | Panels |
| `ink` | `#eeede8` | Text |
| `ink-2` | `#d6d4cd` | Reading text |
| `muted` | `#a19f97` | Meta |
| `line` | `#2e2d2a` | Hairlines |
| `signal` | `#ffd21f` | Accent; may also be text on dark (12:1) |
| `signal-wash` | `#29240f` | Kern block |
| `senior` / `senior-wash` | `#6fd08f` / `#14241a` | Senior block |
| `trap` / `trap-wash` | `#ff8a7a` / `#2c1614` | Trap block |

Rules: no gradients, no glassmorphism, no glow, no purple/violet anywhere. Text on `signal` is always `ink #141413`.

## 3. Typography Rules

Three faces, each with one job:
- **Source Sans 3** (local, offline): UI, headings, list rows. Weights 400/600/800.
- **Source Serif 4** (Google Fonts, optical sizes): the long-form reading text of topic pages only.
- **IBM Plex Mono**: numbers, counts, P1/P2/P3 markers, section indices, code. Always `tabular-nums`.

| Token | Face | Size / line-height | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `display` | Sans | 40px / 1.0 | 800 | -0.03em | Home progress number |
| `h1` | Sans | 30px / 1.12 | 800 | -0.02em | Screen and topic title |
| `h2` | Sans | 21px / 1.25 | 800 | -0.01em | Category, topic section (under a 2px ink rule) |
| `h3` | Sans | 17px / 1.3 | 700 | 0 | Sub-sections |
| `body-ui` | Sans | 17px / 1.45 | 400 | 0 | Rows, UI text |
| `reading` | Serif | 17.5px / 1.65 | 400 | 0 | Topic article text, measure 68ch |
| `label` | Mono | 12px / 1.2 | 600 | 0.06em, uppercase | Kickers that carry data (counts), never decoration |
| `num` | Mono | 13-14px | 400-600 | 0 | Counts like `12/30`, markers `P1` |
| `code` | Mono | 13.5px / 1.5 | 400 | 0 | `pre`, inline code 0.88em |

Principles: flush-left everywhere; no centred headings; no italic serif display; headings never skip levels.

## 4. Component Stylings

- **Masthead (home)**: mono label with counts, then the big `display` number "108/404" and a 6px progress
  bar (signal fill on line track), then a 3-column stat strip (P1 done, techs started, categories) set in mono.
- **Category section**: 2px ink rule on top, mono index `01`, h2 name, right-aligned mono count, 3px bar.
- **Tech row**: 48px min height, hairline below, name (sans 17px) left, 48px mini bar + mono `d/n` right.
  Untouched techs (0 written) are muted but still tappable.
- **Topic row (tech page)**: mono priority marker — `P1` ink-filled square, `P2` outlined, `P3` muted text;
  title; tiny badges; right mono `9 F` count or `folgt`. Not-written rows are muted, not clickable.
- **Badges**: 12px mono, 3px radius. `kein Projekt` = signal-wash + ink; `prüfen` = dashed muted outline.
- **Buttons**: ink fill + paper text, 3px radius, 48px tall; ghost = 1px ink outline. No pills, no shadows.
- **Kern block**: signal-wash background, 4px signal left bar, sans text.
- **Senior / Trap**: wash background + 4px coloured left bar; the only places green/red appear.
- **Questions** (`details`): a hairline list, mono `+` / `–` marker, answer indented on surface.
- **Pager**: two full-width rows, mono label "← Zurück" / "Weiter →" above the sans title; next is ink-filled.
- **Focus**: 3px signal outline + 1px ink offset, visible in both modes.

## 5. Layout Principles

- Mobile first at 360px. Gutter 16px (plus safe-area). Content column max 720px; reading measure 68ch.
- 4px base unit: 4, 8, 12, 16, 24, 32, 48.
- No cards for lists: lists are ruled tables of rows. Boxes are reserved for kern/senior/trap and code.
- Never two boxes deep.
- Tables, `pre` and wide content scroll inside themselves; the page never scrolls sideways.

## 6. Depth & Elevation

Flat. No shadows. Hierarchy is made with rules: 2px ink rule = new section, 1px line = new row.
The sticky header gets only a hairline under it.

## 7. Do's and Don'ts

Do
- Use signal yellow for progress and the core statement only; one loud thing per screen.
- Set every number in Plex Mono with tabular figures.
- Keep SVG diagrams on a light plate in dark mode so their hard-coded colours stay readable.
- Respect `prefers-reduced-motion` (only 120ms colour transitions exist anyway).

Don't
- Purple/blue gradients, glow, glassmorphism, mesh backgrounds, centred hero.
- Three equal feature cards, icon tiles above headings, cards inside cards.
- Pill buttons, big rounded corners (max 6px), drop shadows.
- Grey text on coloured fills; text under 12px.

## 8. Responsive Behavior

| Width | Change |
|---|---|
| 360–599 | One column. Stat strip 3 columns of mono numbers. |
| 600–899 | Display number 48px; content max 720px. |
| ≥ 900 | Same column, centred in the window with wider margins; reading measure stays 68ch. |

Touch targets ≥ 44px (rows 48px). Code/tables scroll horizontally inside their block.

## 9. Agent Prompt Guide

"Swiss technical manual on a phone: Source Sans 3 for UI, Source Serif 4 for reading, IBM Plex Mono for numbers.
Ink #141413 on paper #fafaf7, hairlines #dedcd5, 2px ink section rules, ONE accent signal yellow #ffcc00
used as a highlighter (progress, kern). Flat, 3px radius, no shadows, no gradients, no purple."
