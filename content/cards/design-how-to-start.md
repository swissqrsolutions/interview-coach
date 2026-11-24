---
id: design-how-to-start
round: design
tech: [rest, postgres, microservices]
tier: 1
proof: study
q: Wie gehen Sie an eine System-Design-Frage heran?
en: How do you approach a system design question?
---
## 30s
Ich arbeite immer mit demselben Rahmen.
Zuerst stelle ich Fragen: Wer nutzt das System? Wie viele Nutzer? Wie viele Daten?
Dann rechne ich grob: Anfragen pro Sekunde und Speicher pro Jahr.
Dann zeige ich die API, die Tabellen und den Ablauf.
Erst danach kommen Skalierung, Fehler, Sicherheit und Kosten.
Bei MATCH war die wichtigste Frage: Wie schnell müssen die Daten da sein? Die Antwort war: Minuten reichen. Darum haben wir Batch gewählt.
Soll ich den Rahmen an einem Beispiel zeigen?

## 90s
**Der Rahmen in neun Schritten (45 Minuten):**
1. **Fragen (5 Min):** Welche Funktionen? Wie viele Nutzer? Mehr Lesen oder mehr Schreiben? Wie aktuell müssen die Daten sein?
2. **Zahlen (3 Min):** Ich rechne laut.
3. **API (5 Min):** drei bis fünf Endpoints, mit Eingabe und Antwort.
4. **Datenmodell (7 Min):** Tabellen, Schlüssel, Index. Dazu ein oder zwei SQL-Abfragen, laut gesagt.
5. **Ablauf (5 Min):** Was passiert bei einer Anfrage? Ich zeichne Boxen von links nach rechts.
6. **Speicher und Suche (5 Min):** Datenbank, Object Storage, Cache, Suchindex.
7. **Skalierung (5 Min):** Wo ist der Engpass? Was skaliert horizontal?
8. **Fehler (5 Min):** Was passiert, wenn ein Teil ausfällt? Was, wenn eine Nachricht doppelt kommt?
9. **Sicherheit und Kosten (5 Min):** Login, Rechte, Verschlüsselung. Was kostet am meisten?

**Rechnen mit einfachen Zahlen:**
- Ein Tag hat rund 100 000 Sekunden (genau 86 400).
- 1 Million Anfragen pro Tag = etwa 12 pro Sekunde.
- Die Spitze ist oft drei- bis fünfmal höher als der Durchschnitt.
- Beispiel: 1 Million Nutzer, je 10 Anfragen pro Tag = 10 Millionen pro Tag = etwa 120 pro Sekunde, Spitze etwa 500.

**SQL laut sagen (Beispiel):**
```
SELECT id, status, created_at
FROM orders
WHERE customer_id = :customer
ORDER BY created_at DESC
LIMIT 20;
-- Index: orders(customer_id, created_at)
```
Laut gesagt: „Ich filtere nach Kunde. Ich sortiere nach Datum. Der Index passt genau zu dieser Abfrage.“

## 3min
**Einfach anfangen, dann wachsen:**
- Version 1: ein Service und eine PostgreSQL-Datenbank. Das reicht oft für hunderte Anfragen pro Sekunde.
- Version 2: Cache, Read Replicas, eine Queue für langsame Arbeit.
- Version 3: Sharding, eigene Services. Nur wenn die Zahlen das zeigen.

**Konsistenz zuerst klären:**
- Geld, Buchungen, Lagerbestand: stark konsistent. Transaktionen in einer Datenbank.
- Feeds, Suche, Statistiken: eventual consistency ist ok. Ein paar Sekunden alt ist kein Problem.

**Die Fehler-Checkliste:**
- Ein Service fällt aus: Retry mit Backoff, Timeout, Circuit Breaker.
- Eine Nachricht kommt doppelt: Der Consumer ist idempotent.
- Ein Job läuft zweimal: Ergebnis ersetzen statt addieren. So machen wir es bei MATCH: Der Statistik-Job rechnet einen ganzen Tag neu und überschreibt ihn.
- Zwei Worker nehmen dieselbe Arbeit: atomarer Claim mit SQL. Bei MATCH: `UPDATE ... OUTPUT INSERTED.*` von Pending zu Processing.

**Sicherheit:** Login mit OIDC (zum Beispiel Keycloak). Rechte pro Mandant. Private Netze und Secrets im Vault, nie im Repo. So war es bei DigiSanté und MATCH.

**Kosten:** Ich nenne den grössten Kostenblock. Oft ist es Speicher, Rechenzeit oder ein externer Dienst pro Aufruf.

**Wenn der Interviewer keine Zahlen gibt:** Ich sage „Ich nehme an …“ und schreibe die Annahme an die Tafel. Später kann er sie ändern.

**Wenn ich unterbrochen werde:** Ich beantworte die Frage. Dann sage ich, wo ich im Rahmen bin, und mache weiter.

## Follow-ups
- Warum fangen Sie nicht direkt mit Microservices an? → Microservices kosten Betrieb und machen Fehler schwerer. Ich teile erst, wenn Teams oder Last es verlangen.
- Was machen Sie, wenn Sie die Zahlen nicht wissen? → Ich nehme eine Zahl an und sage sie laut. Dann zeige ich, was sich bei zehnmal mehr ändert.
- Wie wählen Sie die Datenbank? → Standard ist PostgreSQL: Transaktionen, SQL, JSONB. Eine andere nur mit einem klaren Grund, zum Beispiel sehr viele Schreibzugriffe oder Volltextsuche.
- Was ist Ihr grösster Fehler in Design-Interviews? → Zu früh zu viele Boxen zeichnen. Darum stelle ich zuerst Fragen.
- Wie zeigen Sie Seniorität? → Ich nenne Trade-offs, Fehlerfälle und Kosten. Und ich sage, was ich weglasse und warum.

## Don't say
- Nicht sofort Kafka, Kubernetes und zehn Services zeichnen.
- Nicht „es kommt darauf an“ ohne Antwort. Sagen: „Es kommt auf X an. Ich nehme Y an, dann wähle ich Z.“

## Words
- **die Annahme** = assumption
- **der Engpass** = bottleneck
- **die Spitze / Spitzenlast** = peak load
- **horizontal skalieren** = mehr Instanzen statt grösserer Maschine
- **eventual consistency** = Daten sind nach kurzer Zeit überall gleich
