---
id: sql-locks-deadlock
round: sql
tech: [postgres]
tier: 1
project: MATCH (atomarer Claim, keine überlappenden Läufe)
q: Was ist ein Deadlock, und wie vermeiden Sie ihn?
en: What is a deadlock, and how do you avoid it?
---
## 30s
Ein Deadlock: Zwei Transaktionen warten aufeinander, für immer.
A hat Zeile 1 und will Zeile 2. B hat Zeile 2 und will Zeile 1.
PostgreSQL erkennt das nach `deadlock_timeout`, Standard eine Sekunde.
Dann bricht es eine Transaktion ab, mit Fehler 40P01.
Die beste Vermeidung: immer in derselben Reihenfolge sperren.
Bei MATCH haben wir überlappende Läufe mit einem atomaren Claim verhindert.
Soll ich zeigen, wie ich einen Lock in Produktion finde?

## 90s
**Ein Deadlock in zwei Fenstern:**
```
-- Session A                         -- Session B
BEGIN;                               BEGIN;
UPDATE acc SET v=v-1 WHERE id=1;     UPDATE acc SET v=v-1 WHERE id=2;
UPDATE acc SET v=v+1 WHERE id=2;     UPDATE acc SET v=v+1 WHERE id=1;
-- wartet auf B                      -- wartet auf A → Deadlock
```

**Vermeidung:**
1. Feste Reihenfolge: immer zuerst die kleinere ID. `SELECT ... WHERE id IN (1,2) ORDER BY id FOR UPDATE;`
2. Kurze Transaktionen. Kein HTTP-Aufruf in einer offenen Transaktion.
3. Weniger sperren: atomare Updates statt Lesen-dann-Schreiben.
4. Bei Warteschlangen: `FOR UPDATE SKIP LOCKED`. Jeder Worker nimmt freie Zeilen, niemand wartet.

**Und trotzdem:** Die Anwendung fängt 40P01 und 40001 und wiederholt die Transaktion, ein paar Mal, mit kurzer Pause.

## 3min
**Locks finden in Produktion:**
```
SELECT pid,
       pg_blocking_pids(pid) AS blocked_by,
       state,
       wait_event_type,
       now() - xact_start AS tx_age,
       left(query, 80) AS query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;
```
Laut gesagt: „Ich sehe, wer wartet und wer blockiert. Oft ist der Blocker eine Session im Status `idle in transaction`.“

**Lock-Arten, die man kennen muss:**
- Zeilen-Locks: `FOR UPDATE`, `FOR NO KEY UPDATE`, `FOR SHARE`.
- Tabellen-Locks: `ALTER TABLE` braucht meistens `ACCESS EXCLUSIVE`. Das blockiert sogar `SELECT`.

**Die gefährliche Migration:**
Ein `ALTER TABLE` wartet auf eine lange Abfrage. Hinter dem `ALTER` warten dann alle neuen Abfragen. Die App steht.
Lösung für Flyway-Migrationen:
```
SET lock_timeout = '5s';
ALTER TABLE orders ADD COLUMN note text;
```
Schlägt es fehl, versuche ich es später wieder. Indizes baue ich mit `CREATE INDEX CONCURRENTLY`.

**Bei MATCH:** Die Nachrichtentabelle lag in SQL Server. Der Claim war ein einziges Statement `UPDATE ... OUTPUT INSERTED.*` (Pending → Processing). Kein Lesen-dann-Schreiben, darum keine Race Condition zwischen zwei Läufen. Nachrichten, die zu lange in Processing hängen, setzt eine Stale-Job-Recovery zurück auf Pending.

**Advisory Locks:** Für „nur ein Job gleichzeitig“ gibt es `pg_try_advisory_lock(42)`. Er gehört zur Session und braucht keine Tabelle.

## Follow-ups
- Was ist der Unterschied zwischen Deadlock und Lock-Warten? → Beim Warten endet es, wenn der andere fertig ist. Beim Deadlock endet es nie ohne Abbruch.
- Was macht SKIP LOCKED? → Gesperrte Zeilen werden übersprungen. Gut für Job-Queues in der DB.
- Was macht NOWAIT? → Ist die Zeile gesperrt, kommt sofort ein Fehler statt Warten.
- Wie loggen Sie Lock-Probleme? → `log_lock_waits = on`. Dann loggt PostgreSQL Wartezeiten länger als `deadlock_timeout`.
- Optimistisch oder pessimistisch? → Optimistisch mit Versionsspalte bei wenigen Konflikten. Pessimistisch bei vielen Konflikten auf denselben Zeilen.

## Don't say
- „PostgreSQL hat keine Deadlocks wegen MVCC.“ Schreiber sperren trotzdem Zeilen.
- „Ich erhöhe einfach den Timeout.“ Das versteckt das Problem.

## Words
- **sperren** = to lock
- **aufeinander warten** = to wait for each other
- **abbrechen** = to abort
- **überspringen** = to skip
- **Race Condition** = Ergebnis hängt vom Timing ab
