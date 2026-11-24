---
id: tech-micro-outbox
round: tech
tech: [microservices]
tier: 1
project: BIT DAZiT, ElCom MATCH
q: Was ist das Transactional Outbox Pattern? Welches Problem löst es?
en: What is the transactional outbox pattern? Which problem does it solve?
---
## 30s
Das Problem heisst Dual Write: Ein Service schreibt in die Datenbank und sendet ein Event an Kafka.
Das sind zwei Systeme. Eins kann fehlschlagen. Dann sind die Daten inkonsistent.
Bei der Outbox schreibe ich das Event in derselben DB-Transaktion in eine Outbox-Tabelle.
Ein zweiter Prozess liest die Tabelle und sendet die Events an Kafka.
So geht kein Event verloren.
Bei DAZiT haben wir Fachsysteme über Kafka verbunden. *(Prüfen: Hatten Sie dort eine Outbox?)*
Bei MATCH gibt es eine ähnliche Idee: eine Nachrichten-Tabelle mit Status, die ein Worker abarbeitet.
Soll ich zeigen, wie der Relay funktioniert?

## 90s
**Ablauf:**
1. Der Service startet eine Transaktion.
2. Er schreibt die Fachdaten, zum Beispiel `declarations`.
3. Er schreibt das Event in `outbox`. Gleiche Transaktion.
4. Commit. Beides ist gespeichert, oder nichts.
5. Ein Relay liest neue Zeilen aus `outbox` und sendet sie an Kafka.
6. Nach dem Senden markiert er die Zeile als gesendet oder löscht sie.

```sql
CREATE TABLE outbox (
  id            uuid PRIMARY KEY,
  aggregate_id  text NOT NULL,          -- wird der Kafka-Key
  type          text NOT NULL,
  payload       jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  sent_at       timestamptz
);
```

**Zwei Arten von Relay:**
- **Polling:** Ein Job liest alle paar Sekunden `WHERE sent_at IS NULL ORDER BY created_at`. Einfach.
- **CDC (Change Data Capture):** Debezium liest das Transaktions-Log der Datenbank und schreibt nach Kafka. Weniger Last auf der DB, kleine Latenz, aber mehr Infrastruktur.

## 3min
**Liefergarantie:** Der Relay kann abstürzen nach dem Senden, aber vor dem Markieren. Dann sendet er das Event noch einmal. Die Outbox gibt also at-least-once. Darum müssen Consumer idempotent sein. Die Event-ID aus der Outbox hilft dabei.

**Reihenfolge:** Events pro Aggregat in der richtigen Reihenfolge senden. Darum `aggregate_id` als Kafka-Key. Gleicher Key = gleiche Partition = feste Reihenfolge.

**Mehrere Relay-Instanzen:** Zwei Instanzen dürfen nicht dieselben Zeilen senden. In PostgreSQL: `SELECT ... FOR UPDATE SKIP LOCKED`. Bei MATCH haben wir das gleiche Problem mit einem atomaren Claim gelöst: `UPDATE ... OUTPUT INSERTED.*` von Pending auf Processing.

**Aufräumen:** Die Outbox wächst. Ein Job löscht gesendete Zeilen nach ein paar Tagen.

**Monitoring:** Anzahl ungesendeter Zeilen und Alter der ältesten Zeile. Wächst das, hängt der Relay. Bei MATCH haben wir den Backlog der Pending-Nachrichten genauso in Grafana überwacht.

**Alternativen:**
- `@TransactionalEventListener(phase = AFTER_COMMIT)` sendet nach dem Commit. Aber stürzt der Service genau dann ab, ist das Event weg.
- Kafka-Transaktionen helfen nicht. Sie gelten nur innerhalb von Kafka, nicht für die Datenbank.

## Follow-ups
- Warum nicht einfach erst DB, dann Kafka? → Stürzt der Service dazwischen ab, fehlt das Event. Andersherum kann ein Event ohne Daten entstehen.
- Was ist das Inbox Pattern? → Die Gegenseite: Der Consumer speichert die Event-ID in einer Inbox-Tabelle. Duplikate werden erkannt und ignoriert.
- Polling oder Debezium? → Polling für wenig Last und kleine Teams. Debezium bei hoher Last oder wenn viele Services eine Outbox haben.
- Wie verhindern Sie, dass zwei Relays dasselbe senden? → `FOR UPDATE SKIP LOCKED` oder ein atomarer Claim mit Statuswechsel.
- Garantiert die Outbox exactly-once? → Nein, at-least-once. Exactly-once Wirkung erreiche ich mit idempotenten Consumern.

## Don't say
- „Kafka-Transaktionen lösen das.“ Nicht über DB und Kafka hinweg.
- „Mit der Outbox gibt es keine Duplikate.“ Es gibt sie. Der Consumer muss damit umgehen.

## Words
- **der doppelte Schreibvorgang (Dual Write)** = in zwei Systeme schreiben
- **inkonsistent** = nicht zusammenpassend
- **der Relay** = Prozess, der die Outbox an Kafka weitergibt
- **abarbeiten** = to process (a queue)
- **der Rückstau (Backlog)** = backlog
