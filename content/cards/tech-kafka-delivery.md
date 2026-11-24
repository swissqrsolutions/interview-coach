---
id: tech-kafka-delivery
round: tech
tech: [kafka]
tier: 1
project: BIT DAZiT (Kafka), MATCH (Idempotenz-Prinzip)
q: Welche Liefergarantien gibt es in Kafka? Wie bauen Sie einen idempotenten Consumer und eine Dead-Letter-Queue?
en: Which delivery guarantees does Kafka have? How do you build an idempotent consumer and a dead-letter queue?
---
## 30s
Es gibt at-most-once, at-least-once und exactly-once.
In der Praxis nutzen wir at-least-once: Commit erst nach der Verarbeitung.
Dann kann eine Nachricht doppelt kommen. Darum muss der Consumer idempotent sein.
Eine kaputte Nachricht darf die Partition nicht blockieren. Nach ein paar Retries geht sie in ein Dead-Letter-Topic.
Kafka habe ich bei DAZiT eingesetzt. Idempotenz ist auch bei MATCH der Kern: Jeder Retry gibt dasselbe Ergebnis.
Soll ich zeigen, wie der idempotente Consumer aussieht?

## 90s
**Producer – nichts verlieren:**
```
acks=all
enable.idempotence=true      # Standard seit Kafka 3.0
# auf dem Topic: replication.factor=3, min.insync.replicas=2
```
Laut gesagt: „`acks=all` wartet auf alle In-Sync-Replicas. Der idempotente Producer verhindert Duplikate durch eigene Retries.“

**Consumer – at-least-once:**
1. Nachricht lesen.
2. Verarbeiten und in die DB schreiben.
3. Erst dann den Offset committen.
Stirbt der Consumer zwischen 2 und 3, kommt die Nachricht noch einmal.

**Idempotenter Consumer mit PostgreSQL:**
```
BEGIN;
INSERT INTO processed_events (event_id) VALUES (:eventId)
  ON CONFLICT (event_id) DO NOTHING;
-- 0 Zeilen eingefügt → schon verarbeitet → überspringen
-- 1 Zeile eingefügt → Fachlogik ausführen, im selben COMMIT
COMMIT;
```
Gleiche Transaktion für Merker und Fachdaten. Sonst ist die Lücke wieder da.

## 3min
**Fehlerbehandlung in Stufen:**
1. **Kurze Retries** im Consumer, für vorübergehende Fehler (DB kurz weg).
2. **Retry-Topics mit Verzögerung**, zum Beispiel nach 1 min, 10 min. Die Partition läuft weiter.
3. **Dead-Letter-Topic:** Nachricht mit Fehlergrund in den Headern. Alarm. Ein Mensch schaut nach und spielt sie später neu ein.
In Spring Kafka: `DefaultErrorHandler` mit `DeadLetterPublishingRecoverer`, oder `@RetryableTopic`.

**Wichtig:** Fehler unterscheiden. Ein kaputtes Format wird nie gut → sofort ins DLT. Eine DB-Zeitüberschreitung → Retry.

**Exactly-once:** Mit Transaktionen und `isolation.level=read_committed` gilt das für „Lesen aus Kafka → Schreiben in Kafka“. Sobald eine externe DB dabei ist, brauche ich wieder Idempotenz oder das Outbox Pattern.

**Reihenfolge und Retry:** Ein Retry-Topic bricht die Reihenfolge pro Key. Wenn die Reihenfolge fachlich wichtig ist, muss ich den Key blockieren oder die Reihenfolge anders sichern.

**Gleiches Prinzip bei MATCH (ohne Kafka):**
- Merge-on-read: `DELETE WHERE message_id = X`, dann `APPEND`, in einer Iceberg-Transaktion. Ein zweiter Lauf ersetzt, statt zu verdoppeln.
- Statistik: replace-the-result. Montag hat 10 Einträge, 3 kommen dazu → 13. Addiert man bei einem Retry nochmal 3, sind es 16. Neu rechnen gibt immer 13.
- Atomarer Claim und Stale-Job-Recovery: keine Duplikate nach Neustarts.

**DAZiT:** *(Ihr echtes Beispiel: wie bei DAZiT Duplikate und Fehler behandelt wurden, z. B. DLT, Retry, Event-ID.)*

## Follow-ups
- Was ist der Unterschied zwischen idempotentem Producer und idempotentem Consumer? → Der Producer verhindert Duplikate beim Schreiben in Kafka. Der Consumer muss selbst mit doppelten Nachrichten umgehen.
- Woher kommt die Event-ID? → Vom Producer, als eindeutige ID im Event oder Header. Nicht der Offset, der ist nach einem Replay anders.
- Wie lange speichern Sie die verarbeiteten IDs? → Mindestens so lange, wie Duplikate kommen können, zum Beispiel die Retention des Topics.
- Was passiert mit dem DLT danach? → Analysieren, Fehler beheben, dann gezielt zurück ins Haupt-Topic spielen.
- Was ist eine Poison Pill? → Eine Nachricht, die immer scheitert. Ohne DLT blockiert sie die Partition für immer.

## Don't say
- „Kafka garantiert exactly-once, darum brauche ich keine Idempotenz.“ Nicht mit externer DB.
- „Ich committe den Offset vor der Verarbeitung.“ Das ist at-most-once, Nachrichten gehen verloren.

## Words
- **Liefergarantie** = delivery guarantee
- **vorübergehend** = transient
- **Verzögerung** = delay
- **einspielen** = to replay, to re-inject
- **Merker** = marker, record of what was processed
