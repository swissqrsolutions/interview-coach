---
id: data-spark-internals
round: data
tech: [spark]
tier: 1
project: ElCom MATCH
q: Wie führt Spark einen Job aus? Erklären Sie Lazy Evaluation, DAG, Stages und Shuffle.
en: How does Spark execute a job? Explain lazy evaluation, DAG, stages and shuffle.
---
## 30s
Spark ist lazy. Transformationen wie `filter` oder `join` bauen nur einen Plan.
Erst eine Action wie `write` oder `count` startet die Arbeit.
Der Plan ist ein DAG, ein Graph ohne Kreise.
Spark teilt den DAG in Stages. Eine neue Stage beginnt bei jedem Shuffle.
Ein Shuffle verschiebt Daten zwischen Executors über das Netzwerk. Das ist der teure Teil.
Bei MATCH laufen unsere PySpark-Jobs so auf Kubernetes, mit über 250 Millionen Zeilen.
Soll ich narrow und wide Transformationen erklären?

## 90s
**Die Begriffe:**
- **Driver:** plant und koordiniert.
- **Executor:** rechnet. Jeder hat Cores und Speicher.
- **Job:** entsteht pro Action.
- **Stage:** Teil eines Jobs ohne Shuffle.
- **Task:** eine Stage auf einer Partition. Ein Task pro Partition und Core.

**Narrow vs. wide:**
- **Narrow:** Jede Ausgabe-Partition braucht nur eine Eingabe-Partition. `filter`, `select`, `withColumn`. Kein Shuffle.
- **Wide:** Daten mit gleichem Key müssen zusammen. `groupBy`, `join`, `distinct`, `orderBy`. Shuffle.

**Beispiel:**
```
df = spark.read.table("silver.trades")          # nichts passiert
df = df.filter(df.trade_date == "2026-11-01")   # nichts passiert (narrow)
agg = df.groupBy("product").sum("volume")       # nichts passiert (wide → Shuffle)
agg.write.mode("overwrite").saveAsTable("gold.daily")   # Action: jetzt läuft alles
```
Laut gesagt: „Stage 1 liest und filtert. Dann kommt der Shuffle für groupBy. Stage 2 summiert und schreibt.“

## 3min
**Warum lazy?** Spark sieht den ganzen Plan und optimiert. Der Catalyst-Optimizer schiebt Filter nach vorne (Predicate Pushdown) und liest nur nötige Spalten (Column Pruning). Mit Iceberg kommt Partition Pruning dazu: Spark liest nur die Dateien vom 1. November.

**Den Plan ansehen:** `df.explain("formatted")`. `Exchange` im Plan bedeutet Shuffle. Im Spark UI sehe ich Stages, Tasks, Shuffle-Grösse und langsame Tasks.

**Was beim Shuffle passiert:** Die Tasks schreiben Shuffle-Dateien auf die lokale Disk. Die nächste Stage liest sie über das Netzwerk. Darum: Disk, Netzwerk und Serialisierung kosten Zeit.

**Partitionen:**
- Nach einem Shuffle: `spark.sql.shuffle.partitions`, Standard 200.
- Mit AQE (Standard seit Spark 3.2) fasst Spark kleine Shuffle-Partitionen automatisch zusammen.

**Typische Fehler:**
- Eine Action zweimal aufrufen, zum Beispiel `count()` und dann `write()`. Spark rechnet alles zweimal. Lösung: `cache()` oder nur eine Action.
- `collect()` auf grossen Daten. Alles geht zum Driver. Driver OOM.
- Python-UDFs: Daten müssen zwischen JVM und Python wandern. Eingebaute Funktionen sind schneller.

**Bei MATCH:** *(Prüfen: ein echtes Beispiel, wo Sie im Spark UI einen Shuffle oder eine langsame Stage gefunden haben.)*

## Follow-ups
- Was ist der Unterschied zwischen Transformation und Action? → Eine Transformation baut den Plan, zum Beispiel `filter`. Eine Action startet die Ausführung, zum Beispiel `count` oder `write`.
- Was macht `cache()`? → Spark hält das Ergebnis im Speicher, nach der ersten Action. Gut, wenn ich es mehrmals brauche.
- Woran erkennen Sie einen Shuffle im Plan? → An `Exchange` in `explain()`. Im Spark UI an der Grenze zwischen zwei Stages.
- Wie viele Tasks laufen parallel? → So viele wie Cores über alle Executors. 10 Executors mal 4 Cores = 40 Tasks gleichzeitig.
- Was ist der Unterschied zwischen RDD und DataFrame? → Ein DataFrame hat ein Schema. Darum kann Catalyst optimieren. RDDs nutze ich heute fast nie.

## Don't say
- „`filter` liest die Daten sofort.“ Erst die Action startet die Arbeit.
- „Mehr Partitionen sind immer schneller.“ Zu viele kleine Tasks kosten auch Zeit.

## Words
- **lazy** = erst rechnen, wenn nötig
- **der DAG** = gerichteter Graph ohne Kreise
- **der Shuffle** = Daten nach Key über das Netzwerk umverteilen
- **narrow / wide** = ohne / mit Shuffle
- **Predicate Pushdown** = Filter so früh wie möglich anwenden
