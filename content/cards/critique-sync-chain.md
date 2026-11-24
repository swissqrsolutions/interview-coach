---
id: critique-sync-chain
round: critique
tech: [microservices, rest, kafka]
tier: 1
project: DigiSanté (event-driven upload pipeline)
q: Eine Bestellung geht durch fünf Services. Was halten Sie von dieser Architektur?
en: An order goes through five services. What do you think of this architecture?
---
## 30s
**Die Architektur (als Text):**
```
Client → Order-Service → Payment-Service → Stock-Service → Shipping-Service → Mail-Service
          (jeder Aufruf: synchron REST, Timeout 30 s, kein Retry)
```
Das ist eine synchrone Kette. Das grösste Problem ist die Verfügbarkeit.
Die Verfügbarkeit multipliziert sich. Fünf Services mit je 99,9 % geben nur etwa 99,5 %.
Ist der Mail-Service langsam, wartet die ganze Kette. Der Client wartet bis zu 30 Sekunden.
Fix: Nur das Nötige synchron, zum Beispiel die Zahlung. Der Rest über Events.
Bei DigiSanté antwortet der Upload sofort nach dem Speichern. Der Scan läuft danach über Events.

## 90s
**Meine Liste mit Fix und Trade-off:**
1. **Verfügbarkeit:** Kette von fünf Abhängigkeiten. → Asynchron entkoppeln: Order speichert und publiziert `OrderPlaced`. Stock, Shipping und Mail reagieren. Kurze Timeouts und Circuit Breaker für die synchronen Teile. *Trade-off:* Eventual Consistency.
2. **Sicherheit:** Wird das Token des Nutzers durch alle Services gereicht? → Jeder Service prüft das Token selbst. Service-zu-Service mit eigener Identität.
3. **Konsistenz:** Zahlung klappt, Stock scheitert. Wer macht die Zahlung rückgängig? → Saga mit Kompensation, zum Beispiel `RefundPayment`. Outbox für sichere Events.
4. **Kopplung:** Jeder Service kennt den nächsten. Änderungen ziehen sich durch die Kette. → Events entkoppeln. Order muss Mail nicht kennen.
5. **Skalierung:** Threads warten 30 Sekunden. Unter Last sind alle Threads blockiert. → Kurze Timeouts, Bulkheads, asynchrone Verarbeitung.
6. **Monitoring:** Wo ist es langsam? → Distributed Tracing mit OpenTelemetry über alle Services. Bei DAZiT hatten wir OpenTelemetry-Tracing und Health Checks über alle Services.
7. **Kosten:** Mehr Infrastruktur für einen Broker. Dafür weniger Ausfälle und weniger Overprovisioning.

## 3min
**Die Rechnung laut gesagt:** „0,999 hoch 5 ist etwa 0,995. Das sind statt rund 9 Stunden etwa 44 Stunden Ausfall im Jahr.“

**Was bleibt synchron?** Was der Nutzer sofort wissen muss. Ist die Zahlung durch? Das kann synchron bleiben, mit Timeout von zum Beispiel 2 Sekunden und klarer Fehlermeldung. Lager, Versand und Mail dürfen später kommen.

**Ziel-Bild:**
```
Client → Order-Service (speichert, Zahlung synchron) → 202 Accepted
              │ Outbox → Event: OrderPlaced
              ├─> Stock-Service
              ├─> Shipping-Service
              └─> Mail-Service
```

**Retry-Gefahr:** Retries in einer Kette multiplizieren sich. Drei Ebenen mit je drei Versuchen sind 27 Aufrufe auf den letzten Service. Das macht einen kleinen Ausfall gross (Retry Storm). Regel: Retry nur an einer Stelle, mit Backoff und Jitter.

**Trade-off der Events:** Der Ablauf ist schwerer zu sehen. Darum Tracing, eine Korrelations-ID in jedem Event, und eine Status-Ansicht für die Bestellung.

**Aus meiner Praxis:** Bei DigiSanté antwortet die Upload-Funktion direkt nach dem Blob-Schreiben. Das Scan-Ergebnis von Defender kommt über Event Hub zu einer eigenen Funktion. Diese gibt die Datei frei oder löscht sie. So wartet der Nutzer nicht auf den Scan.

## Follow-ups
- Was ist ein Circuit Breaker? → Nach vielen Fehlern ruft er den Service eine Zeit lang nicht mehr auf. Er antwortet sofort mit Fehler oder Fallback. So erholt sich der Service.
- Orchestrierung oder Choreografie? → Choreografie: Services reagieren auf Events, wenig Kopplung. Orchestrierung: ein zentraler Ablauf, besser sichtbar. Bei vielen Schritten mit Kompensation nehme ich eher Orchestrierung.
- Wie weiss der Kunde, dass alles geklappt hat? → Status-Endpoint oder Push-Nachricht. Die Bestellung hat Status wie PENDING, CONFIRMED, SHIPPED.
- Warum nicht einfach den Timeout erhöhen? → Dann warten Threads noch länger. Das macht das Problem unter Last schlimmer.

## Don't say
- „Wir machen alles asynchron.“ Die Zahlung braucht oft eine sofortige Antwort.
- Nicht nur „Kafka einführen“ sagen. Konsistenz und Saga gehören dazu.

## Words
- **synchrone Kette** = chain of blocking calls
- **Kompensation** = undo step in a saga
- **Circuit Breaker** = stops calls to a failing service
- **Korrelations-ID** = ID that follows one request everywhere
- **Retry Storm** = retries that overload a service
