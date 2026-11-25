# Coverage-Check (Pilot, 2026-11-25)

Frage pro Winkel: Hat der Seiten-Text (nicht nur das Gerüst) mindestens 2 konkrete Fakten (Mechanismus, Zahl, Trade-off)?
„vorher" = Anzahl Fakten im Text vor dem Pilot (grob gezählt).

## java/hashmap.html

| Winkel | vorher (Anzahl Fakten) | was ergänzt wurde |
|---|---|---|
| Warum? | 3 (O(1) im Schnitt, Grund für Hash-Spreading, Grund für Zweierpotenz) | nichts |
| Wie innen? | 10+ (Buckets, Node, Index-Formel, Chaining, Treeify, Untreeify, Resize-Split) | nichts |
| Zahlen | 8+ (16, 0.75, 8, 6, 64, 1000 → 1024/768, Resize bei 13/25/49/97) | nichts |
| Vergleich | 9 (LinkedHashMap, TreeMap, ConcurrentHashMap, Hashtable, …) | nichts |
| Produktion | 6 (Threads, Cache-Leak, veränderte Schlüssel, schlechter hashCode, Resize-Spitzen, Speicher) | nichts |
| Design | 5 (unveränderliche Schlüssel, Records, Vorgrösse, Map-Wahl, Cache mit Grenze) | nichts |

## java/jit-compiler.html

| Winkel | vorher | was ergänzt wurde |
|---|---|---|
| Warum? | 3 (Interpreter langsam, 3700 vs 120 ms, Profil-basierte Optimierung) | nichts |
| Wie innen? | 8+ (Tiered 0–4, C1/C2, Profil, Deopt, OSR, Code Cache, Inlining, Escape Analysis) | nichts |
| Zahlen | 6 (200, 5000, 35/325 Bytes, 240 MB, 8000 Bytes, Messwerte) | Diagnose: echte Flag-Werte aus `-XX:+PrintFlagsFinal` (OpenJDK 17.0.3): Tier3/Tier4 Invocation- und BackEdge-Schwellen, MaxInlineSize, FreqInlineSize, ReservedCodeCacheSize, DontCompileHugeMethods; `HugeMethodLimit` 8000 als develop-Flag (Quellcode); `Tier3LoadFeedback = 5` (Schwellen wachsen mit der Queue-Länge: bei 5 wartenden Methoden pro C1-Thread doppelt, bei 10 dreifach) |
| Vergleich | 5 (Interpreter, JIT, Native Image, AOT Cache, CDS) | nichts |
| Produktion | 6 (Warm-up, CPU-Limits, Code Cache voll, Serverless, Benchmarks, riesige Methoden) | nichts |
| Design | 4 (Megamorph, lesbarer Code, JIT vs Native Image, erst messen) | nichts |

## postgres/isolation-levels.html

| Winkel | vorher | was ergänzt wurde |
|---|---|---|
| Warum? | 5 (Dirty, Non-repeatable, Phantom, Lost Update, Write Skew) | nichts |
| Wie innen? | 8+ (Snapshot pro Befehl/Transaktion, Re-Check in RC, SSI, SIRead Locks, Pivot, Deferrable) | nichts |
| Zahlen | 3 (40001, 40P01, `max_pred_locks_per_transaction` 64) | Diagnose: `max_pred_locks_per_page = 2`, `max_pred_locks_per_relation = -2` (= 64 / 2 = 32 pro Tabelle, dann Tabellen-Lock) und warum das die 40001-Rate erhöht (laut PostgreSQL-19-Doku) |
| Vergleich | 8 (Levels, Standard vs PG, SQL Server, Oracle, MySQL, pessimistisch/optimistisch) | nichts |
| Produktion | 6 | nichts |
| Design | 6 (Senior-Punkte, atomare Updates, FOR UPDATE, Constraints) | nichts |

## kafka/consumer-groups.html

