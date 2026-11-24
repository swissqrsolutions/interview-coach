---
id: sql-not-exists-anti-join
round: sql
tech: [postgres]
tier: 2
project: MATCH (Parität SQL Server gegen Iceberg)
q: Finden Sie alle Kunden ohne Bestellung. Warum ist NOT IN hier gefährlich?
en: Find all customers without an order. Why is NOT IN dangerous here?
---
## 30s
Das ist ein Anti-Join: Zeilen, die in der anderen Tabelle fehlen.
Ich schreibe es mit `NOT EXISTS`.
`NOT IN` ist gefährlich, wenn die Unterabfrage ein `NULL` enthält.
Dann gibt `NOT IN` gar keine Zeile zurück, ohne Fehler.
Bei MATCH haben wir alte und neue Ergebnisse Tabelle für Tabelle verglichen. Dafür ist dieses Muster zentral.
Soll ich das NULL-Problem genau erklären?

## 90s
**Die richtige Abfrage:**
```
SELECT c.id, c.name
FROM customers c
WHERE NOT EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.customer_id = c.id
);
```
Laut gesagt: „Ich nehme jeden Kunden, für den es keine Bestellung gibt.“

**Alternative:**
```
SELECT c.id, c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.customer_id IS NULL;
```
Beide gibt PostgreSQL meistens als **Hash Anti Join** aus. Das sieht man in `EXPLAIN`.

**Das Problem mit NOT IN:**
```
SELECT * FROM customers
WHERE id NOT IN (SELECT customer_id FROM orders);
```
Ist ein `customer_id` in `orders` NULL, wird die Bedingung nie wahr. `x NOT IN (1, NULL)` heißt `x <> 1 AND x <> NULL`. Und `x <> NULL` ist UNKNOWN, nicht TRUE. Ergebnis: leere Liste.

## 3min
**Warum NOT EXISTS besser ist:**
- Richtig mit NULL.
- PostgreSQL kann es als Anti Join planen. `NOT IN` mit Unterabfrage kann der Planner nicht so gut. Bei großen Tabellen wird es dann sehr langsam.

**Index:** Für die Abfrage brauche ich einen Index auf `orders(customer_id)`. PostgreSQL legt für Fremdschlüssel **keinen** Index automatisch an. Das vergessen viele.

**Paritäts-Abgleich als Beispiel (MATCH):**
Wir mussten zeigen: SQL Server und Iceberg haben dieselben Ergebnisse. Ein Job `validate_parity.py` hat Tabelle für Tabelle verglichen. Die Grundidee ist ein Anti-Join in beide Richtungen:
```
-- in alt, aber nicht in neu
SELECT * FROM old_stats
EXCEPT
SELECT * FROM new_stats;
```
`EXCEPT` vergleicht alle Spalten und behandelt NULL wie einen gleichen Wert. Für einen Abgleich ist das praktisch. *(Prüfen: wie validate_parity.py genau vergleicht.)*

**Wann NOT IN in Ordnung ist:** Bei einer festen Liste ohne NULL: `status NOT IN ('DONE', 'FAILED')`.

## Follow-ups
- Was ist ein Semi-Join? → `EXISTS`: Zeilen, die mindestens einen Partner haben. Jede Zeile kommt nur einmal, auch bei vielen Partnern.
- Ist LEFT JOIN … IS NULL schlechter? → Meistens gleich schnell. NOT EXISTS ist klarer in der Absicht.
- Wie prüfen Sie zwei Tabellen auf Gleichheit? → `EXCEPT` in beide Richtungen, plus Zeilenzahl vergleichen.
- Warum ist `x = NULL` nie wahr? → SQL hat drei Werte: TRUE, FALSE, UNKNOWN. Für NULL braucht man `IS NULL`.

## Don't say
- „NOT IN und NOT EXISTS sind dasselbe.“ Nicht bei NULL.
- „Ein Fremdschlüssel hat automatisch einen Index.“ Nicht in PostgreSQL.

## Words
- **Anti-Join** = Zeilen ohne Partner in der anderen Tabelle
- **Semi-Join** = Zeilen mit mindestens einem Partner
- **UNKNOWN** = dritter Wahrheitswert bei NULL
- **Abgleich** = reconciliation, Vergleich
