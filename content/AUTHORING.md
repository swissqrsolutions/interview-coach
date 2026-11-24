# How to write cards (read fully before writing)

The reader: a senior full-stack / data engineer in Bern preparing for Swiss interviews (any company, any round). Interviews are often in German. Every answer is spoken aloud, so the text must be **simple A2 German**.

## Language rules (strict)
- German, A2 level: subject–verb–object, max ~12 words per sentence, present tense or Perfekt. One idea per sentence.
- Keep English tech terms as Swiss teams say them: das Topic, der Consumer, deployen, der Pod, das Backend, der Trade-off, Partition Pruning.
- Formal "Sie" in questions. Answers in "ich" / "wir".
- `en:` = one short English translation of the question.

## Card format (one file per card: content/cards/<id>.md)
```
---
id: <round>-<short-name>          (lowercase, hyphens; must equal the file name)
round: <round id>                 (phone hr project tech coding sql review design data critique takehome behaviour assessment final)
tech: [<tech ids>]                (from content/tech.json; can be [] for pure HR)
tier: 1|2|3|4                     (1 = asked almost always)
proof: project|study              (optional; default comes from the first tech. "study" = no production experience)
project: <project name>           (optional: which real project to use in the answer)
q: <the interviewer's question in German>
en: <English translation>
---
## 30s
(4–7 short sentences: what it is → why → where I used it (project + one number) → offer to go deeper)

## 90s
(how it works inside, 3–6 steps or bullets; a concrete example; code/SQL in ``` blocks when useful)

## 3min
(senior layer: trade-offs, when NOT to use it, failure modes and how you notice them, what I'd do differently)

## Follow-ups
- <likely follow-up question in German> → <short answer, 1–2 sentences>
(3–6 follow-ups. This is where interviews are won.)

## Don't say
- <typical junior mistake or wrong statement> (1–3 lines)

## Words
- **<German/tech word>** = <English or simple meaning> (3–6 lines)
```
Behaviour cards: in "3min" use STAR-L (Situation, Aufgabe, Aktion with "ich", Resultat with a number, Lektion).
Coding / review / critique cards: put the task, snippet or diagram (as text) in the question or in "30s"; the answer levels show the solution path.

## Facts rule (most important)
- Use ONLY the facts in content/PROFILE.md for anything about the candidate's projects, numbers, roles and reasons.
- Never invent a project fact, number, reason or story. If an answer needs one that is not in PROFILE.md, write a placeholder in italics: *(Ihr echtes Beispiel: …)* or *(Prüfen: …)*.
- General technical knowledge must be correct for current versions (Java 21, Spring Boot 3, Kubernetes 1.3x, Angular 17+, PostgreSQL 16+). If unsure, leave it out.
- For gap technologies (proof: study), the 30s answer ends with an honest line: „Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich von …"

## Checks before you finish
- Run `node tools/build.mjs` in C:/code/interview-coach. It must print no CONTENT ERRORS.
- Every card has 30s, 90s, 3min, Follow-ups, Don't say, Words.
- Look at content/cards/design-image-search.md and tech-kafka-basics.md as the model.