| Winkel | vorher | was ergänzt wurde |
|---|---|---|
| Warum? | 1 (Partitionen teilen, ein Besitzer – aber ohne Begründung) | Details: warum genau ein Besitzer pro Partition (Reihenfolge nur pro Partition, ein Offset pro Gruppe und Partition); warum Partitionsanzahl später schwer änderbar ist (Key → andere Partition) |
| Wie innen? | 8+ (Coordinator, Join/Sync, Leader, KIP-848, Epoch, Listener) | nichts |
| Zahlen | 3 (45 s, 5 min, 500) | Details: Broker-Standards `group.consumer.session.timeout.ms` 45 s, `group.consumer.heartbeat.interval.ms` 5 s, Assignoren `uniform,range`; `heartbeat.interval.ms` 3 s und Doku-Empfehlung ≤ 1/3 der Session (Kafka 4.4 Configs) |
| Vergleich | 5 (Eager, Cooperative, KIP-848, Static Membership, Share Groups) | nichts |
| Produktion | 6 | nichts |
| Design | 6 (Partitionen = Parallelität, Idempotenz, KEDA, schrittweise Migration) | nichts |

## Noch schwach oder nicht verifiziert

- jit-compiler.html: Das Beispiel ist als „Echte Ausgabe, OpenJDK 21" markiert. Hier ist nur JDK 17 installiert; diese Ausgabe und die Messwerte (3700/133/120 ms) konnte ich nicht nachprüfen.
- jit-compiler.html: Die Schwellen 200/5000 sind Richtwerte. Die echte Entscheidung nutzt auch `Tier3CompileThreshold` (2000) usw. Die Seite sagt „ca.", das reicht für das Interview.
- jit-compiler.html: Java 24 (JEP 483) und Java 25 (JEP 515) stehen schon vorher auf der Seite, im Pilot nicht neu geprüft.
- isolation-levels.html: Quellen-Zeile nennt PostgreSQL 17 Doku; aktuell ist PostgreSQL 19 (Doku vom 2026-11-19 geprüft für Tabelle 13.1 und `max_pred_locks_*`, die Werte sind gleich). Das Beispiel bleibt „Erwartetes Ergebnis"; Docker (pg17) lief nicht.
- consumer-groups.html: Aussage „Share Groups produktionsreif seit Kafka 4.2" nicht im Pilot neu geprüft.
- case-image-upload.html (Suche): Elastic-Doku geprüft für k1 = 1.2, b = 0.75, `cosine` als Standard, HNSW, `num_candidates` (pro Shard, max. 10 000), Filter während kNN, RRF `rank_constant` 60, `german`-Analyzer ohne Decompounder, Empfehlung `hyphenation_decompounder`. OpenSearch-Doku nicht separat geprüft (gleiche BM25-Standards angenommen, da Lucene). Die Query ist nicht ausgeführt (kein Cluster, Docker aus).
- case-image-upload.html: Gerüst, Muster und Selbsttest-Gruppen wurden für diese Seite bewusst noch nicht gebaut (Pilot: nur Aufgabe 5).

## postgres/indexes.html

| Winkel | vorher (Anzahl Fakten) | was ergänzt wurde |
|---|---|---|
| Warum? | 4 (Seq Scan vermeiden, 3–4 Ebenen, Write-Kosten, keine Sichtbarkeit im Index) | nichts |
| Wie innen? | 10+ (Heap/TID, Root/Inner/Leaf, Leaf-Kette, VM, Index-Only, Bitmap, GIN Pending List, BRIN min/max) | nichts |
| Zahlen | 8+ (8 kB, 4 MB, 128 Pages, 32-Bit-Hash, seit 10/11/12/13/14/15/16, Skip Scan 18) | Details: Skip Scan – EXPLAIN ANALYZE zeigt seit 18 die Zahl der Index-Abstiege; GIN: `gin_pending_list_limit` pro Index setzbar, paralleler GIN-Build seit 18 (Release Notes 18, Doku 19) |
| Vergleich | 10 (B-Tree, Hash, GIN, GiST, SP-GiST, BRIN, Partial, Expression, Covering, Clustered Index) | nichts |
| Produktion | 8 | nichts |
| Design | 7 (Senior-Punkte) | nichts |

