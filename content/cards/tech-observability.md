---
id: tech-observability
round: tech
tech: [observability]
tier: 2
project: MATCH (Prometheus/Grafana), DAZiT (OpenTelemetry), DigiSanté (Azure Monitor)
q: Wie machen Sie ein System beobachtbar? Logs, Metriken, Traces – was nehmen Sie wofür?
en: How do you make a system observable? Logs, metrics, traces – what do you use for what?
---
## 30s
Es gibt drei Signale. Metriken sagen: Etwas ist falsch. Traces sagen: wo. Logs sagen: warum.
Prometheus sammelt Metriken, Grafana zeigt sie und schickt Alarme.
OpenTelemetry ist der Standard, um Traces, Metriken und Logs zu erzeugen.
Bei MATCH beobachten wir mit Prometheus und Grafana Job-Dauern, den Rückstau an Pending-Nachrichten und Pod-Neustarts.
Bei DAZiT hatten alle Services OpenTelemetry-Tracing und Health Checks.
Soll ich zeigen, wie ich Alarme baue?

## 90s
**Metriken (Prometheus):**
- Prometheus holt die Metriken per Pull von `/metrics` oder `/actuator/prometheus`.
- Typen: Counter (steigt nur), Gauge (rauf und runter), Histogram (Verteilung, zum Beispiel Latenz).
- Beispiel-Abfrage, Fehlerquote pro Service:
```
sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) by (service)
/
sum(rate(http_server_requests_seconds_count[5m])) by (service)
```

**Traces (OpenTelemetry):**
- Ein Trace ist ein Request durch viele Services. Jeder Schritt ist ein Span.
- Die Trace-ID geht im Header `traceparent` (W3C) von Service zu Service.
- Ein OpenTelemetry Collector sammelt die Daten und schickt sie an ein Backend, zum Beispiel Jaeger, Tempo oder Azure Monitor.

**Logs:**
- Strukturiert als JSON, mit Trace-ID in jeder Zeile.
- So komme ich vom Trace zum passenden Log.

Laut gesagt: „Ich alarmiere auf Symptome, die der Nutzer spürt: Fehlerquote, Latenz, Rückstau. Nicht auf jede CPU-Spitze.“

## 3min
**Bei MATCH konkret:**
- **Job-Dauern:** Ein Spark-Job, der plötzlich doppelt so lange läuft, ist ein frühes Warnzeichen.
- **Rückstau an Pending-Nachrichten:** Die wichtigste fachliche Metrik. Wächst er, kommt die Verarbeitung nicht nach.
- **Pod-Neustarts:** CrashLoops und OOMKills sieht man hier zuerst.
- Dazu die Stale-Job-Recovery: Nachrichten zu lange in Processing werden zurück auf Pending gesetzt.

**Methoden für gute Dashboards:**
- **RED** für Services: Rate, Errors, Duration.
- **USE** für Ressourcen: Utilization, Saturation, Errors.
- Für Batch: Dauer, Erfolg oder Fehler pro Lauf, Alter der ältesten offenen Nachricht.

**Alarme, die nicht nerven:**
- Wenige Alarme, jeder mit einer klaren Aktion.
- Schwellen über einen Zeitraum (`for: 10m`), nicht auf einzelne Spitzen.
- *(Prüfen: welche Alarme bei MATCH wirklich konfiguriert sind.)*

**Audit ist nicht Logging (DigiSanté):** Wir haben eine gemeinsame Spring-Boot-Bibliothek für DSG-konformes Audit-Logging gebaut. Sie schreibt asynchron nach Azure Monitor, über einen privaten Data Collection Endpoint mit Managed Identity. Audit-Logs sind ein fachlicher Nachweis. Technische Logs sind für Entwickler.

**Frühere Erfahrung:** Bei Flaconi habe ich in Go einen SQL-Exporter für betriebliche Metriken gebaut, mit Prometheus und Grafana. Bei CARIAD gab es Grafana-Dashboards für das Pipeline-Monitoring.

**Kosten:** Hohe Kardinalität tötet Prometheus. Keine User-ID oder Request-ID als Label.

## Follow-ups
- Was ist Kardinalität? → Die Anzahl verschiedener Label-Kombinationen. Jede Kombination ist eine eigene Zeitreihe.
- Pull oder Push? → Prometheus zieht. Für kurze Batch-Jobs gibt es das Pushgateway oder man schickt über OpenTelemetry.
- Was ist ein SLO? → Ein Ziel, zum Beispiel 99,9 % der Requests unter 300 ms. Alarme richten sich nach dem Fehlerbudget.
- Wie finden Sie einen langsamen Request in zehn Services? → Mit einem Trace. Der Span mit der längsten Dauer zeigt den Engpass.
- Sampling – was ist das? → Nur ein Teil der Traces wird gespeichert. Tail Sampling behält gezielt Fehler und langsame Requests.

## Don't say
- „Wir schauen in die Logs, wenn ein Kunde anruft.“ Alarme sollen vor dem Kunden kommen.
- „Monitoring ist Aufgabe vom Betrieb.“ Die Metriken baut das Entwicklungsteam.

## Words
- **beobachtbar** = observable
- **Rückstau** = backlog
- **Schwelle** = threshold
- **Engpass** = bottleneck
- **Kardinalität** = cardinality
