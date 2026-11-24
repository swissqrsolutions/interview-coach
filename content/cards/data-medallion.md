---
id: data-medallion
round: data
tech: [lakehouse, spark, iceberg]
tier: 1
project: ElCom MATCH
q: Was ist die Medallion-Architektur? Wie haben Sie Bronze, Silver und Gold bei MATCH geschnitten?
en: What is the medallion architecture? How did you split bronze, silver and gold in MATCH?
---
## 30s
Die Medallion-Architektur hat drei Schichten.
Bronze sind die Rohdaten, so wie sie kommen.
Silver sind bereinigte, typisierte Daten ohne Duplikate.
Gold sind fertige Ergebnisse für das Business, zum Beispiel Statistiken.
So kann ich jede Schicht neu rechnen, ohne die Quelle neu zu laden.
Bei MATCH: Bronze sind die geparsten XML-Records, Silver die Tabellen für Verträge, Defaults und Insider-Informationen, Gold die Statistik pro Tag.
Soll ich zeigen, wie die Daten durch die Schichten fliessen?

## 90s
**Bei MATCH:**
1. **Eingang:** Die ZIP-Datei landet in MinIO. Eine Meldung in SQL Server bekommt den Status Pending.
2. **Bronze:** Ein PySpark-Job entschlüsselt das ZIP und parst das XML. Rohe Records, nah an der Quelle.
3. **Silver:** Typisiert und validiert. Contract-, Default- und Inside-Information-Tabellen. Dedupliziert und partitioniert nach `days(received_date)` und `schema_type`.
4. **Gold:** Die Statistik pro Tag. Sieben Rechner, von .NET nach PySpark portiert.
5. **Serving:** Dremio liest Gold und Silver. Die Web-UI zeigt Tabellen und Charts.

**Regeln pro Schicht:**
- Bronze: nur anhängen, nichts ändern. Das ist mein Audit.
- Silver: eine Zeile pro fachlichem Schlüssel. Hier passiert die Qualität.
- Gold: klein, schnell, für eine Frage gebaut.

## 3min
**Warum Schichten?**
- **Neu rechnen:** Ein Bug in der Statistik? Ich rechne nur Gold neu. Die Rohdaten bleiben.
- **Fehlersuche:** Ich kann jede Zahl bis zum XML zurückverfolgen.
- **Verantwortung:** Bronze gehört der Ingestion, Gold dem Business-Use-Case.

**Idempotenz pro Schicht bei MATCH:**
- Silver: DELETE WHERE message_id = X, dann APPEND. In einer Iceberg-Transaktion. Ein Retry ersetzt die Daten der Meldung.
- Gold: einen ganzen Tag neu rechnen und überschreiben. Ein Retry gibt dasselbe Ergebnis.
- Die Statistik startet erst, wenn die Ingestion für die Meldung Completed ist. Jede Meldung hat dafür zwei eigene Pending-Status.

**Trade-offs:**
- Drei Kopien kosten Speicher. Object Storage ist aber billig.
- Mehr Schichten = mehr Jobs = mehr Betrieb. Nicht jede Tabelle braucht alle drei.
- Die Namen sind nur eine Konvention. Wichtig sind klare Verträge zwischen den Schichten.

**Fehler, die man sieht:**
- Business-Logik schon in Bronze: dann kann man nicht mehr neu rechnen.
- Gold liest direkt aus Bronze: dann fehlen Deduplizierung und Typen.

## Follow-ups
- Speichern Sie das rohe XML auch? → Das ZIP landet zuerst in MinIO. Bronze enthält die geparsten Records. *(Prüfen: wie lange das ZIP dort bleibt.)*
- Wo prüfen Sie die Qualität? → Beim Übergang Bronze zu Silver: Typen, Pflichtfelder, Duplikate. Bei Gold die Parität gegen das alte System.
- Wie haben Sie die Gold-Ergebnisse geprüft? → Mit einem Parity-Job `validate_parity.py`. Er vergleicht SQL Server und Iceberg Tabelle für Tabelle. Go-Live erst bei 100 %.
- Ist Medallion das Gleiche wie Staging/Core/Mart? → Sehr ähnlich. Im klassischen Warehouse heisst es Staging, Core und Data Mart.
- Wie partitionieren Sie Gold? → *(Prüfen: Partitionierung der Gold-Tabellen.)* Sinnvoll ist nach Tag, weil der Job pro Tag überschreibt.

## Don't say
- „Bronze ist Müll, den man löschen kann.“ Bronze ist die Basis zum Neu-Rechnen.
- Nicht nur die drei Farben nennen. Immer sagen, welches Problem jede Schicht löst.

## Words
- **die Schicht** = layer
- **bereinigt** = cleaned
- **zurückverfolgen** = to trace back (lineage)
- **dedupliziert** = ohne Duplikate
- **der fachliche Schlüssel** = business key