## postgres/planner-explain.html

| Winkel | vorher | was ergänzt wurde |
|---|---|---|
| Warum? | 3 (billigster Plan, Unabhängigkeits-Annahme, Fehler pflanzt sich nach oben fort) | nichts |
| Wie innen? | 8+ (Parser/Rewriter/Planner/Executor, pg_statistic, Kostenmodell, Bottom-up, loops, Custom/Generic Plan) | Details: Regel für Generic Plan genau (Kosten vs Schnitt der 5 Custom Plans, laut `PREPARE`-Doku) |
| Zahlen | 10+ (Kosten-Konstanten, 300 × 100, 0.1 + 50, 4 GB, 100 000, 8/12, 5) | Details: `random_page_cost` 1.1 als Praxiswert markiert (nicht in der Doku); EXPLAIN-Option `IO` (19); pg_stat_statements zählt Generic/Custom Plans (19); Memoize-Schätzungen in EXPLAIN (19); JIT-Hinweis „12 bis 18 an“ |
| Vergleich | 7 | nichts |
| Produktion | 7 | nichts |
| Design | 6 | nichts |

## postgres/join-algorithms.html

| Winkel | vorher | was ergänzt wurde |
|---|---|---|
| Warum? | 3 (Kern: drei Fälle, Senior: kein Algorithmus schlecht, NL Risiko-Join) | nichts |
| Wie innen? | 10+ (Build/Probe, Batches, zwei Zeiger, mark/restore, Materialize, Memoize, Semi/Anti) | Details: Merge Join mit Incremental Sort (18); Memoize für Anti Joins + Schätzungen in EXPLAIN (19) |
| Zahlen | 6 (4 MB × 2.0 = 8 MB, 8, 12, Batches, seit 11/14/15) | Details: Doku-Beispiel „4 Worker → bis 5-facher Speicher“ |
| Vergleich | 6 (Tabelle, FULL JOIN, Spark, MySQL 8.0.18) | nichts |
| Produktion | 6 | nichts |
| Design | 6 | Details + Falle: `NOT IN` wird seit 19 ein Anti Join, wenn keine NULLs möglich sind (Release Notes 19) |

## postgres/window-functions.html

| Winkel | vorher | was ergänzt wurde |
|---|---|---|
| Warum? | 3 (Zeilen bleiben, Self-Join O(n²) vs ein Durchlauf, ersetzt App-Code) | nichts |
| Wie innen? | 6 (Reihenfolge der Klauseln, WindowAgg, Sort, Frame, Tuplestore) | nichts |
| Zahlen | 3 (seit 11 RANGE-Offset/GROUPS/EXCLUDE, Run Condition 15, IGNORE NULLS 19) | Details: Tuplestore über `work_mem` (Standard 4 MB); EXPLAIN zeigt seit 18 Speicher/Platte beim WindowAgg; Diagnose-Punkt dazu |
| Vergleich | 9 | nichts |
| Produktion | 6 | nichts |
| Design | 6 | nichts |

## postgres/ctes.html

| Winkel | vorher | was ergänzt wurde |
|---|---|---|
| Warum? | 3 (Lesbarkeit, Rekursion, atomare DML in einer Anweisung) | nichts |
| Wie innen? | 8+ (Inlining-Regeln, CTE Scan, Working/Intermediate Table, Snapshot, RETURNING) | nichts |
| Zahlen | 5 (seit 12/14/17/18, 100 000 Zeilen im echten Test) | Produktion: `work_mem` Standard 4 MB beim CTE-Puffer |
| Vergleich | 7 | nichts |
| Produktion | 6 | nichts |
| Design | 6 | nichts |

### Rollout postgres (indexes, planner-explain, join-algorithms, window-functions, ctes): nicht verifiziert

