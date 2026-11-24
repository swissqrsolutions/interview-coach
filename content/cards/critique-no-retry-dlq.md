---
id: critique-no-retry-dlq
round: critique
tech: [microservices, kafka, azure]
tier: 1
project: ElCom MATCH (stale-job recovery, replace-the-result)
q: Ein Consumer liest Nachrichten und ruft eine externe API. Was fehlt in dieser Architektur?
en: A consumer reads messages and calls an external API. What is missing in this architecture?
---
## 30s
**Die Architektur (als Text):**
```
Producer → Queue → Consumer → externe API → DB
Consumer: Auto-Commit sofort nach dem Lesen.
Bei Fehler: Log-Eintrag, Nachricht ist weg. Keine Retries, keine Dead-Letter-Queue.
```
Es fehlen Retries und eine Dead-Letter-Queue. Und die Verarbeitung ist nicht idempotent.
Durch Auto-Commit vor der Verarbeitung gehen Nachrichten verloren. Das ist at-most-once.
Fällt die API kurz aus, sind alle Nachrichten in dieser Zeit weg.
Fix: Commit nach der Verarbeitung, Retry mit Backoff, danach eine Dead-Letter-Queue.
Und ein idempotenter Consumer, weil Nachrichten dann doppelt kommen können.

## 90s
**Meine Liste mit Fix und Trade-off:**
1. **Verfügbarkeit:** Ein kurzer API-Ausfall verliert Daten. → Retry mit exponentiellem Backoff und Jitter, zum Beispiel 1 s, 2 s, 4 s, maximal 5 Versuche. Circuit Breaker gegen die API.
2. **Sicherheit:** In der DLQ liegen ganze Nachrichten, vielleicht mit Personendaten. → Gleiche Zugriffsrechte und Aufbewahrungsfristen wie die Hauptdaten.
3. **Konsistenz:** At-most-once verliert Daten. At-least-once bringt Duplikate. → At-least-once plus idempotente Verarbeitung: eine eindeutige Message-ID speichern, Duplikate ignorieren.
4. **Kopplung:** Der Consumer hängt direkt an der Verfügbarkeit der API. → Retries und DLQ entkoppeln die Fehler.
5. **Skalierung:** Eine kaputte Nachricht blockiert die Partition (Poison Message). → Nach n Versuchen in die DLQ, dann weiter.
6. **Monitoring:** Nur ein Log-Eintrag. → Metriken: Anzahl Retries, Grösse der DLQ, Consumer Lag. Alarm, wenn die DLQ wächst.
7. **Kosten:** Retries kosten API-Aufrufe. Bei kostenpflichtigen APIs Limit setzen.

**Idempotenz in SQL:**
```sql
INSERT INTO processed_messages (message_id) VALUES (:id)
ON CONFLICT (message_id) DO NOTHING;
-- 0 Zeilen eingefügt = schon verarbeitet → überspringen
```
Diese Prüfung und die eigentliche Änderung laufen in derselben DB-Transaktion.

## 3min
**Welche Fehler darf man wiederholen?**
- Vorübergehend: Timeout, 503, 429 → Retry.
- Dauerhaft: 400, Validierungsfehler, kaputtes JSON → sofort in die DLQ. Ein Retry hilft nie.

**Was passiert mit der DLQ?** Eine DLQ ohne Prozess ist ein Friedhof. Ich brauche:
- einen Alarm,
- eine Ansicht der Nachrichten mit Fehlergrund,
- einen Weg zum erneuten Senden (Redrive) nach dem Fix.

**Aus meiner Praxis, MATCH:** Wir haben keine Queue mit DLQ, sondern einen Status pro Nachricht in MSSQL. Spark holt Nachrichten atomar: Pending → Processing. Danach Completed oder Failed. Nachrichten, die zu lange in Processing hängen, setzt die Stale-Job-Recovery zurück auf Pending. Die Statistik nutzt „Ersetzen statt Addieren“: Ein Tag wird neu gerechnet und überschrieben. So ist ein Retry immer sicher. Beispiel aus dem Sprint-Review: Montag hat 10 Datensätze, 3 kommen dazu, richtig sind 13. Addieren bei einem Retry gibt 16. Neu rechnen gibt immer 13.

**Trade-off:** Retries machen das System robuster, aber langsamer bei Fehlern. Zu viele Retries überlasten die API weiter (Retry Storm). Darum Limit, Backoff und Circuit Breaker zusammen.

## Follow-ups
- Was ist exponentieller Backoff mit Jitter? → Die Wartezeit verdoppelt sich pro Versuch. Jitter ist ein Zufallsanteil, damit nicht alle Clients gleichzeitig wiederholen.
- Wie geht DLQ in Kafka? → Kafka hat keine eingebaute DLQ. Man nutzt ein eigenes Topic, zum Beispiel mit Spring Kafka `DeadLetterPublishingRecoverer`.
- Und in Azure? → Service Bus hat eine eingebaute Dead-Letter-Queue pro Queue. Nach `MaxDeliveryCount` landet die Nachricht dort.
- Wie verhindern Sie doppelte Zahlungen bei Retries? → Idempotency Key an die externe API senden. Viele Zahlungs-APIs unterstützen das.
- Was ist eine Poison Message? → Eine Nachricht, die immer scheitert. Ohne DLQ blockiert sie die Verarbeitung für immer.

## Don't say
- „Wir machen unendlich viele Retries.“
- „Exactly-once löst das.“ Gegenüber einer externen API gibt es das nicht. Idempotenz ist die Lösung.

## Words
- **Dead-Letter-Queue (DLQ)** = queue for messages that failed
- **Backoff** = waiting longer between retries
- **idempotent** = same result when run twice
- **Poison Message** = message that always fails
- **erneut senden (Redrive)** = send again after a fix
