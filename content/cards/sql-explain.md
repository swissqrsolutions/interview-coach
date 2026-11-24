---
id: sql-explain
round: sql
tech: [postgres]
tier: 1
project: CARIAD (PostgreSQL-Backend), MATCH (Performance)
q: Hier ist ein EXPLAIN ANALYZE. Was lesen Sie daraus?
en: Here is an EXPLAIN ANALYZE output. What do you read from it?
---
## 30s
`EXPLAIN` zeigt den Plan. `EXPLAIN ANALYZE` führt die Abfrage wirklich aus.
Dann sehe ich geschätzte und echte Zeilen und die echte Zeit.
Ich lese von innen nach außen. Ich suche den Knoten mit der meisten Zeit.
Dann vergleiche ich: geschätzte Zeilen gegen echte Zeilen.
Ein großer Unterschied heißt meistens: Die Statistik stimmt nicht.
Performance-Arbeit habe ich bei MATCH gemacht, dort mit 250 Millionen Zeilen.
Soll ich ein Beispiel Zeile für Zeile lesen?

## 90s
**Ich starte immer so:**
```
EXPLAIN (ANALYZE, BUFFERS)
SELECT o.id, o.total
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE c.country = 'CH'
  AND o.created_at >= DATE '2025-01-01';
```

**Beispiel-Ausgabe (gekürzt):**
```
Hash Join  (cost=..  rows=120) (actual time=0.9..812.4 rows=98000 loops=1)
  Hash Cond: (o.customer_id = c.id)
  -> Seq Scan on orders o  (rows=2000000) (actual rows=1950000 loops=1)
        Filter: (created_at >= '2025-01-01')
        Rows Removed by Filter: 50000
        Buffers: shared hit=1200 read=38000
  -> Hash  (actual rows=4000)
        -> Index Scan using ix_customers_country on customers c
```
Laut gesagt:
1. „Die meiste Zeit liegt im Seq Scan auf `orders`.“
2. „Der Filter entfernt fast nichts. Darum ist der Seq Scan hier sogar richtig.“
3. „Der Join schätzt 120 Zeilen, echt sind 98 000. Die Schätzung ist stark daneben.“
4. „`read=38000` heißt: viele Seiten kommen von der Disk, nicht aus dem Cache.“

## 3min
**Die wichtigsten Knoten:**
- **Seq Scan:** liest die ganze Tabelle. Gut bei vielen Treffern, schlecht bei wenigen.
- **Index Scan:** Index, dann Tabelle. Gut bei wenigen Treffern.
- **Index Only Scan:** nur der Index. `Heap Fetches` sollte klein sein.
- **Bitmap Heap Scan:** sammelt erst die Treffer, dann liest es die Seiten in Reihenfolge. Gut im Mittelfeld.
- **Nested Loop:** gut, wenn die äußere Seite klein ist. Gefährlich, wenn die Schätzung zu klein war.
- **Hash Join:** gut für große, ungeordnete Mengen. Braucht `work_mem`.
- **Merge Join:** beide Seiten sortiert.

**Worauf ich achte:**
- `actual time` ist pro Loop. Bei `loops=5000` mal 5000 rechnen.
- `Sort Method: external merge Disk` → `work_mem` zu klein für diese Sortierung.
- `rows` geschätzt gegen echt, Faktor 10 oder mehr → `ANALYZE tabelle`, oder erweiterte Statistik mit `CREATE STATISTICS` für abhängige Spalten.

**Vorsicht:** `EXPLAIN ANALYZE` auf `UPDATE` oder `DELETE` ändert die Daten wirklich. Darum:
```
BEGIN;
EXPLAIN (ANALYZE, BUFFERS) DELETE FROM ...;
ROLLBACK;
```

**Zweiter Lauf ist schneller?** Dann liegen die Daten jetzt im Cache. Ich vergleiche `shared hit` und `read`.

**Bei MATCH** war die Engine Spark und Dremio, nicht PostgreSQL. Das Prinzip ist gleich: Plan lesen, Partition Pruning prüfen, nicht zu viel lesen.

## Follow-ups
- Was ist der Unterschied zwischen cost und actual time? → cost ist eine Schätzung in internen Einheiten. actual time ist echte Zeit in Millisekunden.
- Warum wählt PostgreSQL einen Seq Scan, obwohl es einen Index gibt? → Zu viele Treffer, alte Statistik oder der Index passt nicht zur Bedingung.
- Wie finden Sie langsame Abfragen in Produktion? → `pg_stat_statements` und `auto_explain` mit einer Mindestdauer.
- Was macht BUFFERS? → Es zeigt, wie viele Seiten aus dem Cache und wie viele von der Disk kamen.

## Don't say
- „Seq Scan ist immer schlecht.“ Bei vielen Treffern ist er die beste Wahl.
- Nicht `EXPLAIN ANALYZE` auf ein `DELETE` in Produktion ohne `ROLLBACK`.

## Words
- **Plan** = query plan
- **Knoten** = node im Plan
- **Schätzung** = estimate
- **daneben** = falsch, weit weg
- **Statistik** = Wissen der DB über die Verteilung der Daten
