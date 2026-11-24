---
id: review-how-to-review
round: review
tech: [patterns, security, testing]
tier: 1
q: Wie gehen Sie bei einem Code-Review vor?
en: How do you approach a code review?
---
## 30s
Ich prüfe in fester Reihenfolge, von wichtig nach weniger wichtig.
1. **Korrekt?** Macht der Code, was das Ticket will? Randfälle, Fehlerfälle?
2. **Sicher?** Injection, Rechte, Geheimnisse, Personendaten im Log?
3. **Schnell?** N+1, Schleifen mit Queries, fehlende Indizes, Speicher?
4. **Lesbar?** Namen, Länge, Tests verständlich?
5. **Design?** Welches Pattern, welche Architektur? Passt es zum Rest?
Code-Reviews habe ich bei CARIAD in Bitbucket gemacht. Bei Unisys gehören sie zu den Qualitätsstandards, mit SonarQube und Testautomatisierung.

## 90s
**Meine Checkliste pro Punkt:**
- **Korrekt:** null, leer, Grenzen, Zeitzonen, Nebenläufigkeit, Transaktionsgrenzen. Gibt es Tests für den Fehlerfall?
- **Sicher:** SQL mit Parametern? Eingaben validiert? Berechtigung geprüft? Keine Secrets im Code? Keine Personendaten im Log?
- **Schnell:** Queries in Schleifen? Paging bei grossen Listen? Ressourcen geschlossen? Unnötige Kopien?
- **Lesbar:** Sprechende Namen? Kurze Methoden? Kommentare erklären das Warum?
- **Design:** Eine Verantwortung pro Klasse? Abhängigkeiten in die richtige Richtung? Layered, hexagonal oder clean, und wird es eingehalten?

**Im Live-Review laut gesagt:**
„Ich lese zuerst, was der Code tun soll. Dann gehe ich meine fünf Punkte durch. Das Sicherheitsproblem nenne ich zuerst, weil es am wichtigsten ist.“

**Wie ich Kommentare schreibe:**
- Mit Stufe: **Blocker**, **Sollte**, **Nit** (Kleinigkeit).
- Mit Grund und Vorschlag: „Blocker: SQL Injection über `name`. Vorschlag: PreparedStatement, siehe Beispiel.“
- Als Frage, wenn ich unsicher bin: „Was passiert hier bei einer leeren Liste?“

## 3min
**Was Maschinen prüfen sollen, nicht Menschen:** Formatierung, Import-Reihenfolge, einfache Code-Smells. Das machen Formatter, Linter und SonarQube in der Pipeline. Im Review konzentriere ich mich auf Logik, Sicherheit und Design.

**Gute Review-Kultur:**
- Kleine Merge Requests. Bei sehr grossen Änderungen, etwa über 400 Zeilen, sinkt die Qualität des Reviews.
- Schnell antworten, zum Beispiel am selben Tag. Sonst blockiert der Kollege.
- Den Code kritisieren, nicht die Person. „Dieser Code“ statt „du“.
- Auch Gutes sagen. Das motiviert.
- Bei langen Diskussionen: kurz sprechen statt 20 Kommentare.

**Im Interview mit einem fremden Snippet:**
1. Erst verstehen: „Der Code soll eine Zahlung senden. Richtig?“
2. Die fünf Punkte laut durchgehen.
3. Pro Problem: was, warum schlimm, Fix.
4. Am Ende Pattern und Architektur nennen.
5. Priorisieren: „Wenn ich nur eine Sache ändern darf, dann die SQL Injection.“

**Aus meiner Praxis:** SonarQube hat bei MATCH Passwörter in Test-Fixtures und im lokalen Compose gemeldet. Wir haben die Fake-Passwörter entfernt, das lokale Compose mit Begründung ausgeschlossen und die Ausnahmen dokumentiert. Regeln haben wir nie pauschal abgeschaltet.

## Follow-ups
- Was machen Sie, wenn der Autor nicht einverstanden ist? → Ich erkläre den Grund mit einem Beispiel. Wenn es Geschmack ist, gebe ich nach. Bei Sicherheit nicht.
- Wie reviewen Sie Code, der mit KI geschrieben wurde? → Genauso streng. Besonders prüfe ich APIs gegen die Doku und die Tests.
- Wie lange dauert ein Review bei Ihnen? → *(Ihr echter Wert: …)* Grosse Änderungen bitte ich zu teilen.
- Wer muss reviewen? → Mindestens eine Person, bei kritischem Code gern zwei. Die Regel steht am besten im Branch-Schutz.
- Wie helfen Reviews Juniors? → Ich erkläre das Warum und verlinke Beispiele. Manchmal machen wir das Review zusammen am Bildschirm.

## Don't say
- „Ich schaue vor allem auf die Formatierung.“
- Nicht mit Stil-Kleinigkeiten anfangen, wenn es ein Sicherheitsproblem gibt.

## Words
- **Merge Request / Pull Request** = change for review
- **Nit** = small, optional remark
- **Blocker** = must fix before merge
- **sprechende Namen** = meaningful names
- **priorisieren** = to prioritise