- planner-explain: `random_page_cost` ≈ 1.1 auf SSD steht nicht in der Doku (19 geprüft); als Praxiswert markiert.
- planner-explain: „JIT standardmässig an in 12 bis 18“: 11 (aus) und 19 (aus) geprüft, der Wechsel in 12 nicht separat geprüft.
- join-algorithms: Release Notes 19 sagen nur „when NULLs are not present“; dass der Planner das über NOT-NULL-Spalten beweist, ist meine Deutung.
- indexes: Deduplication „seit 13“, Hash-Index WAL „seit 10“, REINDEX CONCURRENTLY „seit 12“ in diesem Durchgang nicht neu geprüft (unverändert).
- Alle Beispiele: Docker (pg17) lief nicht; „Erwartetes Ergebnis“ bleibt, ctes.html behält die frühere echte Ausgabe (PostgreSQL 17.12).

## sysdesign/case-image-upload.html

| Winkel | vorher (Anzahl Fakten) | was ergänzt wurde |
|---|---|---|
| Warum? | 4 (Upload/Verarbeitung trennen, Malware-Risiko, Bandbreite, GPU-Latenz) | nichts |
| Wie innen? | 10+ (Intent, Quarantäne, Scan-Event, Claim, Outbox, invertierter Index, BM25, HNSW, RRF) | nichts |
| Zahlen | 10+ (12/60 Uploads/s, 1,1 PB, 12 Inferenzen, 7 Tage, 50 GB, k1/b, RRF 60) | Details: Defender-Durchsatz 50 GB/min pro Storage Account, Scan-Zeitfenster 30 min bis 3 h → „Scan timed out“ (Microsoft Learn geprüft) |
| Vergleich | 5 (Direkt vs Service vs synchron, PostgreSQL vs Suchcluster, Labels vs Embeddings) | nichts |
| Produktion | 6 | nichts |
| Design | 6 (Senior-Punkte) | nichts |

## postgres/acid-transactions.html

| Winkel | vorher (Anzahl Fakten) | was ergänzt wurde |
|---|---|---|
| Warum? | 3 (halbe Überweisung, Constraint-Verletzung, Crash) | nichts |
| Wie innen? | 10+ (WAL, fsync, pg_xact, virtuelle xid, Savepoint/Sub-xid, Checkpoint, full_page_writes) | nichts |
| Zahlen | 5 (3 × wal_writer_delay, 64 Sub-xids, 25P02, max_prepared_transactions 0) | Details: „ca. 600 ms“ als ausgerechnetes Verlustfenster (19-Doku geprüft) |
| Vergleich | 7 | nichts |
| Produktion | 6 | Diagnose: `log_lock_waits` seit 19 standardmässig an |
| Design | 6 (Senior-Punkte) | nichts |

## postgres/mvcc.html

| Winkel | vorher (Anzahl Fakten) | was ergänzt wurde |
|---|---|---|
| Warum? | 3 (Leser/Schreiber blockieren nicht, Rollback billig, Preis Bloat) | nichts |
| Wie innen? | 10+ (xmin/xmax, ctid, Snapshot, HOT, Hint Bits, VM, MultiXact) | Details: seit 19 setzen auch normale Table Scans all-visible in der VM (Release Notes 19) |
| Zahlen | 5 (32 Bit, 2 Mrd., 200 Mio., 100/40 Mio., 3 Mio.) | Details: Checksums seit 18 Standard bei initdb → SELECT erzeugt WAL beim Setzen von Hint Bits im Normalfall (Release Notes 18) |
| Vergleich | 6 | nichts |
| Produktion | 6 | nichts |
| Design | 6 (Senior-Punkte) | nichts |

## postgres/vacuum.html

