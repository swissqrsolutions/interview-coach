---
id: critique-no-monitoring
round: critique
tech: [observability, k8s, microservices]
tier: 1
project: ElCom MATCH (Grafana/Prometheus), DAZiT (OpenTelemetry)
q: Wir erfahren von Ausfällen meistens durch Kunden. Was fehlt in unserer Architektur?
en: We usually learn about outages from customers. What is missing in our architecture?
---
## 30s
**Die Architektur (als Text):**
```
6 Services auf Kubernetes
Logs: nur stdout, nach dem Pod-Neustart weg
Keine Metriken, keine Alarme, kein Tracing
Health Check: keiner, Kubernetes sieht nur "Prozess läuft"
```
Es fehlt Observability: Metriken, zentrale Logs, Tracing und Alarme.
Ohne das ist die Zeit bis zur Erkennung lang. Der Kunde ist das Monitoring.
Ohne Health Checks schickt Kubernetes Verkehr an Pods, die hängen.
Fix: Prometheus und Grafana für Metriken, zentrale Logs, OpenTelemetry für Traces, Alarme auf Symptome.
Bei MATCH beobachten Grafana und Prometheus Job-Dauer, wartende Nachrichten und Pod-Restarts.

## 90s
**Meine Liste mit Fix und Trade-off:**
1. **Verfügbarkeit:** Keine Probes. → Readiness Probe: Pod bekommt erst Verkehr, wenn er bereit ist. Liveness Probe: Neustart, wenn er hängt. In Spring Boot über Actuator `/actuator/health/readiness` und `/liveness`.
2. **Sicherheit:** Keine Logs = kein Nachweis bei einem Angriff. → Zentrale, unveränderliche Logs. Audit-Logs getrennt. Keine Personendaten in normalen Logs.
3. **Konsistenz:** Fehler in der Verarbeitung bleiben unsichtbar. → Fachliche Metriken: Eingang gegen Ausgang, zum Beispiel 1000 Nachrichten rein, 1000 verarbeitet.
4. **Kopplung:** Wo im Ablauf ist der Fehler? → Tracing mit einer Trace-ID über alle Services.
5. **Skalierung:** Ohne Metriken keine Autoskalierung und keine Kapazitätsplanung. → CPU, Speicher, Latenz, Queue-Länge messen.
6. **Monitoring:** Das ist hier der Hauptpunkt. → Alarme auf das, was Nutzer spüren: Fehlerrate, Latenz, Rückstau. Nicht auf jede CPU-Spitze.
7. **Kosten:** Log-Speicher kann teuer werden. → Log-Level bewusst, Aufbewahrung begrenzen, Metriken statt Logs für Zählungen.

## 3min
**Die drei Säulen:**
- **Metriken:** Zahlen über Zeit. Billig, gut für Alarme. Prometheus, Grafana.
- **Logs:** Details zu einem Ereignis. Strukturiert als JSON, mit Trace-ID.
- **Traces:** Der Weg eines Requests durch alle Services. OpenTelemetry.

**Was ich zuerst messe (RED pro Service):** Rate (Requests pro Sekunde), Errors (Fehlerrate), Duration (Latenz, p95 und p99). Für Batch- und Queue-Systeme: Rückstau, Alter der ältesten Nachricht, Job-Dauer.

**Gute Alarme:**
- Auf Symptome, nicht auf Ursachen. „Fehlerrate über 2 % seit 5 Minuten“ statt „CPU 80 %“.
- Jeder Alarm hat eine Handlung, ein Runbook. Sonst ignoriert das Team ihn.
- SLOs definieren, zum Beispiel 99,5 % erfolgreiche Requests pro Monat.

**Aus meiner Praxis:**
- **MATCH:** Grafana und Prometheus für Job-Dauer, den Rückstau wartender Nachrichten und Pod-Restarts.
- **DAZiT:** OpenTelemetry-Tracing und Health Checks über alle Services. *(Prüfen: Welches Backend für die Traces?)*
- **CARIAD:** Grafana-Dashboards für das Monitoring der Pipeline.
- **Flaconi:** Ein SQL-Exporter in Go für Betriebsmetriken mit Prometheus und Grafana.

**Trade-off:** Zu viele Dashboards und Alarme sind auch schlecht. Alarm-Müdigkeit führt dazu, dass echte Alarme übersehen werden. Wenige, gute Alarme.

## Follow-ups
- Was ist der Unterschied zwischen Liveness und Readiness? → Readiness: Darf der Pod Verkehr bekommen? Liveness: Muss der Pod neu starten? Eine falsche Liveness Probe kann Neustart-Schleifen machen.
- Soll die Liveness Probe die Datenbank prüfen? → Nein. Fällt die DB aus, starten sonst alle Pods neu, und das hilft nicht. Die DB gehört höchstens in die Readiness.
- Was ist p99? → 99 % der Requests sind schneller als dieser Wert. Der Durchschnitt versteckt langsame Ausreisser.
- Was ist hohe Kardinalität? → Labels mit sehr vielen Werten, zum Beispiel User-ID. Das macht Prometheus langsam und teuer.
- Was ist ein SLO? → Ein Ziel für die Zuverlässigkeit, zum Beispiel 99,5 %. Das Fehlerbudget ist der Rest.

## Don't say
- „Wir loggen alles auf DEBUG, dann sehen wir alles.“ Teuer und unübersichtlich.
- „Wir alarmieren bei jeder Exception.“ Das gibt Alarm-Müdigkeit.

## Words
- **Observability** = seeing inside a running system
- **Alarm** = alert
- **Rückstau** = backlog
- **Runbook** = written steps for an alert
- **Alarm-Müdigkeit** = alert fatigue
