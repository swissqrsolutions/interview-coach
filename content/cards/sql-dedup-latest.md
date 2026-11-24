---
id: sql-dedup-latest
round: sql
tech: [postgres]
tier: 1
project: MATCH (Silver-Layer dedupliziert)
q: Finden Sie doppelte Kunden und behalten Sie nur den neuesten Eintrag.
en: Find duplicate customers and keep only the latest record.
---
## 30s
Zuerst frage ich: Was heißt „doppelt“? Gleiche E-Mail? Gleiche Kundennummer?
Dann nummeriere ich pro Gruppe mit `ROW_NUMBER()`, neuester Eintrag zuerst.
Nummer 1 behalte ich. Alle anderen sind Duplikate.
In PostgreSQL geht „nur den neuesten“ auch kurz mit `DISTINCT ON`.
Bei MATCH ist der Silver-Layer genau so dedupliziert.
Soll ich auch das Löschen zeigen?

## 90s
**Duplikate finden:**
```
SELECT lower(email) AS email, COUNT(*)
FROM customers
GROUP BY lower(email)
HAVING COUNT(*) > 1;
```

**Neuesten Eintrag lesen:**
```
SELECT DISTINCT ON (lower(email)) *
FROM customers
ORDER BY lower(email), updated_at DESC, id DESC;
```
Laut gesagt: „Pro E-Mail nehme ich die erste Zeile. Die Sortierung bestimmt, welche das ist: die neueste.“

**Duplikate löschen:**
```
DELETE FROM customers c
USING (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY lower(email)
           ORDER BY updated_at DESC, id DESC
         ) AS rn
  FROM customers
) d
WHERE c.id = d.id
  AND d.rn > 1;
```
Die `id` im `ORDER BY` ist der Tie-Breaker. Ohne ihn ist das Ergebnis bei gleicher Zeit zufällig.

## 3min
**Vor dem Löschen:**
- Erst `SELECT`, dann zählen, dann `DELETE` in einer Transaktion.
- Verweisen andere Tabellen auf die alten IDs? Dann zuerst die Fremdschlüssel umhängen.
- Bei vielen Millionen Zeilen in Batches löschen. Sonst gibt es lange Locks und viel WAL.

**Danach: verhindern, dass es wieder passiert.**
```
CREATE UNIQUE INDEX ux_customers_email
  ON customers (lower(email));
```
Und beim Schreiben ein Upsert:
```
INSERT INTO customers (email, name, updated_at)
VALUES (:email, :name, now())
ON CONFLICT ((lower(email)))
DO UPDATE SET name = EXCLUDED.name,
              updated_at = EXCLUDED.updated_at;
```

**Bei MATCH:** Silver ist typisiert, validiert und dedupliziert. Beim erneuten Laden einer Nachricht ersetzen wir die Daten: `DELETE WHERE message_id = X`, dann `APPEND`, in einer Iceberg-Transaktion. So entstehen bei einem Retry keine Duplikate.

**Trade-off:** `DISTINCT ON` ist kurz, aber nur PostgreSQL. `ROW_NUMBER()` ist Standard-SQL und läuft auch auf SQL Server und Oracle.

## Follow-ups
- Was ist, wenn zwei Einträge dieselbe Zeit haben? → Ein zweites Sortierfeld wie `id` als Tie-Breaker.
- Wie finden Sie fast gleiche Namen, zum Beispiel „Müller“ und „Mueller“? → Normalisieren, oder `pg_trgm` mit Ähnlichkeit. Das ist dann eine fachliche Entscheidung.
- Ist `DISTINCT ON` schnell? → Ja, mit einem Index auf (Schlüssel, Datum DESC). Sonst muss die DB sortieren.
- Warum nicht einfach `DISTINCT`? → `DISTINCT` entfernt nur Zeilen, die in allen Spalten gleich sind.

## Don't say
- „Ich lösche einfach mit `DISTINCT`.“ Das löscht nichts und findet nur exakte Kopien.
- Nicht löschen ohne vorher zu zählen und ohne Transaktion.

## Words
- **Duplikat** = duplicate
- **Tie-Breaker** = zweites Sortierfeld bei Gleichstand
- **umhängen** = (Fremdschlüssel) auf eine andere Zeile zeigen lassen
- **Upsert** = insert or update