| Winkel | vorher (Anzahl Fakten) | was ergänzt wurde |
|---|---|---|
| Warum? | 4 (tote Versionen, VM, Freezing, Statistik) | nichts |
| Wie innen? | 8+ (Phasen, TIDs, Index-Runden, FSM/VM, Truncate, Cutoff) | Details: Eager Freezing seit 18 (`vacuum_max_eager_freeze_failure_rate` 0.03); parallele Index-Bearbeitung und Score-Reihenfolge im Autovacuum seit 19 (`pg_stat_autovacuum_scores`) |
| Zahlen | 10+ | Details: `autovacuum_vacuum_max_threshold` 100 Mio. (seit 18); Insert-Schwelle × Anteil nicht gefrorener Seiten (19-Doku); `autovacuum_max_workers` ohne Neustart bis `autovacuum_worker_slots` (seit 18); `vacuum_truncate` global seit 18 |
| Vergleich | 8 | Vergleich: `REPACK` / `REPACK (CONCURRENTLY)` seit 19 (Lock-Ablauf und Bedingungen aus der 19-Doku) |
| Produktion | 7 | REPACK als Lösung ergänzt; Hinweis, dass der 100-Mio.-Deckel bei 500 Mio. Zeilen nicht hilft |
| Design | 6 (Senior-Punkte) | nichts |

## postgres/locking.html

| Winkel | vorher (Anzahl Fakten) | was ergänzt wurde |
|---|---|---|
| Warum? | 1 (Kern: Zugriffe ordnen) | Details: „Warum Locks trotz MVCC?“ (Schreiber gegen Schreiber, Lost Update, DDL während Query, ACCESS SHARE) |
| Wie innen? | 8+ (Lock Table, Row Lock im Tuple, transactionid, Lock Queue, Deadlock Detector) | Lock-Table-Grösse genauer: × (Verbindungen + prepared Transactions), zählt Objekte, Durchschnittswert (19-Doku) |
| Zahlen | 6 (8/4 Stufen, 1 s, 64/128, 40P01, 55P03) | nichts |
| Vergleich | 6 | nichts |
| Produktion | 7 | Diagnose: `log_lock_waits` seit 19 Standard an; `log_lock_failures` (seit 18); View `pg_stat_lock` (seit 19) |
| Design | 6 (Senior-Punkte) | nichts |

## Rollout-Writer (image-upload + 4 Postgres-Seiten): nicht verifiziert

- vacuum.html: „Insert-Schwelle × Anteil nicht gefrorener Seiten“ steht in der 19-Doku; seit welcher Version genau (vermutlich 18) habe ich nicht gefunden, darum ohne „seit“.
- vacuum.html: Insert-Schwelle „seit 13“, `REINDEX CONCURRENTLY` „seit 12“, Speicher-Änderung „PostgreSQL 17“, `log_autovacuum_min_duration` „seit 15: 10 min“ nicht neu geprüft (unverändert, nur 10 min als aktueller Standard bestätigt).
- locking.html: Flyway-Standard `flyway.postgresql.transactional.lock = true` und SQL-Server-Escalation „ca. 5000“ nicht geprüft (unverändert).
- case-image-upload.html: Gerüst, Muster und Selbsttest-Gruppen sind jetzt gebaut (vorher offen, siehe oben).
- Alle Beispiele: Docker (pg17) lief nicht; „Erwartetes Ergebnis“ bzw. die frühere echte Ausgabe bleiben.

## postgres/normalization.html

| Winkel | vorher (Anzahl Fakten) | was ergänzt wurde |
|---|---|---|
| Warum? | 4 (Einfüge-, Update-, Lösch-Anomalie, Preis Joins) | nichts |
| Wie innen? | 8+ (funktionale Abhängigkeit, 1NF–BCNF, MV, Generated Column) | Details: Generated Columns `VIRTUAL` seit 18 Standard (Release Notes 18, verlinkt); REFRESH CONCURRENTLY: UNIQUE-Index nur auf Spaltennamen, ohne WHERE (19-Doku) |
| Zahlen | 1 (FK legt keinen Index an) | Details: „Grössen, die zählen“: TOAST ab ca. 2 kB Zeile, max. 1 GB pro Wert, 0 Indexe durch FK (19-Doku TOAST) |
| Vergleich | 7 | nichts |
| Produktion | 6 | nichts |
| Design | 6 (Senior-Punkte) | nichts |

