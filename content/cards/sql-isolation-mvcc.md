---
id: sql-isolation-mvcc
round: sql
tech: [postgres]
tier: 1
project: MATCH (atomarer Claim), CARIAD (PostgreSQL)
q: Was ist MVCC, und welche Isolation Levels gibt es in PostgreSQL?
en: What is MVCC, and which isolation levels does PostgreSQL have?
---
## 30s
MVCC heißt Multi-Version Concurrency Control.
Ein Update überschreibt die Zeile nicht. Es schreibt eine neue Version.
Jede Transaktion sieht einen Snapshot, also einen festen Stand.
Darum blockieren Leser keine Schreiber, und Schreiber keine Leser.
Der Standard in PostgreSQL ist Read Committed.
Bei MATCH war Nebenläufigkeit zentral: Zwei Läufe dürfen nie dieselbe Nachricht nehmen.
Soll ich die Isolation Levels mit Beispielen erklären?

## 90s
**So funktioniert MVCC:**
1. Jede Zeilenversion hat `xmin` (wer hat sie geschrieben) und `xmax` (wer hat sie gelöscht).
2. Ein `UPDATE` = alte Version als gelöscht markieren + neue Version schreiben.
3. Ein Snapshot sagt, welche Transaktionen für mich sichtbar sind.
4. Alte Versionen räumt später `VACUUM` auf.

**Die Isolation Levels in PostgreSQL:**
- **Read Committed** (Standard): Jede Anweisung sieht einen neuen Snapshot. Zwei `SELECT`s in einer Transaktion können verschiedene Werte sehen.
- **Repeatable Read:** Ein Snapshot für die ganze Transaktion. In PostgreSQL gibt es dabei auch keine Phantome. Bei einem Konflikt beim Schreiben kommt ein Fehler.
- **Serializable:** Wie hintereinander ausgeführt. PostgreSQL nutzt dafür SSI. Bei Konflikten bricht eine Transaktion ab.
- **Read Uncommitted** gibt es nur als Name. Es verhält sich wie Read Committed. Dirty Reads gibt es in PostgreSQL nie.

Laut gesagt: „Bei Repeatable Read und Serializable muss die Anwendung bei Fehler 40001 die Transaktion wiederholen.“

## 3min
**Das klassische Problem: Lost Update bei Read Committed.**
```
-- zwei Requests gleichzeitig:
SELECT balance FROM accounts WHERE id = 1;   -- beide lesen 100
UPDATE accounts SET balance = 90 WHERE id = 1; -- beide schreiben 90
```
Eine Abbuchung ist verloren. Lösungen:
- Atomar schreiben: `UPDATE accounts SET balance = balance - 10 WHERE id = 1;`
- Pessimistisch sperren: `SELECT ... FOR UPDATE`.
- Optimistisch: Versionsspalte, `UPDATE ... WHERE id = 1 AND version = 7`. 0 Zeilen = Konflikt.

**Bei MATCH** lag die Nachrichtentabelle in SQL Server. Der Claim war ein einziges atomares Statement: `UPDATE ... OUTPUT INSERTED.*`, von Pending auf Processing. So nehmen zwei Läufe nie dieselbe Nachricht. In PostgreSQL schreibe ich das so:
```
UPDATE messages
SET status = 'PROCESSING', claimed_at = now()
WHERE id IN (
  SELECT id FROM messages
  WHERE status = 'PENDING'
  ORDER BY id
  LIMIT 100
  FOR UPDATE SKIP LOCKED
)
RETURNING *;
```

**Kosten von MVCC:**
- Alte Versionen machen die Tabelle größer (Bloat). Autovacuum muss mitkommen.
- Eine lange offene Transaktion hält VACUUM auf. Darum: `idle in transaction` überwachen und `idle_in_transaction_session_timeout` setzen.
- Transaction ID Wraparound: Ohne VACUUM stoppt die DB irgendwann Schreibzugriffe. Autovacuum nie abschalten.

## Follow-ups
- Was ist ein Phantom Read? → Eine zweite gleiche Abfrage findet neue Zeilen. In PostgreSQL schützt schon Repeatable Read davor.
- Was ist Write Skew? → Zwei Transaktionen lesen dasselbe und schreiben verschiedene Zeilen. Beide sind einzeln korrekt, zusammen falsch. Nur Serializable verhindert das.
- Welches Level nehmen Sie? → Read Committed plus gezielte Locks oder atomare Updates. Serializable, wenn die Regeln komplex sind, mit Retry.
- Was macht @Transactional in Spring dabei? → Es startet die Transaktion. Das Level ist der DB-Standard, außer ich setze `isolation = ...`.

## Don't say
- „MVCC heißt, es gibt keine Locks.“ Schreiber auf dieselbe Zeile warten trotzdem.
- „Read Uncommitted macht PostgreSQL schneller.“ Es ist dasselbe wie Read Committed.

## Words
- **Nebenläufigkeit** = concurrency
- **Snapshot** = fester Stand der Daten
- **Bloat** = tote Zeilenversionen, die Platz brauchen
- **Abbuchung** = debit
- **wiederholen** = retry
