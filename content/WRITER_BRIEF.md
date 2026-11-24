# Brief for every topic-page writer (read fully)

## Goal
Interview-prep pages for a senior engineer (14 years) in Switzerland. Each topic = one standalone HTML page that teaches everything an interviewer can ask: internals, comparisons, practice, disadvantages, production problems, diagnosis, senior trade-offs. Content first.

## Gold standard (copy EXACTLY)
Read completely before writing:
- C:/code/interview-coach/content/topics/java/jit-compiler.html
- C:/code/interview-coach/content/topics/java/hashmap.html
Copy their `<head>`/`<style>` block, classes (`.kern`, `.senior`, `.trap`, `.small`), and section order. File: `C:/code/interview-coach/content/topics/<tech>/<id>.html` (create the folder if missing; other writers may add files there — never touch them).

## Section order (same on every page)
1. **Kern** (`.kern`): 2–3 sentences.
2. **„Wo sitzt …?"**: one inline SVG of the big picture, then numbered steps.
3. **„Die Reise …"** (e.g. „Die Reise einer Abfrage"): one inline SVG of the process, then numbered steps told as a story.
4. **Beispiel**: code/command → output → numbered explanation (see "Examples" below).
5. **Details, die Interviewer fragen.**
6. **Vergleich**: a list (a table only with max 3 columns).
7. **In der Produktion**: what breaks + the fix.
8. **Diagnose**: tools, flags, commands, queries.
9. **Senior-Punkte** (`.senior`, green): trade-offs, limits, decisions.
10. **Aus dem Projekt**: 1 sentence + „(Prüfen und durch dein echtes Beispiel ersetzen.)". Only use facts from C:/code/interview-coach/content/PROFILE.md. Never invent project facts. If the candidate has no experience, say so honestly and link to the nearest real experience.
11. **Fallen** (`.trap`, red): wrong statement → correct one.
12. **Fragen**: 15–35 `<details><summary>Frage</summary><p>Antwort</p></details>`, answers 1–3 sentences, the last 3 start with „Szenario: …".

## Writing style
- Start with „X ist …", then what problem it solves.
- One idea per sentence, max 15 words, subject first, present tense.
- Every term in `<b>bold</b>` with a short explanation in the same sentence. No separate word list.
- Components as numbered „Name: what it does" + one example.
- No analogies, no filler, no history. Mention a version only where it changes the answer.
- German sentences, English tech terms.
- Diagrams: inline SVG, boxes and arrows, max ~8 boxes, short labels, drawn yourself.

## Facts
- Current versions (e.g. Java 21/25, PostgreSQL 17, Kafka 4.x with KRaft, Kubernetes 1.3x, Angular 20, Spring Boot 3.x).
- Official docs and specs only (list them under the title in the `.small` line). No outdated tutorials as sources.
- QUALITY RULE: every version number, default value, limit and "since X" claim must be checked with WebFetch on the official page. If you cannot confirm it, either drop it or write it without the number. Do not leave "from memory" facts in the page.
- Before finishing, re-read each page once as an interviewer: is every answer correct, complete, and current? Fix what is wrong.

## Examples (important)
- Do NOT install or download anything. Do not spend time on tooling.
- If a tool already works here, run it and paste the REAL output, labelled „Echte Ausgabe, <tool+version>":
  - JDK 17 (`java`, `javac`), Python 3.12 (`python -I`, sqlite3 included).
  - PostgreSQL 17 in Docker, only if `docker exec pg17 psql -U postgres -c "select 1"` works.
  - Kubernetes, only if `kubectl get nodes` works (local k3s; use a namespace `demo-<topic>` and delete it afterwards).
- Otherwise show the code/command and write the result as „Erwartetes Ergebnis (laut Doku, nicht ausgeführt)". Never present expected output as real.
- Scratch files go in C:/Users/Sara/AppData/Local/Temp/claude/cbce6fdd09c70e4b/cbfc5492-629a-41b6-8555-d9a012363df3/scratchpad/<tech>/.

## Finish
Run `node tools/build.mjs` in C:/code/interview-coach — no CONTENT ERRORS allowed (it checks .kern/.senior/.trap, ≥15 questions, 2 SVGs). Edit no other files. Report back only: file names, questions per page, sources, anything unsure.
