---
id: data-spark-performance
round: data
tech: [spark]
tier: 1
project: ElCom MATCH
q: Ein Spark-Job ist langsam. Wie gehen Sie vor?
en: A Spark job is slow. How do you approach it?
---
## 30s
Zuerst schaue ich ins Spark UI. Welche Stage dauert lange? Gibt es einzelne langsame Tasks?
Die häufigsten Ursachen sind: zu viel lesen, grosse Shuffles, Data Skew und falsche Partitionen.
Gegen zu viel lesen hilft Partition Pruning. Bei MATCH partitionieren wir Iceberg nach Tag und Meldungstyp.
Gegen Skew helfen AQE, Salting oder ein Broadcast Join.
Ich ändere immer nur eine Sache und messe dann.
Soll ich Skew und Salting genauer erklären?

## 90s
**Meine Checkliste:**
1. **Liest der Job zu viel?** Filter auf die Partitionsspalte? `explain()` zeigt, ob Filter gepusht werden.
2. **Gibt es Skew?** Im Spark UI: Median-Task 10 Sekunden, Max-Task 20 Minuten. Dann hat ein Key viel mehr Daten.
3. **Join-Strategie:** Ist eine Seite klein? Dann Broadcast Join, kein Shuffle der grossen Seite.
4. **Partitionen:** zu wenige = grosse Tasks, Spill auf Disk. Zu viele = viel Overhead. Ziel: etwa 100–200 MB pro Partition.
5. **Python-UDFs:** durch eingebaute Funktionen ersetzen.

**Broadcast Join:**
```
from pyspark.sql.functions import broadcast
trades.join(broadcast(products), "product_id")
```
„Die kleine Tabelle wird an jeden Executor geschickt. Die grosse Tabelle wird nicht geshuffelt.“ Automatisch unter `spark.sql.autoBroadcastJoinThreshold`, Standard 10 MB.

**Salting gegen Skew:**
```
from pyspark.sql import functions as F
big = big.withColumn("salt", (F.rand() * 10).cast("int"))
small = small.crossJoin(spark.range(10).withColumnRenamed("id", "salt"))
big.join(small, ["key", "salt"])
```
„Ein heisser Key wird auf 10 Partitionen verteilt. Die kleine Seite wird 10-mal kopiert.“

## 3min
**AQE (Adaptive Query Execution), Standard seit Spark 3.2:**
- Fasst kleine Shuffle-Partitionen zusammen.
- Wechselt zur Laufzeit auf Broadcast Join, wenn eine Seite klein ist.
- Teilt schiefe Partitionen bei Joins (`spark.sql.adaptive.skewJoin.enabled`).
Zuerst prüfe ich, ob AQE an ist. Oft löst das schon viel.

**repartition vs. coalesce:**
- `repartition(n)`: voller Shuffle. Kann mehr oder weniger Partitionen machen. Verteilt gleichmässig. Auch nach Spalte: `repartition("day")`.
- `coalesce(n)`: nur weniger Partitionen, ohne vollen Shuffle. Billig, aber kann ungleich werden. Gut vor dem Schreiben, um weniger Dateien zu bekommen.

**Kleine Dateien:** Viele kleine Dateien machen das Lesen langsam. Bei MATCH: Batch-Claims statt einzelner Meldungen, regelmässige Compaction mit `rewrite_data_files`.

**Ressourcen:** Bei MATCH skaliert Karpenter die Nodes für Spark-Spitzen hoch und wieder runter. Mehr Executors helfen aber nicht gegen Skew: Ein einzelner langsamer Task bleibt langsam.

**Wann ich aufhöre zu tunen:** Wenn der Job in sein Zeitfenster passt. Tuning kostet auch Zeit.

**Bei MATCH:** *(Prüfen: ein konkretes Beispiel mit vorher/nachher Laufzeit, falls Sie eines haben.)*

## Follow-ups
- Wie erkennen Sie Skew im Spark UI? → In der Stage-Ansicht: Max-Dauer und Max-Shuffle-Read viel grösser als der Median.
- Wann kein Broadcast Join? → Wenn die kleine Seite nicht in den Speicher jedes Executors passt. Dann gibt es OOM.
- Was ist Spill? → Eine Partition passt nicht in den Speicher. Spark schreibt auf Disk. Das ist langsam. Lösung: mehr Partitionen oder mehr Speicher.
- Hilft `cache()` immer? → Nein. Nur wenn ich das Ergebnis mehrmals nutze. Sonst kostet es nur Speicher.
- Wie verhindern Sie Skew schon im Design? → Gute Keys wählen. Und null-Keys vor dem Join filtern: Viele nulls landen sonst in einer Partition.

## Don't say
- „Ich gebe einfach mehr Executors.“ Gegen Skew hilft das nicht.
- „coalesce und repartition sind das Gleiche.“

## Words
- **der Data Skew** = ungleiche Verteilung, ein Key hat viel mehr Daten
- **das Salting** = Zufallszahl an den Key hängen, um ihn zu verteilen
- **der Broadcast Join** = kleine Tabelle an alle Executors schicken
- **der Spill** = Auslagern auf Disk
- **AQE** = Spark optimiert den Plan während der Laufzeit
