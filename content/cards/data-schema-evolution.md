---
id: data-schema-evolution
round: data
tech: [iceberg, lakehouse]
tier: 2
project: ElCom MATCH
q: Wie gehen Sie mit Schema-Änderungen in einer Pipeline um?
en: How do you handle schema changes in a pipeline?
---
## 30s
Quellen ändern sich: neue Felder, umbenannte Felder, andere Typen.
Ich unterscheide sichere und gefährliche Änderungen.
Ein neues optionales Feld ist sicher. Ein Typ-Wechsel oder ein gelöschtes Pflichtfeld ist gefährlich.
Iceberg hilft: Jede Spalte hat eine interne ID. Umbenennen und Hinzufügen sind reine Metadaten-Änderungen.
Bei MATCH war Schema Evolution ein Grund für Iceberg. Es gibt verschiedene Meldungstypen. Wir partitionieren auch nach `schema_type`.
Soll ich zeigen, was Iceberg genau erlaubt?

## 90s
**In Iceberg erlaubt, ohne Dateien neu zu schreiben:**
- Spalte hinzufügen, löschen, umbenennen, Reihenfolge ändern.
- Typ erweitern: `int` → `long`, `float` → `double`, `decimal(P,S)` → grössere Präzision.
- Partitionierung ändern (Partition Evolution). Alte Daten behalten das alte Layout.

```
ALTER TABLE silver.trades ADD COLUMN venue string;
ALTER TABLE silver.trades RENAME COLUMN qty TO quantity;
ALTER TABLE silver.trades ALTER COLUMN volume TYPE bigint;
```
Laut gesagt: „Iceberg findet Spalten über IDs, nicht über Namen. Darum bricht ein Umbenennen keine alten Dateien.“

**Nicht erlaubt:** zum Beispiel `string` → `int`. Dann brauche ich eine neue Spalte und eine Migration.

**In der Pipeline:**
1. Das Schema der Quelle ist ein Vertrag (bei XML: das XSD).
2. Bronze nimmt die Daten möglichst roh.
3. Silver hat ein festes, geprüftes Schema.
4. Unbekannte Felder: loggen und alarmieren, nicht still verwerfen.

## 3min
**Schema-on-read vs. Schema-on-write:**
- Bronze: eher Schema-on-read. Rohdaten nicht verlieren.
- Silver und Gold: Schema-on-write. Nutzer brauchen stabile Spalten.

**Gefährliche Fälle und was ich tue:**
- **Typ ändert sich in der Quelle:** neue Spalte, beide parallel befüllen, Konsumenten umstellen, alte Spalte später löschen.
- **Feld wird umbenannt:** Mapping in der Pipeline, Rename in Iceberg.
- **Bedeutung ändert sich, Name bleibt:** das gefährlichste. Kein Schema-Check findet das. Nur Qualitätsregeln und Gespräche mit der Quelle.

**Mit Kafka:** Eine Schema Registry mit Avro oder Protobuf. Regeln wie BACKWARD-Kompatibilität. Ein Producer kann kein inkompatibles Schema registrieren.

**Parsing-Unterschiede sind auch Schema-Fragen:** Bei MATCH lasen .NET und Spark Zahlen und Datumswerte unterschiedlich. Dazu null gegen leeren String. Ich habe fünf Extractor-Bugs gefunden. Lektion: Typen und Formate explizit festlegen, nie der Default-Kultur vertrauen.

**Delta Lake zum Vergleich:** Delta hat `mergeSchema` beim Schreiben und Column Mapping für Rename. Iceberg hat Spalten-IDs von Anfang an.

## Follow-ups
- Was ist Partition Evolution? → Ich ändere das Partition-Schema, zum Beispiel von Monat auf Tag. Neue Daten nutzen das neue Layout. Abfragen funktionieren über beide.
- Wie testen Sie Schema-Änderungen? → Mit Beispiel-Dateien pro Schema-Version in den Tests. Und ein Check im CI, der das Ziel-Schema vergleicht.
- Was passiert mit alten Dateien nach ADD COLUMN? → Nichts. Beim Lesen ist die neue Spalte dort null.
- Wie erfährt das Team von einer Änderung in der Quelle? → Besser vorher, über einen Datenvertrag. Sonst über einen Alarm bei unbekannten Feldern.
- Was ist ein Data Contract? → Eine Absprache zwischen Produzent und Konsument: Schema, Bedeutung, Qualität, Aktualität.

## Don't say
- „Wir schreiben einfach die ganze Tabelle neu.“ Bei 250 Millionen Zeilen ist das unnötig und riskant.
- „Schema-Änderungen kommen bei uns nicht vor.“

## Words
- **die Schema-Änderung** = schema change
- **erweitern** = to widen
- **der Datenvertrag (Data Contract)** = Absprache über Schema und Qualität
- **abwärtskompatibel** = backward compatible
- **still verwerfen** = to silently drop
