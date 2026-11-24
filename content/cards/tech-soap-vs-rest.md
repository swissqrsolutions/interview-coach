---
id: tech-soap-vs-rest
round: tech
tech: [soap, rest]
tier: 2
project: Flaconi, BIT NABODAT
q: Was ist der Unterschied zwischen SOAP und REST? Wann nehmen Sie was?
en: What is the difference between SOAP and REST? When do you use which?
---
## 30s
SOAP ist ein Protokoll mit XML und einem festen Vertrag, der WSDL.
REST ist ein Architekturstil mit Ressourcen, HTTP-Methoden und meist JSON.
SOAP ist streng und hat Standards für Sicherheit. REST ist leichter und flexibler.
Bei Flaconi habe ich SOAP-Consumer mit JAX-WS zu Legacy-Backends gebaut. Gleichzeitig haben wir REST-Services mit Swagger angeboten.
Heute baue ich neue APIs mit REST und OpenAPI. SOAP nutze ich, wenn ein bestehendes System es verlangt.
Soll ich die Unterschiede genauer zeigen?

## 90s
| | SOAP | REST |
|---|---|---|
| Format | nur XML (Envelope) | meist JSON, auch XML |
| Vertrag | WSDL + XSD, Pflicht | OpenAPI, optional |
| Transport | meist HTTP POST | HTTP mit GET, POST, PUT, DELETE |
| Fehler | SOAP Fault | HTTP-Statuscodes |
| Sicherheit | WS-Security auf Nachrichten-Ebene | TLS, OAuth2, JWT |
| Caching | schwer | einfach mit GET |

**SOAP-Nachricht:**
```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header/>
  <soap:Body>
    <getProduct><sku>12345</sku></getProduct>
  </soap:Body>
</soap:Envelope>
```

## 3min
**Wann SOAP:**
- Das Partnersystem bietet nur SOAP an. Das ist bei Banken, Versicherungen und Behörden oft so.
- Strenge Verträge und Validierung mit XSD sind gewünscht.
- WS-Security: Signatur und Verschlüsselung der Nachricht selbst, nicht nur der Verbindung.

**Wann REST:**
- Neue APIs, Web- und Mobile-Clients.
- Caching, einfache Tools, viele Entwickler kennen es.

**Trade-offs:**
- SOAP: großer Overhead, schwer zu debuggen, Tools nötig (SoapUI).
- REST: kein Vertrag erzwungen. Ohne OpenAPI und Versionierung laufen Client und Server auseinander.

**Integration in der Praxis:** Ein SOAP-Altsystem kapsle ich hinter einem Adapter. Die eigenen Services sprechen REST oder Events. So bleibt SOAP an einer Stelle.
*(Prüfen: War das bei Flaconi so gebaut? Welche Legacy-Backends waren es?)*

**Fehler, die ich kenne:** Timeouts fehlen beim SOAP-Client. Dann hängt ein Thread, wenn das Altsystem langsam ist. Immer Connect- und Read-Timeout setzen.

## Follow-ups
- Ist REST immer JSON? → Nein. REST ist ein Stil. JSON ist nur das häufigste Format.
- Was ist ein SOAP Fault? → Die Fehlerstruktur in SOAP, mit Code und Text. Meist mit HTTP 500.
- Was ist HATEOAS? → Die Antwort enthält Links zu nächsten Aktionen. In der Praxis selten voll umgesetzt.
- Was ist mit gRPC? → Binär, schnell, mit Protobuf-Vertrag. Gut zwischen Services. Bei CARIAD haben wir gRPC in der Pipeline genutzt.
- Wie versionieren Sie eine REST-API? → Meist im Pfad, zum Beispiel `/v1/`. Alte Version eine Zeit lang parallel betreiben.

## Don't say
- „SOAP ist veraltet und unbrauchbar.“ Viele Behörden- und Bank-Systeme nutzen es stabil.
- „REST ist ein Protokoll.“ Es ist ein Architekturstil.

## Words
- **der Vertrag** = contract
- **der Umschlag** = envelope
- **kapseln** = to encapsulate
- **das Altsystem** = legacy system
- **der Architekturstil** = architectural style
