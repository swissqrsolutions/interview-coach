---
id: sql-running-total-lag
round: sql
tech: [postgres]
tier: 1
project: MATCH (Chart „CumulativeSum“)
q: Berechnen Sie eine laufende Summe pro Kunde und die Veränderung zum Vortag.
en: Calculate a running total per customer and the change versus the previous day.
---
## 30s
Für die laufende Summe nutze ich `SUM() OVER` mit `ORDER BY`.
Für den Vortag nutze ich `LAG()`.
Beides sind Window Functions. Die Zeilen bleiben erhalten.
Bei MATCH hatten wir genau dieses Thema: Ein Chart hieß „CumulativeSum“.
Es hat aber nur die Summe pro Tag gerechnet, keine laufende Summe.
Soll ich zeigen, wie man das sauber schreibt?

## 90s
**Daten:** `daily_sales(customer_id, day, amount)`, eine Zeile pro Kunde und Tag.

```
SELECT customer_id,
       day,
       amount,
       SUM(amount) OVER (
         PARTITION BY customer_id
         ORDER BY day
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_total,
       amount - LAG(amount) OVER (
         PARTITION BY customer_id ORDER BY day
       ) AS delta_prev_day
FROM daily_sales
ORDER BY customer_id, day;
```
Laut gesagt: „Pro Kunde sortiere ich nach Tag. Ich summiere vom ersten Tag bis heute. `LAG` gibt mir den Wert der Zeile davor.“

**Erste Zeile:** `LAG` gibt dort `NULL`. Wenn das Fachliche „0“ will: `LAG(amount, 1, 0)`.

## 3min
**Die Falle mit dem Frame:**
Ohne `ROWS ...` nimmt PostgreSQL `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. Bei `RANGE` zählen Zeilen mit gleichem Datum zusammen. Zwei Zeilen am selben Tag bekommen dann dieselbe Summe. Darum schreibe ich `ROWS` explizit, oder ich aggregiere vorher auf einen Tag.

**LAG ist nicht „gestern“:** `LAG` nimmt die vorherige Zeile. Fehlt ein Tag, vergleicht man mit vorgestern. Wenn das falsch ist: zuerst alle Tage mit `generate_series` erzeugen, dann `LEFT JOIN`.

**Weitere Fenster:**
- Gleitender 7-Tage-Schnitt: `AVG(amount) OVER (PARTITION BY customer_id ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)`.
- Anteil am Gesamtumsatz: `amount / SUM(amount) OVER (PARTITION BY customer_id)`.

**Die MATCH-Geschichte (gut für „Was haben Sie gelernt?“):**
Der Chart „CumulativeSum“ hat im alten .NET-System eine Tagessumme gerechnet, keine laufende Summe. Unser Abnahme-Kriterium war 100 % Parität mit dem alten System. Darum haben wir das Verhalten zuerst genau nachgebaut.
Meine Lektion: Zuerst das Verhalten migrieren. Die Bedeutung später korrigieren, als eigene, sichtbare Entscheidung.

**Bei MATCH ist die Statistik „replace-the-result“:** Wir rechnen einen Tag neu und überschreiben ihn. Eine laufende Summe hängt aber von allen früheren Tagen ab. Ändert sich ein alter Tag, ändern sich alle späteren Summen. Darum rechne ich laufende Summen lieber beim Lesen, nicht beim Schreiben.

## Follow-ups
- Was ist der Unterschied zwischen ROWS und RANGE? → ROWS zählt physische Zeilen. RANGE nimmt alle Zeilen mit gleichem Sortierwert zusammen.
- Wie bekommen Sie den Wert vom nächsten Tag? → Mit `LEAD()`.
- Läuft eine Window Function vor oder nach WHERE? → Danach. Darum filtere ich ihr Ergebnis in einer äußeren Abfrage.
- Ist das schnell bei vielen Zeilen? → Die DB sortiert einmal pro Partition. Ein Index auf (customer_id, day) hilft.

## Don't say
- „Eine laufende Summe mache ich mit einer Schleife im Code.“ Window Functions sind dafür gemacht.
- „LAG ist immer der Vortag.“ Es ist nur die vorherige Zeile.

## Words
- **laufende Summe** = running total, cumulative sum
- **Vortag** = previous day
- **Frame** = welche Zeilen im Fenster zählen
- **Parität** = gleiche Ergebnisse wie das alte System
