---
id: data-design-bank-pipeline
round: data
tech: [lakehouse, kafka, modelling]
tier: 1
project: ElCom MATCH (pattern), BIT DAZiT (Kafka)
q: Bauen Sie eine Pipeline für Banktransaktionen, von der Quelle bis zum Bericht.
en: Design a pipeline for bank transactions, from the source to the report.
---
## 30s
Zuerst frage ich: Wie viele Transaktionen? Wie schnell braucht man sie? Wer nutzt die Daten?
Ich nehme an: 5 Millionen Transaktionen pro Tag. Berichte am nächsten Morgen, Betrugsalarme in Sekunden.
Mein Plan: Die Transaktionen kommen per CDC aus dem Kernbanksystem in Kafka.
Von dort in ein Lakehouse mit Bronze, Silver und Gold.
Gold ist ein Star Schema: Fakten Transaktion, Dimensionen Konto, Kunde, Datum.
Jeder Schritt ist idempotent über die Transaktions-ID. So habe ich es bei MATCH gebaut, dort mit Iceberg und Spark.
Soll ich mit den Schichten anfangen?

## 90s
**Zahlen:** 5 Millionen pro Tag = etwa 60 pro Sekunde, Spitze am Monatsende etwa 500. Pro Transaktion etwa 1 KB = 5 GB pro Tag roh, etwa 2 TB pro Jahr. Mit Parquet komprimiert deutlich weniger.

**Ablauf (Quelle → Bericht):**
1. **Quelle:** Kernbanksystem. CDC mit Debezium liest das Datenbank-Log. Oder tägliche Dateien.
2. **Ingest:** Kafka-Topic `transactions`, Key = account_id. Reihenfolge pro Konto.
3. **Bronze:** Spark schreibt die Events roh in Iceberg, mit Kafka-Offset und Ankunftszeit.
4. **Silver:** typisiert, dedupliziert nach `transaction_id`, Beträge als Decimal, Zeit in UTC.
5. **Gold:** Star Schema und Tagesaggregate.
6. **Serving:** Dremio oder ein Warehouse für Berichte. Ein Stream-Job für Betrugsalarme.

**Datenmodell Gold:**
```
fact_transaction(transaction_id, date_key, account_key, customer_key,
                 counterparty_key, amount_chf, currency, channel, booked_at)
dim_account(account_key, account_id, type, branch, valid_from, valid_to, is_current)
dim_customer(customer_key, customer_id, segment, domicile, valid_from, valid_to, is_current)
dim_date(date_key, date, month, year, is_business_day)
```

**SQL laut gesagt — Silver idempotent laden:**
```
MERGE INTO silver.transactions t
USING bronze_new s ON t.transaction_id = s.transaction_id
WHEN MATCHED AND s.source_ts > t.source_ts THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;
```
„Eine Transaktion kommt nur einmal in Silver. Kommt sie nochmal, gewinnt nur die neuere Version.“ (Vorher `bronze_new` pro `transaction_id` deduplizieren, sonst scheitert MERGE bei mehreren Treffern.)

**Bericht, laut gesagt:**
```
SELECT d.date, c.segment, SUM(f.amount_chf) AS volume, COUNT(*) AS n
FROM gold.fact_transaction f
JOIN gold.dim_date d ON d.date_key = f.date_key
JOIN gold.dim_customer c ON c.customer_key = f.customer_key
WHERE d.date >= DATE '2026-11-01'
GROUP BY d.date, c.segment;
```
„Volumen und Anzahl pro Tag und Kundensegment.“

## 3min
**Idempotenz und Crash-Sicherheit (wie bei MATCH):**
- Silver: MERGE über `transaction_id`. Bei MATCH machen wir DELETE pro message_id und APPEND in einer Iceberg-Transaktion. Gleiches Prinzip.
- Gold: pro Tag neu rechnen und überschreiben. Ein Retry gibt dasselbe Ergebnis.
- Kafka liefert at-least-once. Darum ist Deduplizierung in Silver Pflicht.

**Späte Daten und Korrekturen:** Banken buchen auch rückwirkend (Valutadatum). Ich trenne Buchungsdatum und Valutadatum. Betroffene Tage werden neu gerechnet. Berichte sind nach einer Frist final.

**Datenqualität:** Pflichtfelder, gültige Währung, Summen-Abgleich gegen das Kernbanksystem jeden Tag. Fehlerhafte Zeilen in eine Quarantäne-Tabelle.

**Partitionierung:** `days(booked_at)` für Fakten. Abfragen filtern fast immer nach Datum.

**Historie:** Kunde und Konto als SCD2. So zeigt ein Bericht das Segment zum Zeitpunkt der Transaktion.

**Sicherheit:** Bankgeheimnis und FINMA-Regeln. Kundendaten pseudonymisieren oder verschlüsseln. Rechte pro Rolle, Spalten-Masking für Namen und IBAN. Secrets im Vault. Audit-Log für jeden Zugriff. Bei MATCH: Keycloak für Login, Vault und Azure Key Vault für Secrets, Network Policies mit Cilium.

**Orchestrierung:** Zeitplan für Gold, zum Beispiel mit Airflow. Oder demand-driven wie bei MATCH: Job nur starten, wenn neue Daten da sind.

**Kosten:** Speicher ist billig. Rechenzeit kostet. Karpenter oder Autoscaling für Spark-Spitzen. Compaction gegen kleine Dateien.

**Monitoring:** Kafka Consumer Lag, Job-Dauer, Zeilen pro Lauf, Alter der neuesten Daten.

## Follow-ups
- Warum CDC und nicht ein täglicher Export? → CDC liefert jede Änderung in Sekunden und belastet die Quelle wenig. Ein Export ist einfacher, aber nur einmal am Tag.
- Wie stellen Sie sicher, dass keine Transaktion fehlt? → Täglicher Abgleich: Anzahl und Summe pro Tag gegen das Kernbanksystem. Bei Abweichung Alarm.
- Was machen Sie bei einer Storno-Buchung? → Sie ist eine eigene Transaktion mit Gegenbetrag. Ich lösche nichts. So stimmt die Historie.
- Batch oder Streaming hier? → Beides: Streaming für Betrug, Batch für Berichte. Gleiche Bronze-Daten, zwei Konsumenten.
- Wie testen Sie die Pipeline? → Unit-Tests für Transformationen, ein Test mit doppelten Events, und ein Abgleich gegen eine bekannte Referenz, wie unser Parity-Job bei MATCH.

## Don't say
- „Beträge als double.“ Bei Geld immer Decimal oder Rappen als Integer.
- Nicht ohne Datenschutz und Bankgeheimnis antworten. In der Schweiz ist das ein Kernthema.

## Words
- **CDC (Change Data Capture)** = Änderungen aus dem Datenbank-Log lesen
- **das Kernbanksystem** = core banking system
- **das Valutadatum** = Datum, an dem der Betrag wirksam wird
- **die Storno-Buchung** = Rückbuchung
- **pseudonymisieren** = Namen durch IDs ersetzen
