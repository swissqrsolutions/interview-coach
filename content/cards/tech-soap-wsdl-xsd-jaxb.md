---
id: tech-soap-wsdl-xsd-jaxb
round: tech
tech: [soap]
tier: 3
project: Flaconi, BIT NABODAT
q: Was sind WSDL, XSD und JAXB, und wie arbeiten Sie damit in Java?
en: What are WSDL, XSD and JAXB, and how do you work with them in Java?
---
## 30s
Die XSD beschreibt die Struktur einer XML-Datei: Elemente, Typen, Pflichtfelder.
Die WSDL beschreibt einen SOAP-Service: Operationen, Nachrichten und Adresse. Sie nutzt XSD für die Typen.
JAXB macht aus XML Java-Objekte und zurück.
Aus WSDL und XSD erzeugt man den Java-Code automatisch.
Bei Flaconi habe ich SOAP-Consumer mit JAX-WS gebaut. Bei NABODAT habe ich XML-Schnittstellen mit JAXB und XSD umgesetzt.
Soll ich zeigen, wie die Code-Generierung im Build aussieht?

## 90s
**Contract-first:** Die WSDL oder XSD ist zuerst da. Der Code wird daraus generiert.

1. XSD oder WSDL liegt im Projekt.
2. Ein Maven-Plugin generiert Java-Klassen im Build (für XSD mit `xjc`, für WSDL mit `wsimport` oder Apache CXF `wsdl2java`).
3. Der Code wird nie von Hand geändert.

**JAXB lesen und validieren:**
```java
JAXBContext ctx = JAXBContext.newInstance(SoilReport.class);
Unmarshaller u = ctx.createUnmarshaller();
Schema schema = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI)
    .newSchema(new File("soil-report.xsd"));
u.setSchema(schema);
SoilReport report = (SoilReport) u.unmarshal(xmlFile);
```
- `JAXBContext` ist thread-safe und teuer. Einmal erstellen, wiederverwenden.
- `Unmarshaller` und `Marshaller` sind nicht thread-safe.

## 3min
**Wichtig seit Java 11:** JAXB und JAX-WS sind nicht mehr im JDK. Man braucht eigene Dependencies. Heute mit Namespace `jakarta.xml.bind` und `jakarta.xml.ws`, nicht mehr `javax`.

**Schema-Evolution:**
- Neues optionales Element: meist kompatibel.
- Neues Pflichtfeld oder geänderter Typ: bricht alte Clients.
- Darum Namespace mit Version, zum Beispiel `.../soil/v2`.

**Sicherheit:**
- XXE (XML External Entity): Externe Entities beim Parser immer deaktivieren. Sonst kann ein Angreifer Dateien vom Server lesen.
- Große XML-Dateien: StAX oder Streaming statt alles in den Speicher laden.

**Typische Fehler:**
- Namespace falsch. Dann ist das Objekt leer, ohne Fehler. Darum mit Schema validieren.
- Zeitzonen bei `xs:dateTime`. Im Mapping klar auf `OffsetDateTime` oder UTC gehen.
- Ähnliches Thema bei MATCH: XML-Reports parsen in PySpark. Dort waren Datums- und Zahlenformate eine echte Fehlerquelle.

## Follow-ups
- Contract-first oder Code-first? → Contract-first für externe Partner. Der Vertrag ist stabil und unabhängig von der Sprache.
- Was ist der Unterschied zwischen DOM, SAX und StAX? → DOM lädt alles in den Speicher. SAX und StAX lesen als Stream. StAX ist pull-basiert und einfacher.
- Wie testen Sie einen SOAP-Client? → Mit einem Mock-Server, zum Beispiel WireMock oder SoapUI-Mocks. Und mit Beispiel-XML aus dem Vertrag.
- Was ist WS-Security? → Standard für Signatur, Verschlüsselung und Tokens in der SOAP-Nachricht.

## Don't say
- „Ich passe den generierten Code an.“ Beim nächsten Build ist alles weg.
- „JAXB ist im JDK.“ Seit Java 11 nicht mehr.

## Words
- **das Schema** = Beschreibung der Struktur
- **generieren** = automatisch erzeugen
- **unmarshal** = XML → Objekt
- **marshal** = Objekt → XML
- **der Namespace** = Namensraum
