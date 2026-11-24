---
id: data-iceberg-mor-cow-compaction
round: data
tech: [iceberg, spark]
tier: 2
project: ElCom MATCH
q: Merge-on-Read oder Copy-on-Write? Und warum braucht man Compaction?
en: Merge-on-read or copy-on-write? And why do you need compaction?
---
## 30s
Bei Updates und Deletes gibt es in Iceberg zwei Wege.
Copy-on-Write schreibt jede betroffene Datei neu. Schreiben ist teuer, Lesen ist schnell.
Merge-on-Read schreibt nur kleine Delete Files. Schreiben ist schnell, Lesen muss mischen.
Bei MATCH nutzen wir Merge-on-Read: DELETE für eine message_id, dann APPEND, in einer Transaktion.
Darum brauchen wir Compaction. Sie fasst kleine Dateien und Delete Files regelmässig zusammen.
Soll ich zeigen, wie man das einstellt?

## 90s
**Copy-on-Write (CoW):**
- Eine Zeile ändert sich → die ganze Parquet-Datei (zum Beispiel 256 MB) wird neu geschrieben.
- Gut bei: wenigen, grossen Updates und vielen Lesern.

**Merge-on-Read (MoR):**
- Iceberg schreibt Delete Files: Position Deletes (Datei + Zeilennummer) oder Equality Deletes (Spaltenwert).
- Beim Lesen mischt die Engine Daten und Deletes.
- Gut bei: häufigen, kleinen Änderungen, wie unser Ersetzen pro Meldung.

**Einstellen pro Tabelle (Format v2):**
```
ALTER TABLE silver.contracts SET TBLPROPERTIES (
  'write.delete.mode' = 'merge-on-read',
  'write.update.mode' = 'merge-on-read',
  'write.merge.mode'  = 'merge-on-read'
);
```

**Compaction:**
```
CALL nessie.system.rewrite_data_files(table => 'silver.contracts');
CALL nessie.system.rewrite_position_delete_files(table => 'silver.contracts');
CALL nessie.system.expire_snapshots(table => 'silver.contracts', older_than => TIMESTAMP '...');
```
Laut gesagt: „Zuerst fasse ich kleine Dateien zusammen und wende Deletes an. Dann räume ich alte Snapshots weg.“ *(Prüfen: genaue Befehle und Zeitplan bei MATCH.)*

## 3min
**Warum kleine Dateien ein Problem sind:**
- Jede Datei kostet einen Request zu MinIO/S3 und Metadaten.
- 10 000 Dateien à 1 MB lesen ist viel langsamer als 40 Dateien à 256 MB.
- Ursachen: viele kleine Batches, zu viele Partitionen, viele Deletes.

**Was wir bei MATCH dagegen tun:**
- Batch-Claims: Ein Job nimmt mehrere Meldungen auf einmal, statt einzeln zu schreiben.
- Regelmässig `rewrite_data_files`.
- `expire_snapshots`, damit alte Dateien gelöscht werden können.

**Trade-off-Tabelle:**
| | CoW | MoR |
|---|---|---|
| Schreiben | langsam | schnell |
| Lesen | schnell | langsamer, bis Compaction |
| Wartung | wenig | Compaction nötig |

**Wann CoW:** Tabellen, die selten geändert und sehr oft gelesen werden. Zum Beispiel Gold-Tabellen, die einmal pro Tag überschrieben werden. *(Prüfen: welchen Modus Ihre Gold-Tabellen haben.)*

**Compaction-Konflikte:** Compaction ist auch ein Commit. Läuft gleichzeitig ein Writer auf denselben Dateien, kann einer scheitern. Darum Compaction in ruhigen Zeiten oder mit `partial-progress.enabled`, damit nicht alles neu laufen muss.

**Wie merke ich, dass Compaction fehlt?** Abfragen werden langsamer. Die Metadaten-Tabelle `files` zeigt viele kleine Dateien:
```
SELECT count(*), avg(file_size_in_bytes) FROM silver.contracts.files;
```

## Follow-ups
- Was ist der Unterschied zwischen Position Delete und Equality Delete? → Position Delete sagt: Datei X, Zeile 17. Equality Delete sagt: alle Zeilen mit id = 5. Equality Deletes sind beim Lesen teurer.
- Warum nicht immer CoW? → Bei vielen kleinen Änderungen würde jede Änderung grosse Dateien neu schreiben. Das ist langsam und teuer.
- Wie oft machen Sie Compaction? → *(Prüfen: Zeitplan bei MATCH.)* Allgemein: so oft, dass Lesen schnell bleibt, zum Beispiel täglich.
- Welche Dateigrösse ist gut? → Iceberg hat als Ziel standardmässig 512 MB (`write.target-file-size-bytes`). Oft sind 128–512 MB gut.
- Kann Dremio Merge-on-Read lesen? → *(Prüfen: Ihre Erfahrung mit Dremio und Delete Files.)*

## Don't say
- „Merge-on-Read ist immer besser, weil Schreiben schneller ist.“ Ohne Compaction wird Lesen langsam.
- Nicht Compaction und `expire_snapshots` verwechseln. Das eine fasst Dateien zusammen, das andere löscht alte Versionen.

## Words
- **die Compaction** = kleine Dateien zu grossen zusammenfassen
- **das Delete File** = Datei, die gelöschte Zeilen markiert
- **neu schreiben** = rewrite
- **die Wartung** = maintenance
- **in ruhigen Zeiten** = wenn wenig Last ist
