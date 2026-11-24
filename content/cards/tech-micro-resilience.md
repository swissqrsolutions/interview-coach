---
id: tech-micro-resilience
round: tech
tech: [microservices]
tier: 1
project: BIT DAZiT
q: Wie machen Sie Microservices robust? Circuit Breaker, Retry, Timeout, Bulkhead?
en: How do you make microservices resilient? Circuit breaker, retry, timeout, bulkhead?
---
## 30s
Im Netzwerk fällt immer etwas aus. Ein Service muss damit umgehen.
Die wichtigste Regel: Jeder Aufruf hat einen Timeout.
Retry hilft bei kurzen Fehlern, aber nur mit Backoff und nur bei idempotenten Aufrufen.
Ein Circuit Breaker stoppt Aufrufe an einen kaputten Service. So bleibt mein Service stabil.
Ein Bulkhead trennt Ressourcen, damit ein langsamer Partner nicht alles blockiert.
Bei DAZiT hatten wir Health Checks und OpenTelemetry-Tracing über alle Services. *(Prüfen: Haben Sie dort Resilience4j benutzt?)*
Soll ich den Circuit Breaker genauer erklären?

## 90s
**Timeout:** Ohne Timeout wartet ein Thread ewig. Bei Last sind alle Threads blockiert. Ich setze Connect- und Read-Timeout an jedem HTTP-Client.

**Retry:** 2–3 Versuche mit exponentiellem Backoff und Jitter (zufällige Wartezeit). Nur bei 503, Timeouts, Verbindungsfehlern. Nicht bei 400 oder 404.

**Circuit Breaker (drei Zustände):**
1. **Closed:** normal. Er zählt Fehler.
2. **Open:** Fehlerrate über der Grenze, zum Beispiel 50 %. Aufrufe schlagen sofort fehl. Kein Warten.
3. **Half-Open:** Nach einer Wartezeit lässt er wenige Test-Aufrufe durch. Gehen sie gut → Closed. Sonst → wieder Open.

**Bulkhead:** Ein eigenes Limit pro Partner, zum Beispiel maximal 10 parallele Aufrufe. Ist der Partner langsam, sind nur diese 10 blockiert.

**Resilience4j mit Spring Boot 3:**
```java
@CircuitBreaker(name = "taxRegistry", fallbackMethod = "cached")
@Retry(name = "taxRegistry")
public TaxInfo load(String id) { return client.get(id); }
```
```yaml
resilience4j.circuitbreaker.instances.taxRegistry:
  failure-rate-threshold: 50
  wait-duration-in-open-state: 30s
```

## 3min
**Gefahren:**
- **Retry Storm:** Jede Schicht macht 3 Retries. Bei 3 Schichten sind das 27 Aufrufe auf einen Service, der schon Probleme hat. Darum Retry nur an einer Stelle.
- **Retry bei nicht-idempotenten Aufrufen:** Ein POST wird doppelt ausgeführt. Nur mit Idempotency Key.
- **Timeouts passen nicht zusammen:** Mein Timeout ist 30 s, aber mein Aufrufer wartet nur 10 s. Dann arbeite ich umsonst. Timeouts von aussen nach innen kleiner machen.
- **Fallback versteckt Fehler:** Ein Fallback mit alten Daten ist gut. Aber ich muss messen, wie oft er greift.

**Monitoring:** Zustand der Circuit Breaker als Metrik in Prometheus und Grafana. Alarm, wenn ein Breaker offen ist. Tracing zeigt, wo die Zeit verloren geht.

**Asynchron als Resilienz:** Wenn der Aufrufer keine sofortige Antwort braucht, ist ein Event über Kafka robuster. Der Empfänger kann ausfallen und später aufholen. Bei DAZiT haben wir Fachsysteme über Kafka integriert.

**Readiness vs Liveness:** Ein Partner ist down. Meine Liveness Probe darf dann nicht fehlschlagen. Sonst startet Kubernetes alle meine Pods neu, und das hilft nicht.

## Follow-ups
- Was ist Jitter? → Eine zufällige Zusatzzeit beim Backoff. So machen nicht alle Clients gleichzeitig ihren Retry.
- Was gibt der Fallback zurück? → Gecachte Daten, einen Standardwert oder eine klare Fehlermeldung. Abhängig von der Fachlichkeit.
- Hystrix oder Resilience4j? → Hystrix ist seit Jahren im Wartungsmodus. Heute nehme ich Resilience4j.
- Was ist ein Rate Limiter? → Er begrenzt, wie viele Aufrufe pro Zeit erlaubt sind. Er schützt einen Partner oder meinen Service vor zu viel Last.
- Wo setzen Sie den Circuit Breaker? → Beim Aufrufer, um jeden externen Partner einzeln.

## Don't say
- „Wir machen einfach Retry, bis es klappt.“ Das kann einen Ausfall verschlimmern.
- „Ein Circuit Breaker repariert den Service.“ Er schützt nur den Aufrufer.

## Words
- **robust / widerstandsfähig** = resilient
- **der Ausfall** = outage, failure
- **die Wartezeit (Backoff)** = Pause vor dem nächsten Versuch
- **die Fehlerrate** = error rate
- **verschlimmern** = to make worse
