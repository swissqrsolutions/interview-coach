---
id: sql-oracle-vs-postgres
round: sql
tech: [oracle, postgres]
tier: 3
project: NABODAT (PostgreSQL/PostGIS), DigiSanté (PostgreSQL)
q: Was sind die wichtigsten Unterschiede zwischen Oracle und PostgreSQL, zum Beispiel bei einer Migration?
en: What are the main differences between Oracle and PostgreSQL, for example in a migration?
---
## 30s
Beide sind reife relationale Datenbanken mit Transaktionen und MVCC.
PostgreSQL ist Open Source und hat keine Lizenzkosten. Oracle ist kommerziell.
Die größten Unterschiede bei einer Migration: PL/SQL, Datentypen und leere Strings.
In Oracle ist ein leerer String gleich `NULL`. In PostgreSQL nicht.
PostgreSQL nutze ich produktiv, zum Beispiel bei NABODAT mit PostGIS und bei DigiSanté.
*(Prüfen: Wo haben Sie Oracle genutzt? Wenn nur wenig: „PL/SQL kenne ich in den Grundlagen.“)*
Soll ich die Unterschiede für eine Migration auflisten?

## 90s
**Typische Unterschiede im SQL:**

| Oracle | PostgreSQL |
|---|---|
| `VARCHAR2(100)` | `varchar(100)` oder `text` |
| `NUMBER(10)` | `integer`, `bigint` oder `numeric` |
| `DATE` hat auch eine Uhrzeit | `date` ohne Zeit, `timestamp` mit Zeit |
| `NVL(a, b)` | `COALESCE(a, b)` |
| `SYSDATE` | `now()` oder `current_timestamp` |
| `SELECT 1 FROM DUAL` | `SELECT 1` |
| `ROWNUM <= 10` | `LIMIT 10` (beide kennen `FETCH FIRST 10 ROWS ONLY`) |
| `seq.NEXTVAL` | `nextval('seq')` oder Identity-Spalte |
| PL/SQL Packages | PL/pgSQL Funktionen, keine Packages |

Laut gesagt: „Die Syntax ist der kleine Teil. Das Verhalten ist der große Teil, vor allem NULL und Datumswerte.“

**Die Falle mit leeren Strings:**
```
-- Oracle: kein Treffer für '' , weil '' = NULL
-- PostgreSQL: '' ist ein echter Wert
SELECT * FROM persons WHERE middle_name IS NULL;
```
Nach einer Migration gibt diese Abfrage andere Ergebnisse. Darum vorher entscheiden: `''` zu `NULL` umwandeln oder nicht.

## 3min
**Unterschiede im Inneren:**
- **MVCC:** Oracle hält alte Versionen im Undo-Bereich. PostgreSQL schreibt neue Zeilenversionen in die Tabelle und braucht VACUUM.
- **DDL in Transaktionen:** In PostgreSQL kann ich `CREATE TABLE` zurückrollen. In Oracle macht DDL einen impliziten Commit. Für Migrationen mit Flyway ist PostgreSQL hier angenehmer.
- **Groß-/Kleinschreibung:** Oracle speichert Namen ohne Anführungszeichen groß, PostgreSQL klein. `"MyTable"` mit Anführungszeichen wird in beiden zur Falle.
- **Leere Strings und NULL**, siehe oben.

**Was bei einer Migration hilft:**
1. Inventar: Tabellen, PL/SQL, Trigger, Jobs, Datenbank-Links.
2. Werkzeug für das Schema, zum Beispiel `ora2pg`. Danach von Hand nacharbeiten.
3. PL/SQL-Logik: nach PL/pgSQL übersetzen oder besser in die Anwendung holen.
4. Daten migrieren, dann Ergebnisse automatisch vergleichen.

**Die wichtigste Lektion aus MATCH**, auch wenn es dort SQL Server zu Iceberg war: Nie Logik portieren ohne einen Vergleich, den eine Maschine prüft. Wir hatten einen Paritäts-Job und gingen erst bei 100 % Parität live. Die Unterschiede lagen in Details: Zahlen- und Datumsformate je nach Kultur, NULL gegen leeren String, Zeitzonen. Genau diese Details gibt es auch bei Oracle zu PostgreSQL.

**Trade-off:** Oracle hat starke Enterprise-Funktionen (RAC, Partitioning-Optionen, Support). PostgreSQL ist günstiger und hat viele Erweiterungen (PostGIS, pgvector).

## Follow-ups
- Gibt es Packages in PostgreSQL? → Nein. Man nutzt Schemas, um Funktionen zu gruppieren. Die Erweiterung `orafce` bildet einige Oracle-Funktionen nach.
- Was ist mit Hints? → Oracle hat Optimizer-Hints. PostgreSQL hat keine eingebauten Hints. Man arbeitet mit Statistik und Indizes.
- Wie gehen Sie mit `DATE` um? → Oracle `DATE` hat eine Uhrzeit. In PostgreSQL meistens `timestamp`, sonst geht die Zeit verloren.
- Was ist schwieriger, Schema oder Logik? → Die Logik: PL/SQL, Trigger und das Verhalten bei NULL.

## Don't say
- „Das ist nur Syntax, das macht ein Tool.“ Das Verhalten ändert sich.
- Nicht mehr Oracle-Erfahrung behaupten, als Sie wirklich haben.

## Words
- **Lizenzkosten** = licence costs
- **Undo-Bereich** = undo tablespace
- **impliziter Commit** = automatischer Commit
- **nacharbeiten** = to rework by hand
- **Anführungszeichen** = quotation marks
