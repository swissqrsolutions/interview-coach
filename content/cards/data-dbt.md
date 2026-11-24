---
id: data-dbt
round: data
tech: [dbt]
tier: 2
proof: study
q: Was ist dbt und wofür nutzt man es?
en: What is dbt and what is it used for?
---
## 30s
dbt ist ein Werkzeug für die Transformation in SQL, also das T in ELT.
Jedes Modell ist eine SELECT-Abfrage in einer Datei. dbt macht daraus Tabellen oder Views.
Mit `ref()` kennt dbt die Abhängigkeiten und baut alles in der richtigen Reihenfolge.
Dazu kommen Tests, Dokumentation und Lineage.
So arbeiten Daten-Teams wie Software-Teams: Git, Code-Review, CI.
Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich von MATCH: Medallion-Schichten, Parity-Tests und ein CI-Gate.
Soll ich ein Modell zeigen?

## 90s
**Ein Modell (`models/gold/daily_volume.sql`):**
```
{{ config(materialized='incremental', unique_key=['trade_date', 'product']) }}

SELECT trade_date, product, SUM(volume) AS volume
FROM {{ ref('silver_trades') }}
{% if is_incremental() %}
WHERE trade_date >= (SELECT MAX(trade_date) - INTERVAL '3 days' FROM {{ this }})
{% endif %}
GROUP BY trade_date, product
```
Laut gesagt: „Das Modell summiert das Volumen pro Tag und Produkt. Beim inkrementellen Lauf rechnet es die letzten drei Tage neu. Der unique_key sorgt dafür, dass Zeilen ersetzt werden, nicht doppelt.“ *(Die Datums-Syntax hängt von der Datenbank ab.)*

**Tests (`schema.yml`):**
```
models:
  - name: daily_volume
    columns:
      - name: product
        tests: [not_null]
      - name: trade_date
        tests: [not_null]
```

**Befehle:** `dbt run`, `dbt test`, `dbt build` (beides in Reihenfolge), `dbt docs generate`.

**Materialisierungen:** view, table, incremental, ephemeral. Dazu Snapshots für SCD2.

## 3min
**Stärken:**
- SQL, das Analysten schon kennen.
- Abhängigkeiten automatisch aus `ref()`. Lineage-Graph gratis.
- Tests direkt neben dem Modell.
- Läuft auf vielen Engines über Adapter: Postgres, Snowflake, Databricks, Spark, Trino, Dremio.

**Grenzen:**
- dbt ist vor allem für SQL-Transformationen. Python-Modelle gibt es nur auf einigen Plattformen. Ingestion und Parsing wie unser XML-Parsing gehören nicht hinein.
- Komplexe Logik in Jinja-Makros wird schwer lesbar.
- Für den Zeitplan braucht man trotzdem einen Orchestrator oder dbt Cloud.

**Wie würde dbt zu MATCH passen?** Gold-Statistiken als SQL-Modelle auf Iceberg. Die Parity-Prüfung als dbt-Tests. Die Ingestion bliebe in PySpark. *(Das ist eine Überlegung, kein Projekt-Fakt.)* Unsere sieben Rechner sind aber in PySpark portiert, nicht in SQL.

**Inkrementell und idempotent:** Mit `unique_key` macht dbt ein MERGE oder Delete+Insert. Ohne `unique_key` nur Append. Dann gibt ein Retry Duplikate. Das ist die häufigste Falle.

**Späte Daten:** Ein Fenster zurück neu rechnen, wie im Beispiel mit 3 Tagen.

## Follow-ups
- Was ist der Unterschied zwischen `ref()` und `source()`? → `source()` zeigt auf Rohdaten, die dbt nicht baut. `ref()` zeigt auf ein anderes dbt-Modell.
- Was ist ein dbt Snapshot? → Eine eingebaute SCD2-Logik. dbt fügt `dbt_valid_from` und `dbt_valid_to` hinzu.
- Was sind die vier Standard-Tests? → `unique`, `not_null`, `accepted_values`, `relationships`.
- Wie testen Sie dbt im CI? → `dbt build` gegen eine Test-Umgebung, nur für geänderte Modelle und ihre Nachfolger (`state:modified+`).
- dbt oder Spark? → dbt für SQL-Transformationen in einer Engine. Spark für Parsing, Python-Logik und sehr grosse Jobs. Oft beides.

## Don't say
- „dbt lädt die Daten aus den Quellen.“ Nein, dbt transformiert, was schon da ist.
- Nicht `incremental` ohne `unique_key` als idempotent verkaufen.

## Words
- **die Transformation** = Daten umwandeln
- **die Materialisierung** = wie das Ergebnis gespeichert wird
- **die Lineage** = woher die Daten kommen
- **inkrementell** = nur neue oder geänderte Daten verarbeiten
- **das Makro** = wiederverwendbarer Jinja-Code
