---
id: data-lakehouse-vs-warehouse
round: data
tech: [lakehouse, iceberg, dremio]
tier: 1
project: ElCom MATCH
q: Was ist der Unterschied zwischen Data Warehouse, Data Lake und Lakehouse?
en: What is the difference between a data warehouse, a data lake and a lakehouse?
---
## 30s
Ein Data Warehouse ist eine Datenbank für Analysen. Strukturierte Daten, SQL, Transaktionen.
Ein Data Lake ist billiger Speicher mit Dateien. Alles passt hinein, aber ohne Transaktionen.
Ein Lakehouse verbindet beides: Dateien im Object Storage, plus ein Table Format wie Iceberg.
Iceberg bringt Transaktionen, Schema und Snapshots auf die Dateien.
Bei MATCH habe ich ein Iceberg-Lakehouse gebaut, mit über 250 Millionen Zeilen.
Soll ich erklären, warum wir kein klassisches Warehouse genommen haben?

## 90s
**Data Warehouse** (z. B. Snowflake, Synapse, klassisch Oracle):
- Speicher und Rechenleistung oft vom Hersteller. Daten in seinem Format.
- Stark bei SQL und Performance. Teuer bei sehr viel Daten.

**Data Lake** (Parquet-Dateien in S3 oder Azure Blob):
- Billig und offen. Aber: kein ACID, keine sicheren Updates, oft ein „Datensumpf“.

**Lakehouse:**
- Offene Dateien (Parquet) + Table Format (Iceberg, Delta, Hudi) + Katalog.
- Mehrere Engines lesen dieselben Tabellen.

**Bei MATCH:**
- Speicher: MinIO (S3-kompatibel).
- Table Format: Iceberg. Katalog: Nessie.
- Schreiben: Spark. Lesen: Dremio, über Arrow Flight SQL in die Web-UI.
- Vorher war alles in SQL Server. Die Statistik lief Zeile für Zeile in .NET. Bei 250 Millionen Zeilen hat das nicht mehr skaliert. Analysen haben die operative Datenbank belastet.

## 3min
**Warum Lakehouse bei MATCH:**
- Analysen sollen die operative Datenbank nicht belasten.
- Historie neu verarbeiten muss billig sein.
- Iceberg ist herstellerneutral: Spark schreibt, Dremio liest.
- Alles läuft selbst gehostet auf AKS. Das passt zum Bundesumfeld.

**Wann ein Warehouse besser ist:**
- Kleine bis mittlere Datenmengen, viele Business-Nutzer mit SQL.
- Kein Team, das Spark, Katalog und Storage betreibt.
- Ein Managed-Warehouse ist dann schneller produktiv.

**Risiken beim Lakehouse:**
- Viele kleine Dateien machen Abfragen langsam. Bei MATCH: Batch-Claims, regelmässige Compaction mit `rewrite_data_files` und `expire_snapshots`.
- Der Katalog ist das wertvollste Teil. Nessie lief zuerst auf embedded RocksDB. Bei einem Pod-Reschedule konnte der Zustand verloren gehen. Wir haben Nessie auf ein Postgres-Backend umgestellt.
- Abfrage-Performance braucht eine Serving-Schicht. Bei MATCH hat Dremio den Spark Thrift Server ersetzt, mit Reflections als Cache.

**Was ich gelernt habe:** Ein Lakehouse ist nicht „nur Dateien“. Es braucht Betrieb wie eine Datenbank: Wartung, Backups vom Katalog, Monitoring.

## Follow-ups
- Warum Iceberg und nicht Delta Lake? → Iceberg ist herstellerneutral und wird von vielen Engines gelesen. Dazu Hidden Partitioning und Schema Evolution. Delta ist stark auf Spark und Databricks ausgerichtet.
- Was macht der Katalog? → Er speichert, welche Metadaten-Datei die aktuelle Version einer Tabelle ist. Der Commit ist ein atomarer Wechsel dieses Zeigers.
- Was ist ein Datensumpf? → Ein Data Lake ohne Schema, Besitzer und Qualität. Niemand weiss, was die Dateien bedeuten.
- Wie schnell sind Abfragen bei MATCH? → *(Prüfen: echte Antwortzeiten.)* Partition Pruning sorgt dafür, dass nur nötige Dateien gelesen werden.
- Brauchen Sie dann noch SQL Server? → Ja, für den operativen Teil: Meldungen, Status, die alte UI. Das Lakehouse ist für Analyse und Statistik.

## Don't say
- „Ein Lakehouse ist einfach ein Data Lake.“ Der Unterschied ist das Table Format mit Transaktionen.
- „Ein Warehouse ist veraltet.“ Für viele Firmen ist es die richtige Wahl.

## Words
- **das Table Format** = Regeln und Metadaten, die Dateien zu einer Tabelle machen
- **der Katalog** = Verzeichnis aller Tabellen und ihrer aktuellen Version
- **herstellerneutral** = vendor-neutral
- **operative Datenbank** = Datenbank für den laufenden Betrieb (OLTP)
- **die Serving-Schicht** = Teil, der Abfragen für Nutzer beantwortet
