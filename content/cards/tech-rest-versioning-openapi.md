---
id: tech-rest-versioning-openapi
round: tech
tech: [rest]
tier: 2
project: BIT DAZiT, CARIAD, Flaconi
q: Wie versionieren Sie eine REST-API? Und wie nutzen Sie OpenAPI?
en: How do you version a REST API? And how do you use OpenAPI?
---
## 30s
Zuerst versuche ich, keine neue Version zu brauchen.
Neue optionale Felder sind keine Breaking Changes. Clients ignorieren unbekannte Felder.
Erst bei einem echten Breaking Change kommt eine neue Version, meist im Pfad: `/v2/...`.
OpenAPI ist der Vertrag der API. Daraus entstehen Doku, Client-Code und Tests.
Bei DAZiT haben mehr als 5 Teams unsere gemeinsamen Services genutzt. Stabile Verträge waren dort sehr wichtig.
Swagger habe ich auch bei Flaconi und CARIAD benutzt.
Soll ich erklären, was ein Breaking Change ist?

## 90s
**Nicht breaking:**
- Neues optionales Feld in der Antwort.
- Neuer Endpoint.
- Neuer optionaler Query-Parameter.

**Breaking:**
- Feld löschen oder umbenennen.
- Typ ändern, zum Beispiel `string` → `number`.
- Neues Pflichtfeld im Request.
- Bedeutung oder Status-Code ändern.
- Neuer Enum-Wert, wenn Clients ihn nicht kennen. Das ist ein Grenzfall.

**Wo steht die Version?**
- Pfad `/v1/orders`: sichtbar, einfach zu routen und zu cachen. Mein Standard.
- Header oder Media Type (`Accept: application/vnd.example.v2+json`): sauberere URLs, aber schwerer zu testen.

**OpenAPI in Spring Boot 3:** `springdoc-openapi` (Version 2.x) erzeugt die Spezifikation aus dem Code und zeigt Swagger UI.

## 3min
**Contract-first oder Code-first?**
- **Code-first:** schnell, die Doku kommt aus den Annotationen. Gut für interne APIs mit einem Team.
- **Contract-first:** zuerst die YAML-Datei, mit Review. Dann Code generieren mit `openapi-generator`. Gut, wenn viele Teams oder externe Partner die API nutzen. Die Diskussion findet vor dem Code statt.
- Bei DAZiT habe ich mit Fachabteilungen an Integrations-Spezifikationen gearbeitet. *(Prüfen: War das contract-first mit OpenAPI?)*

**Breaking Changes automatisch finden:** In der CI die neue Spezifikation mit der alten vergleichen, zum Beispiel mit `openapi-diff`. Ein Breaking Change bricht den Build.

**Eine alte Version abschalten:**
1. Neue Version parallel betreiben.
2. Alte Version als deprecated markieren. Header wie `Deprecation` und `Sunset` setzen.
3. Nutzung messen: Wer ruft noch v1 auf?
4. Mit den Teams einen Termin vereinbaren. Dann abschalten.

**Tolerant Reader:** Clients sollen unbekannte Felder ignorieren. In Jackson: `FAIL_ON_UNKNOWN_PROPERTIES = false`. Spring Boot setzt das schon so.

**Trade-off:** Zu viele Versionen parallel kosten Wartung und Tests. Ich halte maximal zwei aktive Versionen.

## Follow-ups
- Ist ein neuer Enum-Wert breaking? → Für Clients, die alle Werte prüfen, ja. Darum dokumentiere ich: Clients müssen unbekannte Werte tolerieren.
- Wie testen Sie, dass Code und Vertrag passen? → Contract Tests, zum Beispiel mit Spring Cloud Contract oder Pact. Oder generierten Code aus der Spezifikation nutzen.
- Versionieren Sie auch Events? → Ja, mit dem gleichen Prinzip: nur additive Änderungen. Eine Schema Registry hilft dabei.
- Warum nicht einfach immer eine neue Version? → Jede Version muss betrieben, getestet und gesichert werden. Das kostet viel.
- Was gehört in die OpenAPI-Doku? → Beispiele, Fehlerformate, Security-Schema, Pagination. Nicht nur die Felder.

## Don't say
- „Wir ändern die API und sagen den Teams Bescheid.“ Ohne Version und Übergangszeit bricht das Clients.
- „Swagger und OpenAPI sind etwas anderes.“ OpenAPI ist der Standard, Swagger die Tools dazu.

## Words
- **der Vertrag** = contract
- **abwärtskompatibel** = backward compatible
- **veraltet (deprecated)** = noch da, aber bald weg
- **die Übergangszeit** = transition period
- **die Spezifikation** = specification
