---
id: behaviour-disagree-architect
round: behaviour
tech: [patterns, iceberg]
tier: 2
q: Was machen Sie, wenn Sie mit einer Entscheidung vom Architekten nicht einverstanden sind?
en: What do you do when you disagree with an architect's decision?
---
## 30s
Zuerst frage ich nach dem Grund. Vielleicht kennt der Architekt etwas, das ich nicht kenne.
Dann bringe ich meine Bedenken mit Fakten: Risiko, Kosten, ein kleiner Test.
Ich mache das im direkten Gespräch, nicht vor allen im Meeting.
Wenn die Entscheidung bleibt, trage ich sie mit und setze sie gut um.
Ich dokumentiere das Risiko, zum Beispiel in einem Architecture Decision Record.
*(Ihr echtes Beispiel in einem Satz.)*

## 90s
**Meine Schritte (disagree and commit):**
1. **Verstehen:** „Welches Problem lösen wir damit? Welche Annahmen gibt es?“
2. **Fakten sammeln:** ein Prototyp, eine Messung, eine Vergleichstabelle.
3. **Vorschlag machen:** Nicht nur Kritik, sondern eine Alternative mit Trade-offs.
4. **Entscheidung akzeptieren:** Wer verantwortlich ist, entscheidet.
5. **Dokumentieren:** Entscheidung, Gründe, Risiken. So kann man sie später neu prüfen.

**Beispiel für Fakten statt Meinung (aus MATCH):** Bei Iceberg gegen Delta Lake habe ich klare Gründe: herstellerneutral, mehrere Engines (Spark schreibt, Dremio liest), Hidden Partitioning, Schema Evolution, Katalog-Flexibilität mit Nessie. So eine Liste bringe ich in jede Diskussion. *(Prüfen: Gab es dazu wirklich eine Diskussion mit einem Architekten?)*

## 3min
**STAR-L:**
- **Situation:** *(Ihr echtes Beispiel: Projekt, welche Entscheidung, warum waren Sie dagegen?)*
- **Aufgabe:** Das Risiko sichtbar machen, ohne das Team zu blockieren.
- **Aktion:** Ich habe um ein Gespräch gebeten. Ich habe gefragt, warum. Ich habe *(Ihr echtes Beispiel: Prototyp, Messung, Vergleich)* gezeigt.
- **Resultat:** *(Ihr echtes Beispiel: Entscheidung geändert oder nicht? Zahl?)*
- **Lektion:** Ich muss nicht gewinnen. Ich muss das Risiko klar machen. Dann ist eine gute Entscheidung möglich.

**Wann ich eskaliere:**
- Nur bei Sicherheit, Datenschutz oder rechtlichen Problemen. Im Bundesumfeld ist das wichtig, zum Beispiel beim DSG.
- Dann sachlich, schriftlich und über den normalen Weg.

**Senior-Sicht:**
- Ein Architekt sieht oft mehr Systeme als ich. Ich sehe den Code im Detail. Beides zusammen gibt die beste Entscheidung.
- Wenn ich mich geirrt habe, sage ich das offen.

## Follow-ups
- Was, wenn Sie später recht hatten? → Kein „Ich habe es gesagt“. Ich zeige das Problem und schlage eine Lösung vor. Das ADR hilft dabei.
- Was ist ein ADR? → Ein kurzes Dokument: Kontext, Entscheidung, Alternativen, Konsequenzen. Es liegt im Repo oder in Confluence.
- Haben Sie selbst Architektur-Entscheidungen getroffen? → Ja, ich treffe im Bundesumfeld selbständig technische Design- und Architektur-Entscheidungen. Bei MATCH zum Beispiel: Ergebnis ersetzen statt addieren. *(Prüfen: War das Ihre Entscheidung?)*
- Was tun Sie, wenn der Architekt nicht zuhört? → Ich frage den Product Owner oder das Team nach ihrer Sicht. Ich bleibe sachlich.

## Don't say
- „Ich mache es dann einfach anders.“
- „Architekten haben keine Ahnung vom Code.“

## Words
- **Bedenken** = concerns
- **mittragen** = support (a decision)
- **eskalieren** = escalate
- **sachlich** = factual, calm
- **Annahme** = assumption
