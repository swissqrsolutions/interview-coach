# Interview Coach — design

The app looks and feels exactly like **CKA Coach** (`C:/code/cka-coach/site`). Calm, phone first, readable. One stylesheet: `site/assets/style.css`.

## Type
- One font only: **CK Sans** (`site/assets/latin.woff2`, `latin-ext.woff2`, copied from CKA Coach). No web fonts from outside.
- Body 17px, line-height 1.55, weight 400. Headings same font, weight 700: h1 22px, h2 20px (21px in topic pages), h3 17–18px.
- Code: `ui-monospace, "SF Mono", "Cascadia Mono", Consolas, monospace`.
- No uppercase labels, no letter-spacing, no highlighter marks, no thick underlines, no animation tricks.

## Colours (identical to CKA Coach)
| Token | Light | Dark |
|---|---|---|
| bg | #f4f6fb | #0c1220 |
| surface | #fff | #141c2e |
| ink | #152033 | #e7ecf5 |
| muted | #5b6880 | #9aa6bd |
| line | #dfe5f0 | #26314a |
| accent | #2f6fde | #6f9cff |
| accent-soft | #e3ecfc | #1c2a4a |
| good / good-soft | #1e8e5a / #dff3e8 | #4cc38a / #123326 |
| warn / warn-soft | #c77700 / #fff1d6 | #f0b54a / #3a2b10 |
| bad / bad-soft | #c0392b / #fbe3e0 | #ff7b6e / #3d1916 |
| code block | #0f1726 with #e6edf7 text | same |

Dark mode follows the system (`prefers-color-scheme`) and the ◐ button (`data-theme`, stored as `ic:theme`).
Theme-color metas and the manifest use the bg colour.

## Shell
- **Top bar** (sticky): icon + "Interview Coach", install button (accent, only when installable), ◐ theme button (44px, 12px radius).
- **Bottom tabs** (fixed, like CKA): *Themen* (home, tech and topic pages) and *Bibliothek*. Active tab: accent text + 3px accent top line.
- **Back links**: small muted text link at the top ("← PostgreSQL + SQL").
- Content max 760px (900px on laptops), 16px side padding, 90px bottom padding for the tabs.

## Pieces
- **Card**: white surface, 1px line border, radius 14px, 16px padding. Lists sit inside cards, rows 48px high, separated by thin lines.
- **Buttons**: 48px high, radius 12px; filled accent or ghost (white with accent border and text).
- **Chips**: pill, accent-soft background, 13px bold. P1/P2/P3 badges: accent / accent-soft / grey pill.
- **Progress bar**: 8px, rounded, green fill on line colour.
- **Home**: h1 "Themen", one progress card (count, bar, 3 small stats), then per category an h2 with a count chip and a card of tech rows (name, mini bar, done/total).

## Topic page (`article.topic`, max 720px)
- **Gerüst**: card; grid with the angle label left (90px, muted bold) and the text right, rows divided by thin lines. Under 380px the label sits above the text.
- **Antwort-Muster**: accent-soft card, 4 numbered lines (accent circle), step name bold. The `li` is a normal block with an absolutely placed number, never a grid, so inline `<code>`/`<b>` stay in the text flow.
- **Kern**: accent-soft card. **Senior**: green-soft card. **Fallen** (`.trap`): red-soft card.
- **Code**: dark block, 14px, never wrapped, scrolls sideways.
- **Tables**: full width, 15px, header row accent-soft; app.js wraps each table in `.tscroll` so it scrolls sideways on phones.
- **SVG diagrams**: max-width 100%, height auto, centred, always on a white plate (also in dark mode).
- **Questions** (`<details>`): CKA expandable steps — card per question, chevron on the right.
- **Zum Anschauen**: card with ghost "Öffnen ↗" link buttons. **Pager**: ghost "Zurück" + filled "Weiter".
