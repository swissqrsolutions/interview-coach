---
id: data-star-schema
round: data
tech: [modelling]
tier: 1
proof: study
q: Was ist ein Star Schema? Wie modellieren Sie Fakten und Dimensionen?
en: What is a star schema? How do you model facts and dimensions?
---
## 30s
Ein Star Schema hat eine Faktentabelle in der Mitte und Dimensionen rundherum.
Fakten sind Messwerte: Betrag, Menge, Anzahl. Eine Zeile pro Ereignis.
Dimensionen beschreiben die Fakten: Kunde, Produkt, Datum.
Das Modell ist einfach für Business-Nutzer und schnell für Abfragen.
Das Wichtigste ist die Granularität: Was ist genau eine Zeile?
Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich von den Gold-Tabellen bei MATCH: Statistik pro Tag und Typ, gebaut für eine Frage.
Soll ich ein Beispiel mit Tabellen zeigen?

## 90s
**Beispiel: Handel mit Energie**
```
fact_trade(date_key, product_key, trader_key, venue_key,
           trade_id, volume_mwh, price_chf, amount_chf)
dim_date(date_key, date, year, month, weekday, is_holiday)
dim_product(product_key, product_code, commodity, delivery_period)
dim_trader(trader_key, trader_id, name, country, valid_from, valid_to)
dim_venue(venue_key, name, type)
```

**Granularität:** Eine Zeile = ein Trade. Nicht ein Tag, nicht ein Kunde.

**SQL laut gesagt:**
```
SELECT d.month, p.commodity, SUM(f.volume_mwh) AS volume
FROM fact_trade f
JOIN dim_date d    ON d.date_key = f.date_key
JOIN dim_product p ON p.product_key = f.product_key
WHERE d.year = 2026
GROUP BY d.month, p.commodity
ORDER BY d.month;
```
„Ich summiere das Volumen pro Monat und Rohstoff. Die Fakten verbinde ich über Surrogate Keys mit den Dimensionen.“

**Surrogate Key:** eine technische ID wie `product_key`. Sie bleibt stabil, auch wenn sich die fachliche ID ändert. Und sie erlaubt Historie (SCD2).

## 3min
**Arten von Fakten:**
- **Transaktion:** eine Zeile pro Ereignis.
- **Periodischer Snapshot:** eine Zeile pro Konto und Tag, zum Beispiel Kontostand.
- **Akkumulierender Snapshot:** eine Zeile pro Prozess, mit mehreren Datumsfeldern (bestellt, geliefert, bezahlt).

**Additiv oder nicht:**
- Betrag und Menge kann man summieren.
- Kontostand ist semi-additiv: über Konten summieren ja, über Tage nein.
- Preise und Quoten sind nicht additiv. Ich speichere Zähler und Nenner.

**Star vs. Snowflake:** Snowflake normalisiert Dimensionen weiter, zum Beispiel Produkt → Kategorie als eigene Tabelle. Weniger Redundanz, aber mehr Joins. Für Analysen nehme ich Star.

**Star Schema im Lakehouse:** Die Gold-Schicht kann ein Star Schema sein. Oft gibt es auch breite, flache Tabellen (One Big Table). Die sind einfach, aber Änderungen an Dimensionen sind teuer.

**Typische Fehler:**
- Granularität nicht festgelegt. Dann werden Werte doppelt gezählt.
- Zwei Faktentabellen direkt joinen. Das gibt falsche Summen. Besser: jede für sich aggregieren, dann über gemeinsame Dimensionen verbinden.

## Follow-ups
- Was ist eine Conformed Dimension? → Eine Dimension, die mehrere Faktentabellen gleich nutzen, zum Beispiel `dim_date`. So kann man Fakten vergleichen.
- Warum eine Datums-Dimension, wenn es ein Datum gibt? → Sie enthält Feiertage, Wochentage, Geschäftsjahr. Das will man nicht in jeder Abfrage rechnen.
- Was ist eine Degenerate Dimension? → Eine ID ohne eigene Tabelle, die direkt in den Fakten steht, zum Beispiel `trade_id`.
- Was ist eine Junk Dimension? → Viele kleine Flags in einer Dimension gesammelt, statt in der Faktentabelle.
- Wann kein Star Schema? → Für operative Systeme mit vielen Updates. Dort nehme ich ein normalisiertes Modell (3NF).

## Don't say
- „Die Faktentabelle hat den Kundennamen.“ Beschreibende Texte gehören in die Dimension.
- Nicht behaupten, Sie hätten produktiv ein Kimball-Warehouse gebaut.

## Words
- **die Faktentabelle** = fact table
- **die Dimension** = beschreibende Tabelle
- **die Granularität** = was eine Zeile genau ist (grain)
- **der Surrogate Key** = technischer Schlüssel
- **additiv** = man darf summieren
