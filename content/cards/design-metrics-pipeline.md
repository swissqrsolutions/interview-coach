---
id: design-metrics-pipeline
round: design
tech: [observability, kafka]
tier: 2
proof: study
project: ElCom MATCH (Grafana/Prometheus), Flaconi (Go exporter)
q: Entwerfen Sie ein System, das Metriken von vielen Servern sammelt und in Dashboards zeigt.
en: Design a system that collects metrics from many servers and shows them in dashboards.
---
## 30s
Zuerst frage ich: Wie viele Server? Wie viele Metriken pro Server? Wie oft? Wie lange speichern?
Ich nehme an: 10 000 Server, je 1000 Zeitreihen, alle 10 Sekunden. Das sind 1 Million Werte pro Sekunde.
Mein Plan: Agents sammeln. Ein Puffer wie Kafka nimmt auf. Eine Zeitreihen-Datenbank speichert.
Alte Daten werden verdichtet: Minuten statt Sekunden.
Grafana zeigt die Dashboards. Alerts laufen auf denselben Daten.
Bei MATCH überwachen wir mit Prometheus und Grafana Job-Dauer, Backlog und Pod-Restarts. Bei Flaconi habe ich einen SQL-Exporter in Go für Prometheus geschrieben.
Soll ich die Datenmenge durchrechnen?

## 90s
**Zahlen:**
- 10 000 × 1000 = 10 Millionen Zeitreihen.
- Alle 10 Sekunden = 1 Million Werte pro Sekunde.
- Ein Wert komprimiert etwa 2 Bytes (Prometheus schafft etwa 1–2 Bytes pro Sample). Das sind etwa 170 GB pro Tag.
- 15 Tage roh = etwa 2,5 TB. Danach nur noch 5-Minuten-Werte.

**API:**
```
POST /api/v1/write      (Batch von Samples, komprimiert)
GET  /api/v1/query_range?query=...&start=...&end=...&step=60s
```

**Datenmodell (Prinzip):**
```
series(series_id PK, metric, labels)        -- labels: {host="a", job="spark"}
samples(series_id, ts, value)               -- PK (series_id, ts)
rollup_5m(series_id, bucket, min, max, avg, count)
```

**SQL laut gesagt (zum Beispiel mit TimescaleDB oder für die Rollups):**
```
SELECT date_trunc('minute', ts) AS minute, avg(value)
FROM samples
WHERE series_id = :s AND ts >= now() - interval '1 hour'
GROUP BY minute ORDER BY minute;
```
„Ich hole eine Stunde und mache einen Wert pro Minute.“

```
INSERT INTO rollup_5m(series_id, bucket, min, max, avg, count)
SELECT series_id, to_timestamp(floor(extract(epoch FROM ts) / 300) * 300),
       min(value), max(value), avg(value), count(*)
FROM samples WHERE ts >= :from AND ts < :to
GROUP BY 1, 2;
```
„Ich verdichte fünf Minuten zu einer Zeile. Der Job ersetzt ein Zeitfenster, so ist ein Retry sicher.“

**Ablauf:** Agent auf dem Server → Gateway (Auth, Limits) → Kafka (Key = series_id) → Ingest-Worker → Zeitreihen-DB → Grafana und Alert-Regeln.

## 3min
**Push oder Pull?** Prometheus holt die Werte selbst (Pull). Gut: Man sieht sofort, wenn ein Ziel down ist. Bei sehr vielen Zielen oder kurzen Jobs ist Push besser. Dann sammelt ein Agent und schickt per remote write.

**Das grösste Risiko: Kardinalität.** Jede Kombination von Labels ist eine eigene Zeitreihe. Ein Label wie `user_id` macht aus 1 Zeitreihe Millionen. Darum: keine IDs als Labels, Limits pro Team.

**Speicher:** Spezielle Zeitreihen-DBs komprimieren stark (Delta- und Gorilla-Kodierung). Langzeit in Object Storage, zum Beispiel mit Thanos oder Mimir.

**Skalierung:** Kafka puffert Spitzen. Ingest-Worker horizontal. Die DB wird nach Zeitreihen geshardet. Abfragen über lange Zeiträume lesen Rollups, nicht Rohdaten.

**Fehler:**
- Die DB ist kurz down: Kafka hält die Daten, nichts geht verloren.
- Das Monitoring selbst fällt aus: Ein zweites, kleines System überwacht das Monitoring (Dead Man's Switch: ein Alert, der immer feuert; fehlt er, stimmt etwas nicht).
- Zu viele Alerts: Alerts nur auf Symptome, die Nutzer spüren. Bei MATCH alarmieren wir zum Beispiel auf den Backlog von Pending-Meldungen.

**Sicherheit:** Agents authentifizieren sich mit Token oder mTLS. Keine Personendaten in Labels. Mandanten trennen.

**Kosten:** Speicher und Kardinalität. Kurze Aufbewahrung für Rohdaten, Rollups für lange Zeit.

## Follow-ups
- Was ist der Unterschied zwischen Metriken, Logs und Traces? → Metriken sind Zahlen über die Zeit. Logs sind einzelne Ereignisse. Traces zeigen einen Request über viele Services. Bei DAZiT hatten wir OpenTelemetry-Tracing über alle Services.
- Counter oder Gauge? → Ein Counter steigt nur, zum Beispiel Anzahl Requests. Ein Gauge geht hoch und runter, zum Beispiel Speicher. Für Counter nimmt man `rate()`.
- Wie rechnen Sie Perzentile wie p99? → Mit Histogrammen. Man kann Durchschnitte nicht zu p99 zusammenrechnen.
- Was messen Sie für einen Batch-Job? → Dauer, Erfolg oder Fehler, Anzahl Zeilen, und das Alter der letzten erfolgreichen Ausführung.
- Warum nicht alles in Elasticsearch? → Geht, aber für Zahlen über die Zeit ist eine Zeitreihen-DB viel kompakter und schneller.

## Don't say
- „Wir loggen alles und zählen später.“ Bei 1 Million Werten pro Sekunde ist das zu teuer.
- Nicht `user_id` oder `request_id` als Label vorschlagen.

## Words
- **die Zeitreihe** = time series
- **verdichten (Rollup / Downsampling)** = viele Werte zu einem Wert zusammenfassen
- **die Kardinalität** = Anzahl verschiedener Label-Kombinationen
- **die Aufbewahrung (Retention)** = wie lange Daten bleiben
- **das Perzentil (p99)** = 99 % der Werte sind kleiner
