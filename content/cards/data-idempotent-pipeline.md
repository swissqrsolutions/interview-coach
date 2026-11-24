---
id: data-idempotent-pipeline
round: data
tech: [lakehouse, spark, iceberg, mssql]
tier: 1
project: ElCom MATCH
q: Was passiert, wenn Ihr Job zweimal läuft? Wie machen Sie eine Pipeline idempotent?
en: What happens if your job runs twice? How do you make a pipeline idempotent?
---
## 30s
Idempotent heisst: Zweimal laufen gibt dasselbe Ergebnis wie einmal.
Das ist wichtig, weil Jobs abstürzen und neu starten.
Mein wichtigstes Prinzip: Ergebnis ersetzen statt addieren.
Bei MATCH rechnet der Statistik-Job einen ganzen Tag neu und überschreibt ihn.
Beispiel: Montag hat 10 Records, 3 kommen dazu. Richtig sind 13. Addieren beim Retry gibt 16. Neu rechnen gibt immer 13.
Dazu kommt ein atomarer Claim, damit zwei Jobs nie dieselbe Meldung nehmen.
Soll ich die drei Bausteine erklären?

## 90s
**Drei Bausteine bei MATCH:**

**1. Atomarer Claim in SQL Server:**
```
UPDATE TOP (50) messages
SET LakehouseStatus = 'Processing', claimed_at = SYSUTCDATETIME()
OUTPUT INSERTED.*
WHERE LakehouseStatus = 'Pending';
```
Laut gesagt: „Ich setze Pending auf Processing und bekomme die Zeilen zurück. Das ist ein Schritt. Zwei Jobs können nicht dieselbe Zeile nehmen.“ *(Prüfen: Batch-Grösse und Spaltennamen im echten Code.)*

**2. Ersetzen pro Meldung in Iceberg:**
```
DELETE FROM silver.contracts WHERE message_id = :id;
INSERT INTO silver.contracts SELECT ... ;   -- in einer Iceberg-Transaktion
```
„Läuft die Meldung nochmal, ersetze ich ihre Zeilen. Es gibt keine Duplikate.“

**3. Ersetzen pro Tag in Gold:** Den Tag ganz neu rechnen und überschreiben. Zum Beispiel mit Spark `overwritePartitions()` oder `INSERT OVERWRITE` für die Tages-Partition.

**Dazu: Stale-Job-Recovery.** Hängt eine Meldung zu lange in Processing, setzt ein Timeout sie zurück auf Pending.

## 3min
**Allgemeine Muster:**
- **Overwrite einer Partition:** einfach und sicher, wenn die Partition klein genug ist.
- **MERGE mit fachlichem Schlüssel:** Upsert. Gut für Dimensionen und Änderungen.
- **Deduplizieren mit Event-ID:** bei Streams und Queues.
- **Nicht idempotent:** `INSERT` von Deltas oder `count = count + n`. Das vermeide ich.

**Crash-sicher heisst auch:** Ein Job stirbt mitten im Schreiben. Iceberg schreibt Dateien zuerst und macht dann einen atomaren Commit im Katalog. Ohne Commit sieht niemand die halben Daten. Übrig bleiben nur verwaiste Dateien. Die räumt `remove_orphan_files` auf.

**Reihenfolge der Status:** Jede Meldung hat zwei Pending-Status, einen für Ingestion, einen für Statistik. Die Statistik startet erst nach Ingestion = Completed. So rechnet Gold nie auf halben Daten.

**Alter Ablauf als Gegenbeispiel:** Ein .NET-Timer-Job mit einem einzigen „Bookmark“-Datum. Ein Datum für alles sagt nicht, welche einzelne Meldung fertig ist. *(Prüfen: welches Problem der Bookmark im Alltag genau hatte.)*

**Wie merke ich Probleme?** Grafana zeigt Job-Dauer und den Backlog von Pending-Meldungen. Steigt der Backlog, stimmt etwas nicht. Der Parity-Job findet falsche Zahlen.

**Was ich gelernt habe:** Idempotenz muss man von Anfang an planen. Nachträglich ist sie sehr teuer.

## Follow-ups
- Warum nicht einfach „exactly once“ vom Framework? → Das gilt meist nur innerhalb des Systems. Über Grenzen hinweg, zum Beispiel SQL Server und Iceberg, brauche ich eigene Idempotenz.
- Was passiert, wenn der Job nach dem Iceberg-Commit, aber vor dem Status-Update stirbt? → Die Meldung bleibt in Processing. Die Stale-Job-Recovery setzt sie auf Pending. Der Retry ersetzt die Daten. Kein Duplikat.
- Warum ist Ersetzen teurer als Addieren? → Ich lese mehr Daten. Aber ein Tag ist klein genug. Korrektheit ist wichtiger.
- Wie testen Sie Idempotenz? → Den Job zweimal mit derselben Eingabe laufen lassen und die Ergebnisse vergleichen. Das gehört in die Tests.
- Wie verhindern Sie überlappende Läufe? → Mit dem atomaren SQL-Claim. Jeder Lauf hat nur seine Meldungen.

## Don't say
- „Bei uns läuft der Job nie zweimal.“ Jeder Job läuft irgendwann zweimal.
- „Wir prüfen vorher, ob die Daten schon da sind.“ Ohne Atomarität ist das eine Race Condition.

## Words
- **idempotent** = mehrmals ausführen, gleiches Ergebnis
- **der Claim** = eine Aufgabe für sich reservieren
- **crash-sicher** = nach einem Absturz kein kaputter Zustand
- **verwaiste Dateien** = orphan files
- **das Upsert** = einfügen oder aktualisieren
