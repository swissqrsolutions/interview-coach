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
| Zahlen | 6 (200, 5000, 35/325 Bytes, 240 MB, 8000 Bytes, Messwerte) | Diagnose: echte Flag-Werte aus `-XX:+PrintFlagsFinal` (OpenJDK 17.0.3): Tier3/Tier4 Invocation- und BackEdge-Schwellen, MaxInlineSize, FreqInlineSize, ReservedCodeCacheSize, DontCompileHugeMethods; `HugeMethodLimit` 8000 als develop-Flag (Quellcode); `Tier3LoadFeedback = 5` (Schwellen verdoppeln sich bei voller C1-Queue) |
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
