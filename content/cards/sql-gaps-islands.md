---
id: sql-gaps-islands
round: sql
tech: [postgres]
tier: 2
project: MATCH (Nachrichten pro Tag)
q: Finden Sie Zeiträume, in denen ein Nutzer an aufeinanderfolgenden Tagen aktiv war.
en: Find periods in which a user was active on consecutive days (gaps and islands).
---
## 30s
Das ist das Muster „Gaps and Islands“.
Eine Insel ist eine Folge ohne Lücke, zum Beispiel Tage hintereinander.
Der Trick: Datum minus Zeilennummer ergibt pro Insel denselben Wert.
Nach diesem Wert gruppiere ich. So bekomme ich Start, Ende und Länge.
Bei MATCH ist jede Statistik pro Tag. Dort hilft das Muster, fehlende Tage zu finden.
Soll ich die Abfrage Schritt für Schritt zeigen?

## 90s
**Daten:** `logins(user_id, login_date)`, mehrere Logins pro Tag möglich.

```
WITH days AS (
  SELECT DISTINCT user_id, login_date
  FROM logins
),
grp AS (
  SELECT user_id,
         login_date,
         login_date - ROW_NUMBER() OVER (
           PARTITION BY user_id ORDER BY login_date
         )::int AS island
  FROM days
)
SELECT user_id,
       MIN(login_date) AS start_day,
       MAX(login_date) AS end_day,
       COUNT(*)        AS days
FROM grp
GROUP BY user_id, island
ORDER BY user_id, start_day;
```
Laut gesagt: „Zuerst ein Eintrag pro Tag. Dann Datum minus Zeilennummer. Bei Tagen ohne Lücke bleibt der Wert gleich. Danach gruppiere ich.“

**Beispiel:** 3., 4., 5. Mai → Zeilennummer 1, 2, 3 → Wert immer 2. Mai. Der 8. Mai hat Nummer 4 → Wert 4. Mai. Neue Insel.

**Wichtig:** `DISTINCT` am Anfang. Zwei Logins am selben Tag würden sonst die Nummern verschieben.

## 3min
**Die Lücken finden** geht gut mit `LAG`:
```
SELECT user_id, prev_day, login_date
FROM (
  SELECT user_id,
         login_date,
         LAG(login_date) OVER (
           PARTITION BY user_id ORDER BY login_date
         ) AS prev_day
  FROM (SELECT DISTINCT user_id, login_date FROM logins) d
) x
WHERE login_date - prev_day > 1;
```
PostgreSQL hat kein `QUALIFY`. Darum filtere ich in der äußeren Abfrage.

**Fehlende Tage im Kalender:** `generate_series` erzeugt alle Tage. Dann ein Anti-Join:
```
SELECT d::date AS missing_day
FROM generate_series(DATE '2025-01-01', DATE '2025-12-31', INTERVAL '1 day') d
WHERE NOT EXISTS (
  SELECT 1 FROM daily_stats s WHERE s.day = d::date
);
```

**Bei MATCH:** Die Statistik rechnet pro Tag neu. Eine Prüfung „Welche Tage haben keine Statistik?“ ist genau diese Abfrage. *(Prüfen: ob Sie diese Prüfung bei MATCH wirklich so gebaut haben.)*

**Fallen:**
- Zeitstempel statt Datum: erst auf den Tag runden, in der richtigen Zeitzone.
- Bei Zahlen statt Daten geht derselbe Trick: `seq - ROW_NUMBER()`.

## Follow-ups
- Warum funktioniert der Trick? → Beide Werte steigen in einer Insel um genau 1. Die Differenz bleibt gleich.
- Was passiert ohne DISTINCT? → Doppelte Tage bekommen eigene Nummern. Die Inseln brechen falsch.
- Wie finde ich die längste Serie? → Das Ergebnis nach `days DESC` sortieren und `LIMIT 1` pro Nutzer, zum Beispiel mit `DISTINCT ON`.
- Wie schnell ist das? → Ein Sortieren pro Nutzer. Ein Index auf (user_id, login_date) hilft.

## Don't say
- Keine Schleife in der Anwendung vorschlagen, wenn SQL es in einer Abfrage kann.
- „Zeitzonen sind egal.“ Bei Tagen sind sie nie egal.

## Words
- **Insel** = island, Folge ohne Lücke
- **Lücke** = gap
- **aufeinanderfolgend** = consecutive
- **Anti-Join** = Zeilen, die in der anderen Tabelle fehlen
