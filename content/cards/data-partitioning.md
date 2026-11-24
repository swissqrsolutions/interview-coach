---
id: data-partitioning
round: data
tech: [iceberg, spark]
tier: 1
project: ElCom MATCH
q: Wie partitionieren Sie eine grosse Tabelle? Was ist Hidden Partitioning?
en: How do you partition a large table? What is hidden partitioning?
---
## 30s
Partitionieren heisst: Die Daten werden nach einer Spalte in Gruppen gespeichert.
Eine Abfrage mit Filter liest dann nur die passenden Gruppen. Das ist Partition Pruning.
Ich wähle die Spalte, nach der fast alle Abfragen filtern. Meist ist das ein Datum.
Bei MATCH partitionieren wir nach `days(received_date)` und `schema_type`.
Die Abfragen filtern fast immer nach Zeit und Meldungstyp. So lesen sie bei 250 Millionen Zeilen nur einen kleinen Teil.
Soll ich Hidden Partitioning erklären?

## 90s
**Hidden Partitioning in Iceberg:**
```
CREATE TABLE silver.trades (
  message_id string, schema_type string, received_date timestamp, ...
) USING iceberg
PARTITIONED BY (days(received_date), schema_type);
```
- Iceberg rechnet den Tag aus dem Timestamp selbst aus.
- Der Nutzer filtert einfach auf `received_date`. Er muss keine extra Spalte `day` kennen.

```
SELECT count(*) FROM silver.trades
WHERE received_date >= TIMESTAMP '2026-11-01 00:00:00'
  AND received_date <  TIMESTAMP '2026-11-02 00:00:00'
  AND schema_type = 'TRADE';
```
Laut gesagt: „Ich filtere einen Tag und einen Typ. Iceberg liest nur diese eine Partition.“

**Bei Hive war das anders:** Man brauchte eine Spalte `dt` und musste in jeder Abfrage `WHERE dt = '...'` schreiben. Wer das vergass, las die ganze Tabelle.

**Transforms in Iceberg:** `years`, `months`, `days`, `hours`, `bucket(N, col)`, `truncate(L, col)`.

## 3min
**Wie wähle ich die Partitionierung?**
1. Nach welchen Spalten filtern die Abfragen?
2. Wie gross wird eine Partition? Ziel: nicht zu klein. Hunderte MB bis wenige GB pro Partition.
3. Wie viele Partitionen entstehen? Tausende sind ok, Millionen nicht.

**Zu fein partitioniert:** zum Beispiel nach `hours` und `customer_id`. Dann gibt es Millionen winzige Dateien. Lesen und Metadaten werden langsam.

**Zu grob:** zum Beispiel nach `years`. Dann liest jede Abfrage zu viel.

**Bucket für hohe Kardinalität:** `bucket(16, customer_id)` verteilt Kunden auf 16 Gruppen. Gut für Joins und Abfragen nach Kunde.

**Partition Evolution:** Ich kann die Partitionierung später ändern, ohne alte Daten neu zu schreiben. Alte Dateien behalten das alte Layout.

**Partitionierung ist nicht alles:** Innerhalb einer Partition hilft Sortierung (`ALTER TABLE ... WRITE ORDERED BY`). Dann sind Min/Max pro Datei enger und Iceberg überspringt mehr Dateien.

**Partition und Idempotenz:** Wenn der Gold-Job pro Tag überschreibt, passt eine Partitionierung nach Tag perfekt. Ein Overwrite ersetzt genau eine Partition.

**Wie prüfe ich, dass Pruning wirkt?** `explain()` in Spark zeigt die Filter. In Dremio das Query-Profil: Anzahl gelesener Dateien.

## Follow-ups
- Warum `days(received_date)` und nicht das Handelsdatum? → *(Prüfen: Ihr echter Grund.)* Möglich: Die Verarbeitung läuft pro Eingang, und neue Daten landen so in neuen Partitionen.
- Was ist Partition Pruning? → Die Engine überspringt Partitionen, die nicht zum Filter passen. Sie liest sie gar nicht.
- Was passiert, wenn ich auf eine Funktion von der Spalte filtere, zum Beispiel `date_format(received_date)`? → Dann kann Pruning manchmal nicht wirken. Besser direkt auf die Spalte mit einem Bereich filtern.
- Partitionieren in PostgreSQL? → Ähnliches Prinzip: deklarative Partitionierung nach Range, zum Beispiel pro Monat. Alte Partitionen kann man schnell löschen.
- Wie viele Dateien pro Partition sind gut? → Wenige grosse. Compaction hilft, wenn es viele kleine werden.

## Don't say
- „Ich partitioniere nach der ID.“ Eine Spalte mit Millionen Werten gibt Millionen Partitionen.
- „Mehr Partitionen sind immer schneller.“

## Words
- **die Partition** = Gruppe von Daten mit gleichem Wert
- **Partition Pruning** = nur die nötigen Partitionen lesen
- **Hidden Partitioning** = Iceberg berechnet den Partitionswert selbst
- **zu fein / zu grob** = too fine / too coarse
- **der Transform** = Funktion wie days() oder bucket()
