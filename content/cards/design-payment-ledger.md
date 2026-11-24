---
id: design-payment-ledger
round: design
tech: [postgres, microservices, kafka]
tier: 2
proof: study
q: Entwerfen Sie das Backend einer Payment-App wie TWINT. Wie stellen Sie sicher, dass kein Geld verloren geht?
en: Design the backend of a mobile payment app like TWINT. How do you make sure no money is lost?
---
## 30s
Zuerst frage ich: Wie viele Nutzer? Wie viele Zahlungen? Zahlen Nutzer an Nutzer oder an Händler?
Ich nehme an: 5 Millionen Nutzer, 2 Millionen Zahlungen pro Tag.
Drei Regeln sind mir wichtig.
1. Idempotency-Key: Eine Zahlung wird nie zweimal gebucht, auch beim Retry.
2. Doppelte Buchführung: Jede Zahlung hat zwei Buchungen, eine minus, eine plus. Die Summe ist immer null.
3. Outbox: Events gehen nur raus, wenn die Buchung wirklich gespeichert ist.
Idempotenz und atomare Claims habe ich bei MATCH gebaut. Eine Payment-App habe ich nicht gebaut.
Soll ich die Tabellen zeigen?

## 90s
**Zahlen:** 2 Millionen pro Tag = etwa 25 pro Sekunde. Spitze, zum Beispiel am Samstag mittags: etwa 300 pro Sekunde. Pro Zahlung etwa 1 KB in drei Tabellen = wenige GB pro Jahr.

**API:**
```
POST /api/payments
Idempotency-Key: 7f3c-...
{ "from": "acc-1", "to": "acc-2", "amount": 2500, "currency": "CHF" }
→ 201 { "paymentId": "...", "status": "COMPLETED" }
GET /api/accounts/{id}/balance
GET /api/accounts/{id}/entries?limit=50
```
Der Betrag ist in Rappen, als ganze Zahl. Nie als float.

**Tabellen:**
```
accounts(id PK, owner_id, currency, balance, version)
payments(id PK, idempotency_key UNIQUE, status, request_hash, created_at)
ledger_entries(id PK, payment_id, account_id, amount, created_at)   -- nur INSERT, nie UPDATE
outbox(id PK, topic, payload, created_at, sent_at)
```

**Eine Zahlung in einer Transaktion:**
```
BEGIN;
INSERT INTO payments(id, idempotency_key, status, request_hash) VALUES (...);  -- unique!
UPDATE accounts SET balance = balance - 2500 WHERE id = 'acc-1' AND balance >= 2500;
-- 0 Zeilen → zu wenig Geld → ROLLBACK
UPDATE accounts SET balance = balance + 2500 WHERE id = 'acc-2';
INSERT INTO ledger_entries VALUES (..., 'acc-1', -2500), (..., 'acc-2', +2500);
INSERT INTO outbox(topic, payload) VALUES ('payment-completed', ...);
COMMIT;
```
Laut gesagt: „Alles ist in einer Transaktion. Entweder alles oder nichts. Der Unique Key stoppt eine doppelte Zahlung.“

**Prüf-Abfrage, laut gesagt:**
```
SELECT payment_id FROM ledger_entries
GROUP BY payment_id HAVING SUM(amount) <> 0;
```
„Diese Abfrage muss immer leer sein. Sonst ist Geld entstanden oder verschwunden.“

## 3min
**Idempotency-Key genau:** Der Client erzeugt den Key vor dem ersten Versuch. Kommt derselbe Key nochmal, gebe ich die gespeicherte Antwort zurück. Kommt derselbe Key mit anderem Betrag, gebe ich einen Fehler. Darum speichere ich `request_hash`.

**Warum doppelte Buchführung?** Der Kontostand ist nur ein Cache. Die Wahrheit ist die Summe der Buchungen. So kann ich jeden Stand nachrechnen und prüfen. Buchungen werden nie geändert. Ein Fehler wird mit einer Gegenbuchung korrigiert.

**Warum Outbox?** Ohne Outbox: Commit klappt, aber das Kafka-Event geht verloren. Oder umgekehrt. Mit Outbox liegt das Event in derselben Transaktion. Ein Relay liest die Outbox und schickt an Kafka. Das ist at-least-once, darum sind die Consumer idempotent.

**Deadlocks:** Zwei Zahlungen A→B und B→A gleichzeitig. Lösung: Konten immer in fester Reihenfolge sperren, zum Beispiel nach ID.

**Skalierung:** 300 pro Sekunde schafft eine PostgreSQL-Primary. Später Sharding nach Konto. Zahlungen über Shards brauchen dann eine Saga. Darum so lange wie möglich in einer Datenbank bleiben.

**Fehler:**
- Timeout beim Client: Er sendet mit demselben Key nochmal. Sicher.
- Externe Bank antwortet nicht: Status PENDING, später abgleichen (Reconciliation) mit der Bank-Datei.
- Tägliche Reconciliation: Summe der Buchungen gegen Kontostände und gegen Bank-Auszüge.

**Sicherheit:** Starke Authentifizierung (Gerät + PIN oder Biometrie). Betrugsregeln, zum Beispiel Limits pro Tag. Audit-Log, das niemand ändern kann. Bei DigiSanté habe ich eine Audit-Library für DSG-konformes Logging gebaut.

**Kosten:** Die Datenbank ist klein. Teuer sind Betrieb, Sicherheit und Compliance.

## Follow-ups
- Warum nicht einfach den Kontostand ändern? → Dann gibt es keine Historie und keine Prüfung. Mit Buchungen kann ich jeden Kontostand beweisen.
- Wo speichern Sie den Idempotency-Key, und wie lange? → In derselben Datenbank, mit Unique Index. Zum Beispiel 30 Tage, dann archivieren.
- Was ist, wenn das Outbox-Relay ein Event zweimal schickt? → Der Consumer speichert die Event-ID und ignoriert Duplikate.
- Wie verhindern Sie einen negativen Kontostand? → `WHERE balance >= :amount` im UPDATE, oder ein CHECK Constraint `balance >= 0`.
- Warum keine verteilte Transaktion (2PC)? → 2PC ist langsam und blockiert bei Ausfällen. Outbox und Saga sind robuster.

## Don't say
- „Ich speichere Beträge als double.“ Rundungsfehler bei Geld sind nicht akzeptabel.
- „Kafka garantiert exactly-once, also kein Problem.“ Das gilt nicht bis in die Datenbank.

## Words
- **die doppelte Buchführung** = double-entry bookkeeping
- **die Buchung / Gegenbuchung** = entry / reversing entry
- **der Abgleich (Reconciliation)** = zwei Quellen vergleichen
- **der Rappen** = 1/100 Franken
- **das Relay** = Prozess, der die Outbox an Kafka schickt
