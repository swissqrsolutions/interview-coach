---
id: tech-camel
round: tech
tech: [camel]
tier: 4
proof: study
project: Flaconi (SOAP), DAZiT (Kafka), MATCH (Pipeline) als Vergleich
q: Was ist Apache Camel und wofür nutzt man es?
en: What is Apache Camel and what is it used for?
---
## 30s
Apache Camel ist ein Integrations-Framework für Java.
Es setzt die Enterprise Integration Patterns um, zum Beispiel Router, Splitter und Translator.
Man schreibt Routes: von einer Quelle, über Schritte, zu einem Ziel.
Camel hat hunderte Komponenten: Kafka, Dateien, SOAP, REST, JMS, Datenbanken.
Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich aus meinen Integrationen: SOAP mit JAX-WS bei Flaconi, Kafka bei DAZiT und die ZIP-zu-Iceberg-Pipeline bei MATCH.

## 90s
**Eine Route mit Java DSL:**
```java
@Component
public class ReportRoute extends RouteBuilder {
  @Override
  public void configure() {
    errorHandler(deadLetterChannel("kafka:reports.dlq").maximumRedeliveries(3));

    from("file:/data/inbox?include=.*\\.xml")
      .split(xpath("/reports/report"))
        .unmarshal().jaxb("com.example.reports")
        .choice()
          .when(simple("${body.type} == 'TRADE'")).to("kafka:reports.trades")
          .otherwise().to("kafka:reports.orders")
        .end()
      .end();
  }
}
```
- `from(...)`: Quelle, hier ein Ordner.
- `split`: eine Datei wird zu vielen Nachrichten.
- `choice`: Content-Based Router.
- `to(...)`: Ziel, hier Kafka.
- Begriffe: Exchange (die Nachricht mit Kontext), Endpoint (eine URI), Component (z. B. `kafka`).

## 3min
**Wann Camel sinnvoll ist:**
- Viele Systeme mit verschiedenen Protokollen: Datei, SOAP, JMS, Kafka, REST.
- Standard-Muster: Splitten, Routen, Transformieren, Retry, Dead Letter.
- Läuft mit Spring Boot oder Quarkus. Camel 4 ist die aktuelle Version mit Java 17+ und Jakarta.

**Wann nicht:**
- Nur eine einfache REST-zu-REST-Verbindung. Dann ist normaler Code klarer.
- Sehr große Datenmengen in Batch. Dann eher Spark, wie bei MATCH.

**Fallen:**
- Routes werden lang und schwer zu lesen. Kleine Routes mit `direct:` verbinden.
- Fehler gehen still verloren, wenn kein Error Handler definiert ist.
- Idempotenz: Camel hat einen Idempotent Consumer. Ohne ihn verarbeitet ein Retry die Datei doppelt.

**Mein Bezug:** Bei MATCH lösen wir genau diese Probleme im eigenen Code: Datei einlesen, entschlüsseln, XML parsen, aufteilen, idempotent schreiben. Camel würde solche Muster als fertige Bausteine anbieten.

## Follow-ups
- Was sind Enterprise Integration Patterns? → Ein Katalog von Mustern für Integration, aus dem Buch von Hohpe und Woolf.
- Wie testen Sie eine Route? → Mit `camel-test`, Mock-Endpoints und `AdviceWith`. So ersetzt man echte Ziele.
- Camel oder Spring Integration? → Beide setzen EIP um. Camel hat mehr Komponenten und eine kompakte DSL.
- Was ist ein Dead Letter Channel? → Nach allen Retries kommt die Nachricht an einen eigenen Ort. Ein Mensch prüft sie.
- Was ist Camel K? → Camel als Integrationen direkt auf Kubernetes.

## Don't say
- „Camel ist ein Message Broker.“ Nein. Es verbindet Systeme. Der Broker ist zum Beispiel Kafka.
- „Ich habe Camel-Routes gebaut.“ Nicht wahr. Ehrlich bleiben.

## Words
- **die Integration** = Systeme verbinden
- **die Route** = Weg einer Nachricht von Quelle zu Ziel
- **der Splitter** = teilt eine Nachricht in viele
- **umwandeln** = to transform
- **der Endpoint** = Anfang oder Ende einer Route
