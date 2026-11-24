---
id: tech-java-virtual-threads
round: tech
tech: [java]
tier: 2
project: BIT DAZiT
q: Was sind Virtual Threads in Java 21? Wann nutzen Sie sie?
en: What are virtual threads in Java 21? When do you use them?
---
## 30s
Virtual Threads sind leichte Threads. Die JVM verwaltet sie, nicht das Betriebssystem.
Man kann Millionen davon starten.
Wenn ein Virtual Thread auf I/O wartet, gibt er den echten Thread frei.
So schreibe ich einfachen, blockierenden Code und bekomme trotzdem hohe Parallelität.
Sie sind seit Java 21 final. Bei DAZiT haben wir Java 21 benutzt.
*(Prüfen: Haben Sie Virtual Threads bei DAZiT wirklich aktiviert? Sonst sagen: „Ich kenne sie aus Java 21 und habe sie getestet.“)*
Soll ich erklären, wann sie nichts bringen?

## 90s
**Wie es funktioniert:**
1. Ein Virtual Thread läuft auf einem Carrier Thread. Das ist ein normaler Plattform-Thread aus einem ForkJoinPool.
2. Der Code ruft eine blockierende Methode auf, zum Beispiel JDBC oder HTTP.
3. Die JVM parkt den Virtual Thread. Sein Stack geht in den Heap.
4. Der Carrier Thread nimmt einen anderen Virtual Thread.
5. Die Antwort kommt. Der Virtual Thread läuft auf irgendeinem Carrier weiter.

**Code:**
```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (var id : ids) executor.submit(() -> client.fetch(id));
}
Thread.ofVirtual().start(() -> handle(request));
```

**Spring Boot 3.2+:**
```yaml
spring.threads.virtual.enabled: true   # Tomcat und @Async nutzen Virtual Threads
```

## 3min
**Wann sie helfen:** Viele gleichzeitige Requests, die meist warten: DB, REST, Kafka. Typische Microservices.

**Wann sie nicht helfen:**
- CPU-lastige Arbeit, zum Beispiel Berechnungen. Die CPU-Kerne bleiben die Grenze.
- Code ist schon reaktiv (WebFlux). Dann ist der Gewinn klein.

**Fallen in Java 21:**
- **Pinning:** In einem `synchronized`-Block mit blockierendem I/O bleibt der Carrier Thread blockiert. Lösung in Java 21: `ReentrantLock` statt `synchronized`. Ab Java 24 ist das Problem grösstenteils gelöst.
- **Keine Pools:** Virtual Threads nie poolen. Für jede Aufgabe einen neuen.
- **Downstream schützen:** Mit 10 000 Threads hat der DB-Pool trotzdem nur 20 Verbindungen. Ich begrenze mit einem `Semaphore` oder der Pool-Grösse.
- **ThreadLocal:** Mit Millionen Threads kann ThreadLocal viel Speicher kosten.

**Wie ich Pinning sehe:** JFR-Event `jdk.VirtualThreadPinned`. In Java 21 auch `-Djdk.tracePinnedThreads=full`.

**Gegenüber reaktiv:** Virtual Threads geben fast denselben Durchsatz wie WebFlux, aber mit normalem Code. Stack Traces und Debugging bleiben einfach.

## Follow-ups
- Sind Virtual Threads schneller? → Nein, nicht pro Aufgabe. Sie geben mehr Durchsatz, weil mehr Aufgaben gleichzeitig warten können.
- Was ist Pinning? → Der Virtual Thread kann sich nicht vom Carrier lösen, zum Beispiel in `synchronized` mit I/O. Dann blockiert der echte Thread.
- Brauche ich noch WebFlux? → Für normale Request-Response-Services meist nicht. Für Streaming und Backpressure kann WebFlux noch sinnvoll sein.
- Was ist Structured Concurrency? → Ein API, um Unteraufgaben als Gruppe zu starten und zu beenden. In Java 21 ist es noch Preview.
- Wie viele Carrier Threads gibt es? → Standard: so viele wie CPU-Kerne.

## Don't say
- „Virtual Threads machen alles schneller.“ Nur bei Warten auf I/O.
- „Ich mache einen Pool mit Virtual Threads.“ Pooling ist hier falsch.

## Words
- **leichtgewichtig** = lightweight
- **der Carrier Thread** = echter OS-Thread unter dem Virtual Thread
- **parken** = pausieren, bis die Antwort kommt
- **der Durchsatz** = throughput
- **blockierend** = wartet, bis die Antwort da ist
