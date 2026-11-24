---
id: tech-micro-communication
round: tech
tech: [microservices]
tier: 1
project: BIT DAZiT, CARIAD, DigiSanté
q: Wie kommunizieren Microservices? Synchron oder asynchron? Was machen API Gateway und Service Discovery?
en: How do microservices communicate? Sync or async? What do an API gateway and service discovery do?
---
## 30s
Synchron heisst: Ich rufe auf und warte auf die Antwort. Zum Beispiel REST oder gRPC.
Asynchron heisst: Ich sende ein Event oder eine Nachricht und warte nicht. Zum Beispiel Kafka.
Synchron ist einfach, aber es koppelt die Services zeitlich.
Asynchron ist robuster, aber schwerer zu debuggen.
Ich habe beides genutzt: Kafka bei DAZiT, gRPC mit Protobuf bei CARIAD, Event Hub bei DigiSanté.
Soll ich erklären, wann ich was nehme?

## 90s
**Synchron (REST, gRPC):**
- Ich brauche die Antwort sofort, zum Beispiel für eine Anzeige im UI.
- REST: einfach, überall lesbar, gut für externe APIs.
- gRPC: binär mit Protobuf, schnell, strenger Vertrag, Streaming. Gut zwischen internen Services. Bei CARIAD in der Pipeline.

**Asynchron (Kafka, Event Hub, Queues):**
- Der Aufrufer braucht keine sofortige Antwort.
- Der Empfänger darf kurz ausfallen. Die Nachricht wartet.
- Ein Event kann viele Empfänger haben.
- Bei DigiSanté: Der Upload antwortet direkt nach dem Blob-Write. Das Scan-Ergebnis von Defender verarbeitet eine eigene Event-Hub-Function. Dann wird die Datei freigegeben oder gelöscht.

**API Gateway:** Ein Eingang für alle Clients. Routing, Authentifizierung, Rate Limiting, TLS. Zum Beispiel Spring Cloud Gateway oder Azure API Management.

**Service Discovery:** Wie findet Service A Service B? In Kubernetes über DNS: `http://payment-service`. Ohne Kubernetes über eine Registry wie Eureka oder Consul.

## 3min
**Trade-offs synchron:**
- Ketten: A ruft B, B ruft C. Die Verfügbarkeit multipliziert sich: 99,9 % × 99,9 % × 99,9 % ≈ 99,7 %.
- Die Latenz addiert sich.
- Darum: Timeouts, Circuit Breaker, kurze Ketten.

**Trade-offs asynchron:**
- Eventual Consistency: Die Daten sind kurz nicht überall gleich. Das UI muss das zeigen, zum Beispiel mit "in Bearbeitung".
- Doppelte Nachrichten (at-least-once) → idempotente Consumer.
- Debugging über Services → Tracing mit Correlation-ID. Bei DAZiT war OpenTelemetry über alle Services aktiv.
- Schema-Änderungen an Events müssen kompatibel sein.

**Events vs Commands:**
- Event: "DeclarationSubmitted". Ein Fakt in der Vergangenheit. Der Sender kennt die Empfänger nicht.
- Command: "CalculateTax". Ein Auftrag an genau einen Empfänger.

**API Gateway – Fallen:** Keine Fachlogik im Gateway. Sonst wird es ein neuer Monolith. Es ist ein Single Point of Failure, also mehrere Instanzen.

**BFF (Backend for Frontend):** Ein eigenes kleines Backend pro Frontend. Es sammelt Daten aus mehreren Services für eine Seite. Gut für Angular-Apps mit vielen Daten.

## Follow-ups
- REST oder gRPC? → REST für externe und Browser-Clients. gRPC für schnelle interne Aufrufe mit strengem Vertrag.
- Was ist Eventual Consistency? → Nach einer Änderung sind alle Kopien nicht sofort gleich, aber nach kurzer Zeit.
- Braucht man in Kubernetes Eureka? → Meist nicht. Kubernetes Services und DNS machen Discovery und Load Balancing.
- Was ist eine Correlation-ID? → Eine ID, die mit jedem Aufruf und Event mitgeht. So findet man alle Logs zu einem Request.
- Was ist ein Service Mesh? → Eine Infrastruktur-Schicht, zum Beispiel Istio oder Linkerd. Sie macht mTLS, Retries und Metriken ohne Code-Änderung.

## Don't say
- „Asynchron ist immer besser.“ Für eine Anzeige im UI brauche ich oft eine sofortige Antwort.
- „Das Gateway macht die Geschäftslogik.“ Nein, nur Querschnittsthemen.

## Words
- **zeitlich gekoppelt** = beide müssen gleichzeitig laufen
- **der Empfänger** = receiver
- **die Verfügbarkeit** = availability
- **der Auftrag (Command)** = command
- **das Querschnittsthema** = cross-cutting concern
