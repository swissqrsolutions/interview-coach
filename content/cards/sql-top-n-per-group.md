---
id: sql-top-n-per-group
round: sql
tech: [postgres]
tier: 1
project: MATCH (Statistiken pro Tag), CARIAD (PostgreSQL-Backend)
q: Schreiben Sie eine Abfrage für die Top 3 Produkte pro Kategorie nach Umsatz.
en: Write a query for the top 3 products per category by revenue.
---
## 30s
Zuerst sage ich die Form vom Ergebnis: pro Kategorie drei Zeilen.
Ich nutze eine Window Function: `ROW_NUMBER()` mit `PARTITION BY` Kategorie.
Ich sortiere im Fenster nach Umsatz, absteigend.
Dann filtere ich auf Rang 1 bis 3.
Auswertungen pro Gruppe habe ich bei MATCH gebaut: Statistiken pro Tag, über 250 Millionen Zeilen.
Soll ich sagen, was bei Gleichstand passiert?

## 90s
**Die Abfrage:**
```
WITH ranked AS (
  SELECT category_id,
         product_id,
         SUM(amount) AS revenue,
         ROW_NUMBER() OVER (
           PARTITION BY category_id
           ORDER BY SUM(amount) DESC, product_id
         ) AS rn
  FROM order_items
  GROUP BY category_id, product_id
)
SELECT category_id, product_id, revenue
FROM ranked
WHERE rn <= 3
ORDER BY category_id, rn;
```
Laut gesagt: „Ich summiere den Umsatz pro Produkt. Dann nummeriere ich pro Kategorie. Ich behalte Nummer 1 bis 3.“

**Warum ein CTE?** `WHERE rn <= 3` geht nicht direkt. Window Functions rechnet die DB erst nach dem `WHERE`.

**Gleichstand:** Ich sortiere zusätzlich nach `product_id`. So ist das Ergebnis stabil und wiederholbar.

## 3min
**Drei Funktionen, drei Ergebnisse bei Gleichstand:**
- `ROW_NUMBER()` → 1, 2, 3, 4. Immer genau drei Zeilen.
- `RANK()` → 1, 2, 2, 4. Gleichstand teilt den Platz, dann gibt es eine Lücke.
- `DENSE_RANK()` → 1, 2, 2, 3. Keine Lücke. Mehr als drei Zeilen möglich.
Ich frage den Fachbereich: „Wollen Sie genau drei oder alle mit gleichem Umsatz?“

**Nur Platz 1?** In PostgreSQL gibt es `DISTINCT ON`:
```
SELECT DISTINCT ON (category_id) category_id, product_id, revenue
FROM product_revenue
ORDER BY category_id, revenue DESC;
```

**Große Tabellen, wenige Kategorien:** `LATERAL` mit `LIMIT`. Die DB liest pro Kategorie nur drei Zeilen über einen Index.
```
SELECT c.id, p.product_id, p.revenue
FROM categories c
CROSS JOIN LATERAL (
  SELECT product_id, revenue
  FROM product_revenue r
  WHERE r.category_id = c.id
  ORDER BY revenue DESC
  LIMIT 3
) p;
-- Index: product_revenue(category_id, revenue DESC)
```

**Trade-off:** Die Window-Variante liest alles einmal. Das ist gut, wenn man alle Gruppen braucht. `LATERAL` ist besser, wenn die Gruppen groß sind und der Index passt.

## Follow-ups
- Warum nicht `GROUP BY` mit `LIMIT 3`? → `LIMIT` gilt für das ganze Ergebnis, nicht pro Gruppe.
- Was ist der Unterschied zwischen RANK und DENSE_RANK? → RANK lässt nach Gleichstand eine Lücke, DENSE_RANK nicht.
- Wie machen Sie das schnell bei 100 Millionen Zeilen? → Vorher aggregieren, zum Beispiel in einer Tabelle pro Tag, und einen Index auf (Gruppe, Wert DESC).
- Geht das auch ohne Window Function? → Ja, mit `LATERAL` und `LIMIT` oder einer korrelierten Unterabfrage. Window Functions sind aber am klarsten.

## Don't say
- `WHERE ROW_NUMBER() OVER (...) <= 3` – das ist ein Syntaxfehler.
- Nicht vergessen zu fragen, was bei Gleichstand gilt.

## Words
- **Gleichstand** = tie
- **absteigend** = descending
- **Window Function** = Funktion über eine Gruppe von Zeilen, ohne sie zusammenzufassen
- **wiederholbar** = deterministic, gleiches Ergebnis bei jedem Lauf
