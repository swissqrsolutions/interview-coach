---
id: sql-normalisation
round: sql
tech: [postgres]
tier: 2
project: MATCH (Silver normalisiert, Gold pro Tag)
q: Was ist Normalisierung, und wann denormalisieren Sie bewusst?
en: What is normalisation, and when do you denormalise on purpose?
---
## 30s
Normalisierung heißt: jede Information nur an einer Stelle.
So gibt es keine Widersprüche bei Updates.
Für normale Anwendungen ziele ich auf die dritte Normalform.
Für Auswertungen denormalisiere ich bewusst, weil Lesen dann schneller ist.
Bei MATCH sieht man beides: Silver hat saubere, getrennte Tabellen. Gold hat fertige Statistiken pro Tag.
Soll ich die Normalformen an einem Beispiel zeigen?

## 90s
**Beispiel:** Eine Tabelle `orders(order_id, customer_name, customer_city, product_ids, ...)`.

- **1. Normalform:** Jede Zelle hat einen Wert. `product_ids = '3,7,9'` ist verboten. → eigene Tabelle `order_items(order_id, product_id, qty)`.
- **2. Normalform:** Bei einem zusammengesetzten Schlüssel hängt jede Spalte vom ganzen Schlüssel ab. In `order_items(order_id, product_id, qty, product_name)` hängt `product_name` nur an `product_id`. → in `products`.
- **3. Normalform:** Keine Spalte hängt von einer anderen Nicht-Schlüssel-Spalte ab. `customer_city` hängt am Kunden, nicht an der Bestellung. → in `customers`.

**Ergebnis:**
```
customers(id, name, city)
orders(id, customer_id REFERENCES customers, created_at)
products(id, name, price)
order_items(order_id REFERENCES orders,
            product_id REFERENCES products,
            qty, unit_price,
            PRIMARY KEY (order_id, product_id))
```
Laut gesagt: „`unit_price` steht bewusst in `order_items`. Der Preis zum Zeitpunkt der Bestellung ist ein eigener Fakt. Er darf sich nicht ändern, wenn der Produktpreis sich ändert.“

## 3min
**Wann denormalisieren?**
- Viele Lesezugriffe, teure Joins, Reporting.
- Werte, die historisch fest sein müssen (Preis, Adresse auf der Rechnung).
- Vorberechnete Summen, zum Beispiel eine Statistik pro Tag.

**Bei MATCH:**
- **Silver:** typisierte, validierte Tabellen für Verträge, Defaults und Insider-Informationen. Dedupliziert, partitioniert.
- **Gold:** Statistiken pro Tag, fertig gerechnet für die Charts.
- Wichtig: Gold wird immer aus Silver neu berechnet (replace-the-result). Darum ist die Kopie kein Risiko. Silver bleibt die Wahrheit.

**Werkzeuge in PostgreSQL:**
- `MATERIALIZED VIEW` mit `REFRESH MATERIALIZED VIEW CONCURRENTLY` (braucht einen Unique Index).
- Generated Columns: `total numeric GENERATED ALWAYS AS (qty * unit_price) STORED`.

**Risiken der Denormalisierung:**
- Zwei Kopien laufen auseinander. → Klare Quelle der Wahrheit und ein Job, der neu berechnet.
- Mehr Speicher, langsamere Writes.

**Star Schema** (Fakten und Dimensionen) ist die klassische Denormalisierung für Data Warehouses. Die Theorie kenne ich. *(Produktiv modelliert habe ich ein Star Schema noch nicht. Prüfen, bevor Sie mehr sagen.)*

## Follow-ups
- Was ist BCNF? → Eine strengere 3. Normalform: Jede Spalte, von der andere abhängen, muss ein Schlüssel sein. In der Praxis selten ein Problem.
- Ist JSONB nicht gegen die 1. Normalform? → Ja, ein Stück. Für flexible Zusatzdaten ist das okay. Felder, nach denen ich filtere oder joine, gehören in echte Spalten.
- Natürlicher oder künstlicher Schlüssel? → Meistens künstlich (identity oder UUID) als Primary Key, plus Unique Constraint auf den natürlichen Schlüssel.
- Wie halten Sie eine denormalisierte Tabelle aktuell? → Neu berechnen statt inkrementell ändern, wenn möglich. So ist ein Retry sicher.

## Don't say
- „Normalisierung ist immer gut.“ Für Reporting kostet sie viele Joins.
- „Komma-Listen in einer Spalte sind okay.“ Das bricht die 1. Normalform und jede Suche.

## Words
- **Normalform** = normal form
- **Widerspruch** = contradiction, inconsistency
- **Nicht-Schlüssel-Spalte** = non-key column
- **vorberechnet** = precomputed
- **auseinanderlaufen** = to drift apart