## postgres/constraints-keys.html

| Winkel | vorher (Anzahl Fakten) | was ergänzt wurde |
|---|---|---|
| Warum? | 3 (Regel für alle Schreiber, Race Condition, App + DB) | nichts |
| Wie innen? | 8+ (Unique B-Tree, GiST, RI-Trigger, FOR KEY SHARE, Deferred, Sequence) | nichts |
| Zahlen | 8+ (8/16 Byte, 2 147 483 647, CACHE 1, allocationSize 50, SQLSTATEs, 11/19/15 MB) | nichts |
| Vergleich | 7 | nichts |
| Produktion | 7 | nichts |
| Design | 7 (Senior-Punkte) | nichts; alle 18/19-Aussagen (uuidv7, WITHOUT OVERLAPS, NOT ENFORCED, NOT NULL in pg_constraint, 23001, conenforced, CHECK ENFORCED umschaltbar in 19) mit Release-Notes-Link |

## postgres/jsonb.html

| Winkel | vorher (Anzahl Fakten) | was ergänzt wurde |
|---|---|---|
| Warum? | 3 (einmal parsen, GIN nach Inhalt, json parst neu) | nichts |
| Wie innen? | 10+ (Header/Offsets, sortierte Keys, Opclasses, Posting List, Recheck, TOAST) | nichts |
| Zahlen | 6 (2 kB, 1 GB, 0,5 %, ein Drittel, 25 %, 66 667 vs 4 000) | nichts |
| Vergleich | 6 | nichts |
| Produktion | 7 | nichts |
| Design | 6 (Senior-Punkte) | Details: „Neu in 18“: jsonb-`null` → SQL-NULL beim Cast (Release Notes 18, verlinkt); 19-Neuerungen verlinkt |

## postgres/partitioning.html

| Winkel | vorher (Anzahl Fakten) | was ergänzt wurde |
|---|---|---|
| Warum? | 3 (DROP statt DELETE, kleinere Indizes, VACUUM pro Partition) | nichts |
| Wie innen? | 8+ (relkind p, Routing, Plan-/Laufzeit-Pruning, Row Movement, Lock-Stufen) | nichts |
| Zahlen | 4 (einige tausend Partitionen, Pruning an, partitionwise aus, Subplans Removed 2) | nichts |
| Vergleich | 7 | nichts |
| Produktion | 7 | Details: 19 `vacuumdb --analyze-only` analysiert Parents (verlinkt); 18 effizientere Planung bei vielen Partitionen (verlinkt) |
| Design | 6 (Senior-Punkte) | nichts |

## postgres/replication-ha.html

| Winkel | vorher (Anzahl Fakten) | was ergänzt wurde |
|---|---|---|
| Warum? | 3 (Ausfall, Leselast, kein Backup) | nichts |
| Wie innen? | 8+ (walsender, walreceiver, Startup, Slot, Timeline, pg_rewind) | Details: `WAIT FOR LSN`: Standard-Modus `standby_replay`, ohne TIMEOUT unbegrenzt, `NO_THROW` (19-Doku) |
| Zahlen | 5 (10 walsender, 30 s, 16 MB, -1, 46/175 MB) | Details: `idle_replication_slot_timeout` Standard 0 = aus, geprüft beim Checkpoint (19-Doku) |
| Vergleich | 6 | nichts |
| Produktion | 7 | Diagnose: 19 benennt `sync_error_count` → `sync_table_error_count` um (verlinkt); Sequenzen vor Upgrade-Umschaltung per `REFRESH SEQUENCES` |
| Design | 7 (Senior-Punkte) | Details: pg_rewind: Checksums seit 18 Standard bei initdb (verlinkt) |

## Rollout-Writer (normalization, constraints-keys, jsonb, partitioning, replication-ha): nicht verifiziert

