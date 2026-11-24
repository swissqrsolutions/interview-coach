---
id: data-vault
round: data
tech: [modelling]
tier: 3
proof: study
q: Was ist Data Vault? Wann würden Sie es statt Star Schema nehmen?
en: What is Data Vault? When would you use it instead of a star schema?
---
## 30s
Data Vault ist eine Modellierung für die Integrationsschicht eines Warehouses.
Es gibt drei Bausteine: Hubs, Links und Satellites.
Hubs speichern fachliche Schlüssel. Links speichern Beziehungen. Satellites speichern Attribute mit Historie.
Alles wird nur eingefügt, nie geändert. So ist jede Änderung nachvollziehbar.
Für Business-Nutzer baut man danach Star Schemas darauf.
Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich vom Insert-only-Gedanken in Bronze und Silver bei MATCH.
Soll ich ein Beispiel zeigen?

## 90s
**Beispiel: Kunde kauft Produkt**
```
hub_customer(customer_hk, customer_id, load_ts, record_source)
hub_product(product_hk, product_code, load_ts, record_source)
link_purchase(purchase_hk, customer_hk, product_hk, load_ts, record_source)
sat_customer(customer_hk, load_ts, hash_diff, name, city, segment, record_source)
```
- `customer_hk` = Hash des fachlichen Schlüssels, zum Beispiel MD5 oder SHA-256 von `customer_id`.
- `hash_diff` = Hash über die Attribute. Neue Zeile im Satellite nur, wenn er sich ändert.
- `record_source` = aus welchem System die Daten kommen.

**Satellite laden, laut gesagt:**
```
INSERT INTO sat_customer(customer_hk, load_ts, hash_diff, name, city, segment, record_source)
SELECT s.customer_hk, :load_ts, s.hash_diff, s.name, s.city, s.segment, 'CRM'
FROM stg_customer s
LEFT JOIN (
  SELECT customer_hk, hash_diff,
         ROW_NUMBER() OVER (PARTITION BY customer_hk ORDER BY load_ts DESC) AS rn
  FROM sat_customer
) cur ON cur.customer_hk = s.customer_hk AND cur.rn = 1
WHERE cur.hash_diff IS NULL OR cur.hash_diff <> s.hash_diff;
```
„Ich füge eine neue Version nur ein, wenn sich der Hash der Attribute geändert hat.“

## 3min
**Warum Hash Keys?** Man kann Hubs, Links und Satellites parallel laden. Keine Sequenz, kein Lookup. Das gleiche System erzeugt immer den gleichen Key.

**Stärken:**
- Viele Quellsysteme, die sich oft ändern. Eine neue Quelle = neuer Satellite, alte Tabellen bleiben.
- Volle Nachvollziehbarkeit (Audit). Wichtig in Banken, Versicherungen, Behörden.
- Laden ist einfach, idempotent und parallel.

**Schwächen:**
- Viele Tabellen und viele Joins. Für Abfragen schwer.
- Darum braucht man eine Mart-Schicht (Star Schema) für Nutzer.
- Mehr Aufwand am Anfang. Für ein kleines Projekt zu viel.

**Wann ich es wähle:**
- Data Vault: viele Quellen, strenge Audit-Pflicht, langfristiges Enterprise-Warehouse.
- Star Schema direkt: wenige Quellen, schnell Ergebnisse, klare Fragen.
- Im Lakehouse: Data Vault kann die Silver-Schicht sein, Star Schema die Gold-Schicht.

**Werkzeuge:** Viele Teams generieren die Lade-Logik mit dbt-Paketen wie AutomateDV. *(Prüfen: Paketname aktuell, falls Sie ihn nennen.)*

## Follow-ups
- Was ist der Unterschied zwischen Hub und Link? → Ein Hub ist ein Geschäftsobjekt mit Schlüssel, zum Beispiel Kunde. Ein Link verbindet Hubs, zum Beispiel Kauf.
- Warum nur Inserts? → Nichts geht verloren. Jede Version ist da. Das ist gut für Audit und für erneutes Laden.
- Was ist ein Business Vault? → Eine Schicht mit abgeleiteten Regeln und Berechnungen, über dem Raw Vault.
- Gibt es Kollisionen bei Hash Keys? → Theoretisch ja. Mit SHA-256 sind sie praktisch ausgeschlossen. MD5 ist bei sehr vielen Keys riskanter.
- Data Vault oder Medallion? → Das ist kein Gegensatz. Medallion beschreibt Schichten, Data Vault ein Modell. Data Vault passt in Silver.

## Don't say
- „Data Vault ersetzt das Star Schema.“ Man braucht beides.
- Nicht behaupten, Sie hätten ein Data Vault produktiv gebaut.

## Words
- **der Hub** = Tabelle mit fachlichen Schlüsseln
- **der Link** = Tabelle mit Beziehungen
- **der Satellite** = Tabelle mit Attributen und Historie
- **nachvollziehbar** = traceable
- **der Hash Key** = Schlüssel aus einem Hash berechnet
