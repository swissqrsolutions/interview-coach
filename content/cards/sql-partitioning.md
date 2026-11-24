---
id: sql-partitioning
round: sql
tech: [postgres]
tier: 2
project: MATCH (Iceberg-Partitionierung days(received_date) + schema_type)
q: Wann partitionieren Sie eine Tabelle in PostgreSQL, und wie?
en: When do you partition a table in PostgreSQL, and how?
---
## 30s
Partitionierung teilt eine große Tabelle in kleinere Teile, zum Beispiel pro Monat.
Die Abfrage liest dann nur die passenden Teile. Das heißt Partition Pruning.
Alte Daten lösche ich, indem ich eine ganze Partition entferne. Das ist sehr schnell.
Bei MATCH habe ich das mit Iceberg gemacht: nach Tag und Schema-Typ, bei über 250 Millionen Zeilen.
In PostgreSQL gibt es dafür die deklarative Partitionierung.
Soll ich das SQL zeigen?

## 90s
**Tabelle nach Monat (RANGE):**
```
CREATE TABLE trades (
  id            bigint GENERATED ALWAYS AS IDENTITY,
  received_date date NOT NULL,
  schema_type   text NOT NULL,
  payload       jsonb,
  PRIMARY KEY (id, received_date)
) PARTITION BY RANGE (received_date);

CREATE TABLE trades_2025_01 PARTITION OF trades
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE trades_default PARTITION OF trades DEFAULT;
```
Laut gesagt: „Der Primary Key muss die Partitionsspalte enthalten. Sonst kann PostgreSQL die Eindeutigkeit nicht prüfen.“

**Die drei Arten:**
- `RANGE`: Zeit, Zahlen. Der häufigste Fall.
- `LIST`: feste Werte, zum Beispiel Land oder Typ.
- `HASH`: gleichmäßig verteilen, wenn es keinen natürlichen Schlüssel gibt.

**Pruning prüfen:**
```
EXPLAIN SELECT * FROM trades
WHERE received_date >= '2025-01-10' AND received_date < '2025-01-11';
-- im Plan darf nur trades_2025_01 stehen
```

## 3min
**Wann partitionieren?**
- Die Tabelle ist sehr groß, und fast alle Abfragen filtern nach derselben Spalte (oft Zeit).
- Alte Daten sollen regelmäßig weg: `ALTER TABLE trades DETACH PARTITION trades_2023_01;` dann `DROP`. Kein langsames `DELETE`, kein Bloat.

**Wann nicht?**
- Die Abfragen filtern nicht nach dem Partitionsschlüssel. Dann liest die DB alle Partitionen, und es wird langsamer.
- Die Tabelle ist nur „groß“ mit ein paar Millionen Zeilen. Ein guter Index reicht dann meistens.
- Zu viele kleine Partitionen machen die Planung langsam.

**Betrieb:**
- Neue Partitionen müssen vor dem neuen Monat da sein. Sonst landen Daten in der Default-Partition oder der Insert schlägt fehl. → Ein Job oder `pg_partman`.
- Ein Index auf der Haupttabelle wird für jede Partition angelegt.

**Vergleich mit MATCH (Iceberg):**
- Iceberg hat „hidden partitioning“: `days(received_date)`. Die Abfrage filtert nur auf `received_date`. Iceberg leitet den Tag selbst ab.
- In PostgreSQL muss die Abfrage direkt auf die Partitionsspalte filtern. Eine Funktion darum herum kann das Pruning verhindern.
- Bei Iceberg hatten wir dazu kleine Dateien als Thema: Compaction mit `rewrite_data_files` und `expire_snapshots`. In PostgreSQL ist das Gegenstück VACUUM.

## Follow-ups
- Was ist Partition Pruning? → Die DB lässt Partitionen weg, die laut Filter keine Treffer haben. Das geht beim Planen und auch zur Laufzeit.
- Was ist der Unterschied zu Sharding? → Partitionen liegen in einer DB. Sharding verteilt die Daten auf mehrere Server, zum Beispiel mit Citus.
- Kann ich eine bestehende Tabelle partitionieren? → Nicht direkt. Neue partitionierte Tabelle anlegen, Daten kopieren, umbenennen. Oder die alte Tabelle als Partition anhängen.
- Warum nach Tag und Schema-Typ bei MATCH? → Die Verarbeitung und die Statistik laufen pro Tag, und die Daten haben verschiedene Schema-Typen. *(Prüfen: ob das Ihre echte Begründung ist.)*

## Don't say
- „Partitionierung macht jede Abfrage schneller.“ Nur Abfragen mit Filter auf den Schlüssel.
- „Ich partitioniere ab einer Million Zeilen.“ Die Menge allein ist kein Grund.

## Words
- **Partition Pruning** = Partitionen beim Lesen weglassen
- **deklarativ** = declarative
- **gleichmäßig** = evenly
- **ableiten** = to derive
- **anhängen / abhängen** = attach / detach