- Alle fünf Seiten: Docker (pg17) lief nicht; neue Beispiele wurden nicht ausgeführt. Bestehende „Echte Ausgabe, PostgreSQL 17.12“ bzw. „Erwartetes Ergebnis“ unverändert.
- partitioning.html: „kein SPLIT/MERGE PARTITION in 19“ ist eine Negativ-Aussage. Es gibt dazu keinen Release-Notes-Eintrag; belegt nur dadurch, dass die ALTER-TABLE-Doku 19 die Befehle nicht kennt (verlinkt).
- constraints-keys.html: Indexgrössen 11/19/15 MB und jsonb.html Indexgrössen/Pläne stammen aus früheren echten Läufen auf 17.12; nicht neu ausgeführt.
- replication-ha.html: Vergleich Patroni / CloudNativePG / repmgr / Azure nicht neu geprüft (unverändert).

## postgres/connection-pooling.html

| Winkel | vorher (Anzahl Fakten) | was ergänzt wurde |
|---|---|---|
| Warum? | 3 (Prozess pro Verbindung, Fork/Auth/TLS, kleiner Pool schneller) | nichts |
| Wie innen? | 8+ (Hikari-Ausleihe, PgBouncer-Modi, Grenzen Transaction Mode, Prepared Statements) | Details: welche Werte PgBouncer pro Client wiederherstellt; `search_path` wird seit PostgreSQL 18 gemeldet und seit PgBouncer 1.26 standardmässig verfolgt, `app.tenant_id` nicht (Release Notes 18, PgBouncer-Changelog 1.26, verlinkt) |
| Zahlen | 10+ (100, 3, Hikari-Standards, 5, 200, 1.21/1.24, Azure 50/5000/0) | Diagnose: `log_connections = 'setup_durations'` (seit 18, drei Zeiten: gesamt, Fork, Authentifizierung; Release Notes 18 verlinkt) |
| Vergleich | 7 | nichts |
| Produktion | 7 | Produktion: Session-Wert-Leck präzisiert (search_path nur noch vor PG 18 / PgBouncer 1.26) |
| Design | 6 (Senior-Punkte) | nichts |

## postgres/backup-pitr.html

| Winkel | vorher (Anzahl Fakten) | was ergänzt wurde |
|---|---|---|
| Warum? | 3 (Replikation kopiert Fehler, Ransomware, RPO) | nichts |
| Wie innen? | 10+ (Basis-Backup, WAL-Archiv, recovery.signal, Timeline, Manifest, inkrementell) | nichts |
| Zahlen | 5 (16 MB, 49 MB, recovery_target_inclusive, pause, seit 17) | Details: `archive_timeout` (Archivierung nur volle Segmente, früh geschlossene Dateien bleiben 16 MB; 19-Doku) |
| Vergleich | 7 | nichts |
| Produktion | 7 | Diagnose: `pg_stat_recovery` (seit 19, verlinkt); Links für alle 18/19-Aussagen (standard_conforming_strings, `--statistics` mit Standard `--no-statistics`, erweiterte Statistiken, Checksums, `backup_type`, `pg_verifybackup` tar) |
| Design | 7 (Senior-Punkte) | nichts |

## postgres/performance-tuning.html

| Winkel | vorher (Anzahl Fakten) | was ergänzt wurde |
|---|---|---|
| Warum? | 3 (Abfragen vor Konfiguration, Gesamtzeit, N+1) | nichts |
| Wie innen? | 8+ (shared_buffers, OS-Cache, work_mem pro Knoten, Checkpoint, Full Page Writes) | Details: asynchrones I/O seit 18 (`io_method` Standard `worker`), I/O-Worker automatisch seit 19 (`io_min_workers` 2, `io_max_workers` 8, `io_workers` entfernt) – verlinkt |
| Zahlen | 10+ (128 MB, 25 %, 40 %, 4 GB, 4 MB, 2.0, 64 MB, 5 min, 1 GB, 0.9, 4.0) | Details: `effective_io_concurrency` 16 seit 18 (verlinkt) |
| Vergleich | 6 | Details: JIT seit 19 standardmässig aus (Release Notes 19 Migration, verlinkt) |
| Produktion | 7 | Diagnose: BUFFERS automatisch in EXPLAIN ANALYZE seit 18; `generic_plan_calls` / `custom_plan_calls` in pg_stat_statements seit 19 (beide verlinkt) |
| Design | 6 (Senior-Punkte) | nichts |

