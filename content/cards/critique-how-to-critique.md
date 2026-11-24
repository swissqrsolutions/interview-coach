---
id: critique-how-to-critique
round: critique
tech: [microservices, security, observability]
tier: 1
q: Hier ist ein Architekturdiagramm. Sie haben 10 Minuten. Was ist falsch daran?
en: Here is an architecture diagram. You have 10 minutes. What is wrong with it?
---
## 30s
Zuerst stelle ich zwei, drei Fragen: Wie viele Nutzer? Wie wichtig ist das System? Welche Daten?
Dann prüfe ich in fester Reihenfolge:
1. **Verfügbarkeit:** Was passiert, wenn ein Teil ausfällt?
2. **Sicherheit:** Wer darf was? Wo sind die Secrets?
3. **Konsistenz:** Können Daten verloren gehen oder doppelt sein?
4. **Kopplung:** Was bricht, wenn sich ein Teil ändert?
5. **Skalierung:** Was passiert bei zehnmal mehr Last?
6. **Monitoring:** Wie merken wir einen Fehler?
7. **Kosten:** Was kostet es, und was ist teuer?
Zu jedem Fehler sage ich einen Fix und einen Trade-off.

## 90s
**Die Fragen pro Punkt:**
- **Verfügbarkeit:** Single Point of Failure? Synchrone Ketten? Backups und Restore?
- **Sicherheit:** Authentifizierung zwischen Services? Secrets im Code? Öffentliche Endpunkte? Personendaten verschlüsselt?
- **Konsistenz:** Transaktionen über Services? Retries ohne Idempotenz? Keine Dead-Letter-Queue?
- **Kopplung:** Geteilte Datenbank? Ein Service kennt zu viele andere?
- **Skalierung:** Zustand im Speicher? Eine Datenbank für alles? Engpässe?
- **Monitoring:** Metriken, Logs, Tracing, Alarme, Health Checks?
- **Kosten:** Feste Kapazität? Immer laufende Cluster? Teure Logs?

**Ein Fund, laut gesagt, immer gleich gebaut:**
„Ich sehe hier ein Problem: Die Datenbank ist ein Single Point of Failure. Wenn sie ausfällt, steht alles. Mein Vorschlag: ein Standby in einer zweiten Zone. Der Trade-off: etwa doppelte DB-Kosten. Wie wichtig ist die Verfügbarkeit für Sie?“

**Zeitplan für 10 Minuten:** 1 Minute Fragen. 7 Minuten die Liste. 2 Minuten: die drei wichtigsten Punkte priorisieren.

## 3min
**Ruhig bleiben mit sechs Personen:**
- **Langsam sprechen.** Kurze Sätze. Eine Pause ist okay.
- **Unterbrechung annehmen:** „Gute Frage. Darf ich den Punkt kurz fertig machen? Dann komme ich darauf.“ Oder direkt antworten, wenn es wichtig ist.
- **Fragen notieren.** Ich schreibe sie auf und beantworte sie der Reihe nach. So vergesse ich nichts.
- **Den Fragenden ansehen, dann alle.** Jeder im Panel soll sich angesprochen fühlen.
- **Nicht wissen ist okay:** „Das weiss ich nicht sicher. Ich würde es so prüfen: …“
- **Widerspruch:** „Sie haben recht, das ist ein Punkt. Meine Sorge ist trotzdem … Wie sehen Sie das?“ Nicht verteidigen um jeden Preis.
- **Struktur als Anker:** Wenn ich den Faden verliere, gehe ich zurück zu meiner Liste: „Ich war bei Konsistenz. Weiter mit Kopplung.“

**Respekt vor dem Diagramm:** Jemand im Raum hat es vielleicht gebaut. Darum sachlich: „Hier sehe ich ein Risiko“ statt „Das ist falsch“. Und Gutes nennen: „Gut finde ich, dass die Services getrennt deployt werden.“

**Priorisieren am Ende:** „Wenn ich nur drei Dinge ändern darf: Backup mit Restore-Test, Authentifizierung zwischen den Services, Retries mit Dead-Letter-Queue.“ Das zeigt Senior-Denken: Nicht alles ist gleich wichtig.

**Mein Hintergrund dafür:** *(Ihr echtes Beispiel: ein Architektur-Review, das Sie geleitet oder erlebt haben.)* In regulierten Umgebungen beim Bund treffe ich technische Design- und Architekturentscheide selbständig. Bei MATCH stehen viele dieser Punkte in der Praxis: Network Policies, Vault, Monitoring, idempotente Jobs.

## Follow-ups
- Warum fangen Sie mit Verfügbarkeit an? → Ein Ausfall trifft alle Nutzer sofort. Danach Sicherheit, weil ein Leck nicht rückgängig zu machen ist.
- Was, wenn Sie nur zwei Probleme finden? → Ich gehe die Liste trotzdem ganz durch. Meistens finde ich bei Monitoring und Kosten noch etwas.
- Was machen Sie, wenn das Panel Ihren Vorschlag ablehnt? → Ich frage nach dem Grund. Vielleicht kenne ich eine Randbedingung nicht. Dann passe ich den Vorschlag an.
- Wie reagieren Sie, wenn zwei Personen gleichzeitig fragen? → „Ich nehme zuerst Ihre Frage, dann Ihre.“ Ruhig, der Reihe nach.
- Welcher Fehler ist der wichtigste? → Der mit dem grössten Schaden mal Wahrscheinlichkeit. Meist Datenverlust oder Sicherheit.

## Don't say
- „Das ist alles falsch.“ Sachlich und mit Respekt.
- Nicht ohne Fix kritisieren. Jeder Fund braucht einen Vorschlag und einen Trade-off.
- Nicht hektisch alle Punkte gleichzeitig nennen.

## Words
- **Architektur-Review** = architecture review
- **unterbrechen** = to interrupt
- **Randbedingung** = constraint
- **Faden verlieren** = lose the thread
- **priorisieren** = to prioritise
