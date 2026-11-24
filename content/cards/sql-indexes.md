---
id: sql-indexes
round: sql
tech: [postgres]
tier: 1
project: MATCH (Pending-Nachrichten), NABODAT (PostGIS), CARIAD (PostgreSQL)
q: Welche Arten von Indizes kennen Sie in PostgreSQL, und welchen Index bauen Sie für diese Abfrage?
en: Which index types do you know in PostgreSQL, and which index do you build for this query?
---
## 30s
Der Standard ist der B-tree. Er hilft bei `=`, `<`, `>`, `BETWEEN` und `ORDER BY`.
Bei mehreren Spalten zählt die Reihenfolge: zuerst Gleichheit, dann Bereich.
Ein Partial Index enthält nur einen Teil der Zeilen, zum Beispiel nur „Pending“.
GIN ist für JSONB, Arrays und Volltext. GiST ist für Geodaten.
GiST kenne ich von NABODAT mit PostGIS. Pending-Nachrichten kenne ich von MATCH.
Soll ich an einer konkreten Abfrage zeigen, wie ich den Index wähle?

## 90s
**Beispiel-Abfrage:**
```
SELECT id, created_at
FROM orders
WHERE customer_id = 42
  AND created_at >= now() - interval '30 days'
ORDER BY created_at DESC;
```
**Index:**
```
CREATE INDEX ix_orders_customer_created
  ON orders (customer_id, created_at DESC);
```
Laut gesagt: „Zuerst die Spalte mit Gleichheit, dann die Spalte mit Bereich und Sortierung. So liest die DB nur einen kleinen Teil, schon sortiert.“

**Composite-Regel (linkes Präfix):** Der Index (a, b) hilft bei `WHERE a = ?` und bei `WHERE a = ? AND b > ?`. Bei `WHERE b = ?` allein hilft er kaum.

**Partial Index** für eine Warteschlange:
```
CREATE INDEX ix_messages_pending
  ON messages (created_at)
  WHERE status = 'PENDING';
```
Klein, schnell, weil fast alle Zeilen schon „Completed“ sind.
Bei MATCH lag die Nachrichtentabelle in SQL Server. Dort heißt das „Filtered Index“. *(Prüfen: ob es dort so einen Index gibt.)*

**GIN** für JSONB:
```
CREATE INDEX ix_events_payload ON events USING GIN (payload jsonb_path_ops);
-- hilft bei: WHERE payload @> '{"type":"ORDER"}'
```

## 3min
**Weitere Werkzeuge:**
- **Covering Index:** `CREATE INDEX ... ON orders (customer_id) INCLUDE (total);` Dann ist ein Index Only Scan möglich.
- **Expression Index:** `CREATE INDEX ... ON customers (lower(email));` Die Abfrage muss genau `lower(email)` benutzen.
- **GiST:** für Geometrien und Bereiche. Bei NABODAT haben wir Bodendaten mit PostGIS verarbeitet. Räumliche Abfragen wie `ST_Intersects` brauchen einen GiST-Index.
- **BRIN:** sehr klein, für riesige Tabellen, wenn die Daten nach Zeit sortiert eingefügt werden.

**Kosten von Indizes:**
- Jeder Index macht `INSERT` und `UPDATE` langsamer.
- Er braucht Platz und Pflege durch VACUUM.
- Ein Update auf eine indizierte Spalte verhindert HOT-Updates.
Ich prüfe mit `pg_stat_user_indexes`, ob ein Index überhaupt benutzt wird (`idx_scan = 0`).

**In Produktion:** `CREATE INDEX CONCURRENTLY`. Das blockiert keine Schreibzugriffe. Es dauert länger und darf nicht in einer Transaktion laufen. Schlägt es fehl, bleibt ein ungültiger Index. Den muss ich löschen.

**Wann kein Index hilft:**
- Die Abfrage liest einen großen Teil der Tabelle. Dann ist ein Seq Scan schneller.
- Eine Funktion auf der Spalte: `WHERE date(created_at) = ...` nutzt den normalen Index nicht.
- Falscher Datentyp oder `LIKE '%abc'` mit Wildcard vorne. Dafür gibt es `pg_trgm` mit GIN.

## Follow-ups
- Hat ein Fremdschlüssel automatisch einen Index? → Nein, in PostgreSQL nicht. Nur Primary Key und Unique haben einen.
- Warum benutzt PostgreSQL meinen Index nicht? → Statistik alt, zu viele Treffer, Funktion auf der Spalte oder falscher Typ. Ich prüfe mit `EXPLAIN` und `ANALYZE`.
- Was ist ein Index Only Scan? → Alle Spalten sind im Index. Die DB muss die Tabelle nicht lesen, wenn die Visibility Map aktuell ist.
- jsonb_ops oder jsonb_path_ops? → jsonb_path_ops ist kleiner und schneller für `@>`. jsonb_ops kann zusätzlich `?` (Schlüssel existiert).
- Wie viele Indizes sind zu viele? → Keine feste Zahl. Ungenutzte Indizes löschen, schreibintensive Tabellen schlank halten.

## Don't say
- „Mehr Indizes machen alles schneller.“ Schreiben wird langsamer.
- „Ich indiziere jede Spalte einzeln.“ Ein passender Composite-Index ist meistens besser.

## Words
- **Index** (Plural: Indizes oder Indexe) = index
- **linkes Präfix** = die ersten Spalten eines Composite-Index
- **Bereich** = range
- **Schreibzugriff** = write access
- **ungültig** = invalid
