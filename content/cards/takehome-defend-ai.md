---
id: takehome-defend-ai
round: takehome
tech: [ai, testing]
tier: 1
project: ElCom MATCH (parity harness)
q: Haben Sie für die Aufgabe KI benutzt?
en: Did you use AI for the task?
---
## 30s
*(Ehrlich wählen: Ja oder Nein. Nie lügen. Das Team fragt sonst nach und merkt es.)*
Wenn ja: „Ja. Ich habe KI für bestimmte Teile benutzt, und ich sage Ihnen genau, wofür.“
Zum Beispiel für Boilerplate, Testdaten oder einen ersten Entwurf vom README.
Das Design, die Entscheidungen und die Prüfung habe ich selbst gemacht.
Jede Zeile habe ich gelesen und verstanden. Ich kann jede Zeile erklären und ändern.
Die Tests habe ich bewusst selbst geschrieben oder genau geprüft. Sie sind meine Sicherheit.
Im README steht ein Abschnitt „KI-Nutzung“.

## 90s
**So beschreibe ich es konkret:**
- **Selbst gemacht:** Struktur, Datenmodell, Fachlogik, Fehlerbehandlung, Testfälle.
- **Mit KI:** *(Ihr echtes Beispiel: z. B. Dockerfile-Entwurf, DTO-Mapping, Testdaten.)*
- **Wie geprüft:** Tests laufen grün. APIs gegen die offizielle Doku geprüft. SonarQube oder Linter ohne neue Warnungen.
- **Was ich geändert habe:** *(Ihr echtes Beispiel: ein Vorschlag der KI, den Sie verworfen oder korrigiert haben, und warum.)*

**Laut gesagt:** „KI ist für mich wie ein schneller Junior. Ich gebe die Richtung vor. Ich prüfe alles wie einen Merge Request von einem Kollegen.“

**Wenn KI nicht erlaubt war:** Dann habe ich keine benutzt. Ich sage: „Die Aufgabe sagt: ohne KI. Daran habe ich mich gehalten.“

**Beweis, dass ich es verstehe:** Ich biete an: „Ändern wir live etwas. Zum Beispiel eine neue Regel oder einen neuen Endpoint.“ Das ist das stärkste Argument.

## 3min
**Warum Ehrlichkeit hier wichtig ist:** Die meisten Teams nutzen heute KI. Sie wollen wissen, ob ich sie kontrolliert nutze. Verstecken wirkt unsicher. Übertreiben wirkt, als könnte ich nichts allein.

**Typische Fallen, die das Team prüft:**
- Eine Methode, die ich nicht erklären kann. → Darum lese ich jede Zeile vor der Abgabe.
- Unnötige Komplexität, typisch für generierten Code. → Ich vereinfache vor der Abgabe.
- Falsche oder veraltete APIs, zum Beispiel `@MockBean` statt `@MockitoBean` in Spring Boot 3.4+. → Ich prüfe gegen die Doku der Version.
- Tests, die nur den Code spiegeln und nichts prüfen. → Ich schreibe die Erwartung aus der Fachregel, nicht aus dem Code.

**Aus meiner Praxis, MATCH:** Wir mussten sieben Statistik-Rechner von .NET nach PySpark portieren. Kriterium: 100 % Parität, sonst kein Go-Live. Am Anfang stimmten die Ergebnisse nicht. Ursachen: Zahlen- und Datumsformate je nach Ländereinstellung, null gegen leeren String, Zeitzone von `received_date`. Ich habe fünf Extractor-Bugs behoben und dann einen automatischen Parity-Job gebaut. *(Prüfen: Welchen Teil hat die KI geschrieben?)* Die Lektion: Ein guter Test ist wichtiger als ein guter Prompt. Das gilt auch für die Take-Home-Aufgabe.

**Datenschutz:** Ich habe keine Daten des Unternehmens oder Secrets in ein KI-Tool kopiert. Im Bundesumfeld ist das für mich Standard.

## Follow-ups
- Können Sie das auch ohne KI? → Ja. Gern ändere ich jetzt live etwas ohne KI.
- Welchen Vorschlag der KI haben Sie verworfen? → *(Ihr echtes Beispiel: …)* Mit Grund, zum Beispiel falsche API oder zu komplex.
- Erklären Sie diese Methode Zeile für Zeile. → Ruhig, Zeile für Zeile, mit einem kleinen Beispiel. Das übe ich vor dem Termin.
- Wie viel Zeit hat Ihnen KI gespart? → *(Ihre ehrliche Schätzung.)* Die Zeit habe ich in Tests und README gesteckt.
- Wie sollte unser Team KI nutzen? → Klare Regeln, Review-Pflicht, keine Kundendaten im Prompt, Tests als Qualitäts-Gate.

## Don't say
- „Nein“, wenn es nicht stimmt.
- „Die KI hat das meiste gemacht.“ Zeigen Sie Ihre Kontrolle und Ihre Entscheidungen.
- „Das hat die KI so gemacht, ich weiss nicht warum.“

## Words
- **ehrlich** = honest
- **verwerfen** = to reject
- **Entwurf** = draft
- **Kontrolle** = control, oversight
- **Boilerplate** = repetitive standard code
