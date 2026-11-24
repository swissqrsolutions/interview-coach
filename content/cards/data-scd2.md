---
id: data-scd2
round: data
tech: [modelling]
tier: 1
proof: study
q: Was ist SCD Typ 2? Wie bauen Sie das in SQL?
en: What is SCD type 2? How do you build it in SQL?
---
## 30s
SCD heisst Slowly Changing Dimension. Es geht um Stammdaten, die sich langsam ändern, zum Beispiel die Adresse eines Kunden.
Typ 1 überschreibt den alten Wert. Die Historie ist weg.
Typ 2 schliesst die alte Zeile und fügt eine neue ein. Jede Zeile hat `valid_from`, `valid_to` und `is_current`.
So weiss ich, welcher Wert zu welchem Zeitpunkt galt.
Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich von MATCH: Auch dort ersetzen wir Daten kontrolliert per DELETE und APPEND in einer Transaktion.
Soll ich das SQL zeigen?

## 90s
**Tabelle:**
```
dim_customer(customer_key PK,      -- Surrogate Key
             customer_id,          -- fachlicher Schlüssel
             name, city, segment,
             valid_from, valid_to, is_current)
```

**Beispiel:** Kunde 42 zieht am 1. Dezember von Bern nach Zürich.
```
customer_key | customer_id | city   | valid_from | valid_to   | is_current
1001         | 42          | Bern   | 2024-03-01 | 2026-12-01 | false
2087         | 42          | Zürich | 2026-12-01 | 9999-12-31 | true
```

**Schritt 1, alte Zeilen schliessen (laut gesagt):**
```
UPDATE dim_customer d
SET valid_to = :load_date, is_current = false
FROM staging_customer s
WHERE d.customer_id = s.customer_id
  AND d.is_current = true
  AND (d.city IS DISTINCT FROM s.city OR d.segment IS DISTINCT FROM s.segment);
```
„Ich schliesse die aktuelle Zeile, wenn sich ein überwachtes Feld geändert hat.“

**Schritt 2, neue Zeilen einfügen:**
```
INSERT INTO dim_customer(customer_id, name, city, segment, valid_from, valid_to, is_current)
SELECT s.customer_id, s.name, s.city, s.segment, :load_date, DATE '9999-12-31', true
FROM staging_customer s
LEFT JOIN dim_customer d
  ON d.customer_id = s.customer_id AND d.is_current = true
WHERE d.customer_id IS NULL;
```
„Jeder Kunde ohne aktuelle Zeile bekommt eine neue. Das sind neue Kunden und die, die ich gerade geschlossen habe.“

Beides in einer Transaktion. (PostgreSQL-Syntax. Mit `IS DISTINCT FROM` sind auch null-Werte richtig verglichen.)

## 3min
**Fakten mit der richtigen Version verbinden:**
```
SELECT f.amount, d.city
FROM fact_sales f
JOIN dim_customer d
  ON d.customer_id = f.customer_id
 AND f.sale_date >= d.valid_from AND f.sale_date < d.valid_to;
```
Besser: Beim Laden der Fakten gleich den passenden `customer_key` speichern. Dann ist der Join einfach.

**Andere Typen kurz:**
- **Typ 0:** nie ändern.
- **Typ 1:** überschreiben, keine Historie.
- **Typ 2:** neue Zeile, volle Historie.
- **Typ 3:** eine Spalte `previous_city`. Nur ein Schritt zurück.

**Fallstricke:**
- **Idempotenz:** Läuft der Job zweimal am selben Tag, darf keine zweite Version entstehen. Die Bedingung „Feld hat sich geändert“ schützt davor.
- **Späte Daten:** Eine Änderung kommt mit altem Datum. Dann muss ich Zeilen in der Mitte der Historie einfügen. Das ist schwer. Darum mit dem Business klären.
- **Zu viele Versionen:** Ein Feld, das sich täglich ändert, gehört nicht in SCD2. Das ist eher ein Fakt.
- **Halboffene Intervalle:** `valid_from` inklusive, `valid_to` exklusive. Sonst gibt es Lücken oder Überlappungen.

**Werkzeuge:** In dbt gibt es Snapshots für SCD2. In Delta Lake oder Iceberg geht es mit `MERGE INTO`.

## Follow-ups
- Warum ein Surrogate Key und nicht die Kunden-ID? → Ein Kunde hat mehrere Versionen. Jede Version braucht eine eigene ID.
- Warum `9999-12-31` und nicht null für `valid_to`? → Dann funktionieren Bereichsabfragen ohne Sonderfall für null. Beides ist üblich.
- Wie erkennen Sie Änderungen schnell bei vielen Spalten? → Ein Hash über die überwachten Spalten. Ist der Hash anders, gibt es eine neue Version.
- Geht das mit einem einzigen MERGE? → Ja, mit einem Trick: Die geänderten Zeilen kommen zweimal in die Quelle, einmal zum Schliessen, einmal zum Einfügen.
- Wann reicht Typ 1? → Wenn niemand die Historie braucht, zum Beispiel bei der Korrektur eines Tippfehlers.

## Don't say
- „SCD2 heisst, ich speichere die alte Version in einer Spalte.“ Das ist Typ 3.
- Nicht vergessen, dass beide Schritte in eine Transaktion gehören.

## Words
- **die Stammdaten** = master data
- **die Historie** = history
- **schliessen (eine Zeile)** = valid_to setzen
- **halboffenes Intervall** = Start inklusive, Ende exklusive
- **die überwachte Spalte** = Spalte, deren Änderung eine neue Version macht
