# Rollout brief: Gerüst, Antwort-Muster, Selbsttest by angle (approved pilot format)

Read first, completely:
1. `content/WRITER_BRIEF.md` (style, facts, examples rules — all still apply).
2. The 4 approved pilot pages — copy their structure exactly:
   `content/topics/java/hashmap.html`, `java/jit-compiler.html`, `postgres/isolation-levels.html`, `kafka/consumer-groups.html`.
3. `content/COVERAGE.md` (the table format you append to).

## Per page, do all of this
1. **Gerüst** box at the top (after the title/sources line, before Kern): `<div class="geruest"><h2>Gerüst</h2><dl>` with 6 angles as `<dt>`/`<dd>`, in this order: Warum? · Wie innen? · Zahlen · Vergleich · Produktion · Design. 1–2 short lines each, fits one phone screen. Memory skeleton of the page below, not a replacement. Every line contains a mechanism, a number or a trade-off. No generic sentences.
2. **Antwort-Muster** directly below: `<div class="muster"><h3>Antwort-Muster</h3><p class="mq"><b>Frage:</b> …</p><ol>` with 4 steps Mechanismus → Zahl → Trade-off → Produktion. Most basic question of the topic. Max 5 sentences, A2–B1 German. Production example stays general.
3. **Selbsttest**: rename the questions section „Fragen" to „Selbsttest". Group all `<details>` questions under `<h3>` subheadings for the 6 angles (same names/order). Every angle ≥ 2 questions, at least 1 „Warum …?" or „Was geht kaputt, wenn …?". Szenario questions go under Produktion or Design. Total 15–35. No ★ ranking.
4. **Coverage check**: for each angle, does the page BODY have ≥ 2 concrete facts? If not, add short correct content in the fitting section. Append a section for the page to `content/COVERAGE.md` in the same table format as the pilot (Winkel | vorher (Anzahl Fakten) | was ergänzt wurde). Append only — other writers append too; re-read the file right before writing and add your sections at the end.
5. **Aus dem Projekt** stays general: no client security internals (public repo) — no internal endpoints, keys, which service validates which token against which key, network exceptions, scanner/vault setup details. Keep the „(Prüfen und durch dein echtes Beispiel ersetzen.)" marker.
6. **Page styles**: add the same small `.geruest` / `.muster` / `h3` styles to the page's own `<style>` block as in the pilot pages (copy them). Do not edit `site/assets/style.css` (already done).
7. **Review of unreviewed pages** (pages written by earlier writers): while you are in the page, check facts you touch; fix anything wrong. Version-sensitive facts (versions, defaults, limits, "since X") must be verified with WebFetch on the official page; if you cannot verify, remove the number or list it as unverified in your report.

## Rules
- Edit ONLY the pages assigned to you, plus appending to `content/COVERAGE.md`.
- Keep the 12-part structure, `.kern`/`.senior`/`.trap`, 2 SVGs, ≥ 15 `<details>` questions.
- Real output only from installed tools (JDK 17, Python 3.12, PostgreSQL 17.12 via `docker exec pg17 psql -U postgres -c "..."` if it answers, kubectl/k3s if it answers); never relabel expected output as real.
- Run `node tools/build.mjs` in C:/code/interview-coach — no CONTENT ERRORS. Do not commit.
- Report: per page — Muster question, questions per angle, what coverage added, what facts you corrected (old → new), and a list of every fact you could NOT verify.