## postgres/full-text-search.html

| Winkel | vorher (Anzahl Fakten) | was ergänzt wurde |
|---|---|---|
| Warum? | 3 (kein B-Tree, keine Beugung, kein Ranking) | nichts |
| Wie innen? | 8+ (Parser, Dictionaries, tsvector, tsquery, GIN, Recheck) | nichts |
| Zahlen | 7 (1 MB, 16 383, 256, 2 kB, 124 Byte, Gewichte, 0.3) | nichts |
| Vergleich | 6 | nichts |
| Produktion | 7 | Produktion: paralleler GIN-Build seit 18 (verlinkt) |
| Design | 6 (Senior-Punkte) | Upgrade-Falle präzisiert: 18/19-Provider-Änderung betrifft ICU/builtin-Cluster; Stemmer-Änderung 19 (Deutsch, Englisch, Französisch …, Niederländisch neuer Algorithmus) – alle verlinkt |

## postgres/multi-tenancy.html

| Winkel | vorher (Anzahl Fakten) | was ergänzt wurde |
|---|---|---|
| Warum? | 3 (Isolation vs Kosten, fail closed, Noisy Neighbour) | nichts |
| Wie innen? | 8+ (Routing, search_path, RLS USING/WITH CHECK, set_config, FORCE, @TenantId) | Details: `search_path` hinter PgBouncer (PG 18 meldet, PgBouncer 1.26 verfolgt; verlinkt) |
| Zahlen | 1 (200 × 5 × 3 = 3000) | Details: DB-Namen max. 63 Byte (still gekürzt, 19-Doku „Lexical Structure“); CR/LF in DB-/Rollennamen seit 19 verboten (verlinkt); Azure `pgbouncer.default_pool_size` 50 pro User/DB-Paar → bis 10 000 Server-Verbindungen bei 200 Mandanten-DBs (Microsoft Learn) |
| Vergleich | 6 | nichts |
| Produktion | 7 | Produktion: PgBouncer setzt eigene Werte wie `app.tenant_id` nicht zurück |
| Design | 7 (Senior-Punkte) | nichts |

## Rollout-Writer (connection-pooling, backup-pitr, performance-tuning, full-text-search, multi-tenancy): nicht verifiziert

- connection-pooling.html: Flyway-Standard „transaktionaler Advisory Lock“ / `flyway.postgresql.transactional.lock`, HikariCP-Wiki-Formel und Pool-Deadlock-Formel, „PostgreSQL 14 hat Snapshots verbessert“, `reserved_connections` „seit 16“ nicht neu geprüft (unverändert).
- performance-tuning.html: „VACUUM-Speicher seit 17 ohne 1-GB-Limit“, Hibernate-Aussagen (IDENTITY schaltet Batching ab, `default_batch_fetch_size`) und Azure Query Store / Intelligent Performance nicht neu geprüft (unverändert).
- backup-pitr.html: Werkzeug-Vergleich (pgBackRest, Barman, WAL-G) nicht neu geprüft.
- multi-tenancy.html: Flyway-API und Hibernate-6-Multitenancy-Klassen nicht neu geprüft; „Azure PITR stellt immer den ganzen Server her“ nicht neu geprüft.
- Alle fünf Seiten: Docker (pg17) nicht genutzt; keine neuen Beispiele ausgeführt. Bestehende „Echte Ausgabe, PostgreSQL 17.12“ bzw. „Erwartetes Ergebnis“ unverändert.
