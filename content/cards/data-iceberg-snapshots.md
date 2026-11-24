---
id: data-iceberg-snapshots
round: data
tech: [iceberg]
tier: 2
project: ElCom MATCH
q: Wie funktioniert Iceberg intern? Was sind Snapshots, Manifeste und Time Travel?
en: How does Iceberg work inside? What are snapshots, manifests and time travel?
---
## 30s
Iceberg ist ein Table Format. Es macht aus Parquet-Dateien eine Tabelle mit Transaktionen.
Jeder Commit erzeugt einen neuen Snapshot. Ein Snapshot ist eine Liste aller Dateien zu diesem Zeitpunkt.
Der Katalog zeigt auf die aktuelle Metadaten-Datei. Ein Commit ändert diesen Zeiger atomar.
Mit Time Travel kann ich eine alte Version lesen.
Bei MATCH nutzen wir Iceberg mit Nessie als Katalog, auf MinIO, mit über 250 Millionen Zeilen.
Soll ich die Metadaten-Ebenen zeichnen?

## 90s
**Die Ebenen (von oben nach unten):**
1. **Katalog** (bei uns Nessie): Tabelle → aktuelle `metadata.json`.
2. **metadata.json:** Schema, Partition Spec, Liste der Snapshots, aktueller Snapshot.
3. **Manifest List:** pro Snapshot eine Liste der Manifest-Dateien, mit Partition-Bereichen.
4. **Manifest:** Liste von Data Files, mit Statistik pro Datei (Min/Max pro Spalte, Anzahl Zeilen).
5. **Data Files:** Parquet. Dazu bei Merge-on-Read die Delete Files.

**Warum das schnell ist:** Eine Abfrage mit `WHERE day = '2026-11-01'` liest zuerst die Metadaten. Iceberg überspringt Manifeste und Dateien, deren Min/Max nicht passt. Kein Verzeichnis-Listing wie bei Hive.

**Time Travel (Spark SQL):**
```
SELECT count(*) FROM silver.trades TIMESTAMP AS OF '2026-11-20 08:00:00';
SELECT count(*) FROM silver.trades VERSION AS OF 4930201811223344;
SELECT snapshot_id, committed_at, operation FROM silver.trades.snapshots;
```
Laut gesagt: „Ich zähle die Zeilen, wie sie am 20. November um 8 Uhr waren. Die dritte Abfrage zeigt alle Snapshots.“

## 3min
**Optimistic Concurrency:** Zwei Writer schreiben gleichzeitig. Beide schreiben ihre Dateien. Beim Commit prüft der Katalog: Ist die Basis-Version noch aktuell? Wenn nicht, versucht der zweite Writer neu auf der neuen Basis. Bei Konflikten auf denselben Daten scheitert er.

**Darum der Katalog so wichtig ist:** Er ist der einzige Ort mit dem Zeiger auf die aktuelle Version. Bei MATCH lief Nessie zuerst auf embedded RocksDB. Bei einem Pod-Reschedule konnte der Zustand verloren gehen. Wir sind auf ein Postgres-Backend umgezogen. Lektion: Der Katalog ist der wertvollste Teil eines Lakehouse.

**Snapshots aufräumen:** Jeder Commit lässt alte Dateien liegen, für Time Travel. Ohne Wartung wächst der Speicher. Darum `expire_snapshots` regelmässig, bei MATCH auch:
```
CALL nessie.system.expire_snapshots(table => 'silver.trades', older_than => TIMESTAMP '2026-11-01 00:00:00');
```
*(Prüfen: Katalog-Name und Aufbewahrungszeit bei MATCH.)*

**Nutzen von Time Travel:**
- Fehlersuche: „Wie sah die Tabelle vor dem kaputten Job aus?“
- Rollback: `CALL ... system.rollback_to_snapshot(...)`.
- Reproduzierbare Berichte: ein Bericht nennt seinen Snapshot.

**Nessie extra:** Branches und Tags über mehrere Tabellen, ähnlich wie Git. Man kann auf einem Branch schreiben und dann mergen.

## Follow-ups
- Was passiert, wenn ein Job mitten im Schreiben abstürzt? → Ohne Commit sieht niemand die neuen Dateien. Die Tabelle bleibt auf dem alten Snapshot. Verwaiste Dateien räumt `remove_orphan_files` auf.
- Wie lange kann man zurückreisen? → Bis zum ältesten nicht abgelaufenen Snapshot. Nach `expire_snapshots` geht das nicht mehr.
- Was ist der Unterschied zu Hive-Tabellen? → Hive kennt nur Verzeichnisse. Kein atomarer Commit über mehrere Dateien, und Listing ist langsam.
- Warum Nessie und nicht Hive Metastore? → Nessie läuft gut auf Kubernetes und hat Git-ähnliche Branches. *(Prüfen: weitere echte Gründe aus dem Projekt.)*
- Was steht in einem Manifest? → Pfad jeder Datei, Partition, Anzahl Zeilen und Min/Max-Werte pro Spalte.

## Don't say
- „Iceberg ist ein Dateiformat wie Parquet.“ Iceberg ist ein Table Format über Parquet.
- „Time Travel geht unbegrenzt.“ Nur bis zum Ablauf der Snapshots.

## Words
- **der Snapshot** = Zustand der Tabelle nach einem Commit
- **das Manifest** = Liste von Datendateien mit Statistik
- **der Zeiger** = pointer
- **Time Travel** = eine alte Version lesen
- **ablaufen lassen (expire)** = alte Snapshots löschen
