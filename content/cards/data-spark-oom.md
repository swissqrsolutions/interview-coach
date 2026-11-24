---
id: data-spark-oom
round: data
tech: [spark, k8s]
tier: 2
project: ElCom MATCH
q: Ihr Spark-Job stirbt mit OutOfMemory. Was tun Sie?
en: Your Spark job dies with OutOfMemory. What do you do?
---
## 30s
Zuerst frage ich: Stirbt der Driver oder ein Executor?
Driver-OOM kommt oft von `collect()` oder einem zu grossen Broadcast.
Executor-OOM kommt oft von zu grossen Partitionen oder von Data Skew.
Auf Kubernetes gibt es noch einen dritten Fall: Der Pod wird OOMKilled, weil der Speicher ausserhalb des Heaps zu klein ist.
Bei MATCH laufen die Spark-Jobs auf AKS. Dort schaue ich in die Pod-Events und ins Spark UI.
Soll ich die Speicher-Bereiche eines Executors erklären?

## 90s
**Diagnose in drei Schritten:**
1. **Wo?** Driver-Log oder Executor-Log? `java.lang.OutOfMemoryError` oder Kubernetes-Status `OOMKilled` (Exit-Code 137)?
2. **Welche Stage?** Im Spark UI: Welche Stage ist gescheitert? Ist ein Task viel grösser als die anderen?
3. **Was macht der Code dort?** Join, groupBy, collect, Python-UDF?

**Lösungen nach Ursache:**
| Ursache | Lösung |
|---|---|
| `collect()` / `toPandas()` auf grossen Daten | nicht zum Driver holen, direkt schreiben |
| Broadcast zu gross | Broadcast entfernen oder Schwelle senken |
| Partition zu gross | mehr Partitionen, `repartition` |
| Skew | AQE Skew Join, Salting |
| Pod OOMKilled | `spark.executor.memoryOverhead` erhöhen |
| Python-UDF / Pandas | eingebaute Funktionen, weniger Daten pro Batch |

**Konfiguration auf Kubernetes:**
```
spark.executor.memory=4g
spark.executor.memoryOverhead=1g     # Off-Heap, Python-Prozesse, Netzwerk
spark.sql.shuffle.partitions=400
```
„Das Pod-Limit ist Heap plus Overhead. Python-Worker leben im Overhead, nicht im Heap.“

## 3min
**Speicher eines Executors:**
- **Heap:** davon ein vereinter Bereich für Execution (Joins, Sorts, Shuffles) und Storage (Cache). `spark.memory.fraction`, Standard 0.6.
- **Overhead:** ausserhalb der JVM. Bei PySpark wichtig, weil die Python-Prozesse hier laufen.
- Spark kann bei Execution auf Disk auslagern (Spill). Darum ist OOM oft ein Zeichen für einen einzelnen sehr grossen Datensatz oder eine sehr grosse Partition.

**Nicht einfach Speicher verdoppeln:** Das kostet Geld und versteckt das Problem. Bei Skew kommt der Fehler mit mehr Daten zurück.

**Eingabe-Seite:** Sehr grosse einzelne Dateien oder ein riesiges XML pro Record können auch OOM machen. Dann hilft ein Streaming-Parser oder ein Split der Datei.

**Monitoring:** Bei MATCH beobachten Grafana und Prometheus Pod-Restarts und Job-Dauer. Ein OOMKilled-Pod zeigt sich dort als Restart.

**Ein verwandter echter Fall bei MATCH:** In der CI wurde der SQL-Server-Test-Container OOMKilled, weil Test-Collections parallel liefen. Lösung: Container auf 2 GB begrenzen, Speicher auf dem Build-Server vorher freimachen, beim Start schnell scheitern, schwere Collections seriell laufen lassen. Lektion: Speicher-Limits bewusst setzen und messen.

## Follow-ups
- Was ist der Unterschied zwischen OOM-Error und OOMKilled? → OutOfMemoryError kommt aus der JVM, der Heap ist voll. OOMKilled kommt vom Kernel, der ganze Container hat sein Limit überschritten.
- Warum ist `toPandas()` gefährlich? → Alle Daten gehen in den Speicher des Drivers. Bei Millionen Zeilen ist das zu viel.
- Hilft `persist(MEMORY_AND_DISK)`? → Ja, statt nur Memory. Wenn der Platz fehlt, geht es auf Disk statt OOM.
- Wie viele Cores pro Executor? → Oft 4–5. Mehr Cores teilen sich denselben Speicher. Mehr Cores = weniger Speicher pro Task.
- Wie testen Sie mit echten Datenmengen? → Mit einer Kopie einer grossen Partition, zum Beispiel dem grössten Tag. Nicht nur mit kleinen Testdaten.

## Don't say
- „Ich erhöhe den Speicher, bis es läuft.“
- Nicht vergessen, dass bei PySpark der Python-Prozess ausserhalb des JVM-Heaps lebt.

## Words
- **OOM (Out of Memory)** = Speicher voll
- **OOMKilled** = Kubernetes beendet den Container wegen Speicher
- **der Overhead** = Speicher ausserhalb des Heaps
- **auslagern** = auf Disk schreiben (spill)
- **die Schwelle** = threshold
