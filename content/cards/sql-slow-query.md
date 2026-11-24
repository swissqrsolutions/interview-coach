---
id: sql-slow-query
round: sql
tech: [postgres]
tier: 1
project: MATCH (Performance), CARIAD (Spring Boot + PostgreSQL)
q: Eine Abfrage ist plötzlich langsam. Wie gehen Sie vor?
en: A query is suddenly slow. How do you proceed?
---
## 30s
Ich gehe in Schritten vor und rate nicht.
Erstens: Ist nur diese Abfrage langsam, oder die ganze DB?
Zweitens: Ich finde die Abfrage mit `pg_stat_statements`.
Drittens: Ich lese den Plan mit `EXPLAIN (ANALYZE, BUFFERS)`.
Dann prüfe ich Index, Statistik, Locks und Datenmenge.
Bei MATCH habe ich Performance mit Partition Pruning und atomaren Claims gelöst.
Soll ich die Schritte genauer zeigen?

## 90s
**1. Die DB oder die Abfrage?**
CPU, I/O, Verbindungen in Grafana. Wartet die Abfrage auf Locks?
```
SELECT pid, state, wait_event_type, wait_event,
       now() - query_start AS running_for,
       left(query, 80)
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY running_for DESC;
```

**2. Die teuersten Abfragen finden:**
```
SELECT calls,
       round(mean_exec_time) AS avg_ms,
       round(total_exec_time) AS total_ms,
       left(query, 80)
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```
Laut gesagt: „Ich sortiere nach Gesamtzeit. Eine schnelle Abfrage, die eine Million Mal läuft, kann das größte Problem sein.“

**3. Den Plan lesen:** `EXPLAIN (ANALYZE, BUFFERS)` mit echten Parametern. Ich suche: Seq Scan auf großer Tabelle, falsche Schätzung, Sortierung auf Disk.

**4. Die Ursache beheben**, nur eine Änderung auf einmal, dann wieder messen.

## 3min
**Typische Ursachen für „plötzlich langsam“:**
- **Statistik veraltet** nach einem großen Import. → `ANALYZE tabelle`.
- **Datenmenge gewachsen.** Ein Nested Loop war bei 1 000 Zeilen gut, bei 1 Million nicht.
- **Fehlender Index** nach einer neuen Abfrage oder einer Migration.
- **Bloat:** viele tote Zeilen, Autovacuum kommt nicht mit. → `pg_stat_user_tables` (`n_dead_tup`, `last_autovacuum`).
- **Locks:** eine lange Transaktion oder eine Migration blockiert.
- **Generic Plan** bei Prepared Statements: Nach fünf Ausführungen kann PostgreSQL einen allgemeinen Plan nehmen. Für seltene Werte passt er schlecht.

**In der Anwendung (Spring / Hibernate):**
- **N+1-Problem:** Eine Liste lädt, dann pro Zeile eine weitere Abfrage. → `JOIN FETCH` oder `@EntityGraph`.
- Zu große Ergebnismengen ohne Paging.
- Verbindungs-Pool zu klein: Die Abfrage ist schnell, aber sie wartet auf eine Verbindung.

**Für die Zukunft:**
- `auto_explain` mit `log_min_duration` loggt den Plan langsamer Abfragen.
- `log_min_duration_statement` für ein Log aller langsamen Abfragen.
- Alarm auf die Dauer wichtiger Abfragen.

**Bei MATCH** war die Datenmenge groß: 250 Millionen Zeilen und mehr. Was geholfen hat: Partitionierung nach `days(received_date)` und `schema_type`, damit Abfragen nur wenige Partitionen lesen. Grafana und Prometheus zeigen dort Job-Dauern und den Rückstau an Pending-Nachrichten.

## Follow-ups
- Was ist ein N+1-Problem? → Eine Abfrage für die Liste, plus eine pro Element. Bei 100 Elementen 101 Abfragen.
- Was tun Sie, wenn Sie den Code nicht ändern dürfen? → Index oder Statistik ändern, Parameter wie `work_mem` für diese Rolle anpassen.
- Wie testen Sie, ob Ihr Fix hilft? → Vorher und nachher `EXPLAIN ANALYZE` mit denselben Parametern. Danach in `pg_stat_statements` beobachten.
- Was ist, wenn die Abfrage nur manchmal langsam ist? → Parameter-abhängiger Plan, Cache kalt, oder Locks. Ich prüfe den Plan mit den langsamen Parametern.

## Don't say
- „Ich füge einfach einen Index hinzu.“ Erst messen, dann ändern.
- „Wir brauchen eine größere Maschine.“ Das ist der letzte Schritt, nicht der erste.

## Words
- **raten** = to guess
- **Ursache** = root cause
- **veraltet** = outdated
- **Rückstau** = backlog
- **messen** = to measure
