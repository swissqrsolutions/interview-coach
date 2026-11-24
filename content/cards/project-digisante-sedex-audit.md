---
id: project-digisante-sedex-audit
round: project
tech: [azure, spring, federal, observability]
tier: 2
project: BAG DigiSanté
q: Welche gemeinsamen Bausteine haben Sie bei DigiSanté gebaut, zum Beispiel für Sedex, PDF und Audit?
en: Which shared building blocks did you build at DigiSanté, e.g. for Sedex, PDF and audit?
---
## 30s
Ich habe drei Bausteine gebaut, die andere Services nutzen.
Erstens: den Sedex-Client als Sidecar in Azure Container Apps. Ein Init-Container registriert einmal das Zertifikat.
Zweitens: einen PDF-Service. Er macht aus HTML PDF/A- und PDF/UA-1-Dokumente.
Drittens: eine Audit-Bibliothek für Spring Boot. Sie schreibt DSG-konforme Audit-Logs nach Azure Monitor.
Alles läuft im privaten VNet.
Welcher Baustein interessiert Sie am meisten?

## 90s
**1. Sedex (sicherer Datenaustausch der Verwaltung):**
- Der Sedex-Client läuft als Sidecar neben der Applikation.
- Ein Init-Container macht die einmalige Zertifikats-Registrierung. Erst dann startet der Hauptcontainer.

**2. PDF-Service:**
- Ein REST-Wrapper um OpenHTMLtoPDF.
- Eingabe: HTML. Ausgabe: PDF/A (für die Archivierung) und PDF/UA-1 (barrierefrei).
- Läuft im privaten VNet.

**3. Audit-Bibliothek:**
- Eine Spring Boot Autoconfigure-Bibliothek. Ein Service fügt die Dependency hinzu, und das Audit-Logging ist aktiv.
- Sie schreibt asynchron nach Azure Monitor.
- Der Weg geht über einen privaten Data Collection Endpoint mit Managed Identity. Kein Passwort.

## 3min
**Warum Sidecar für Sedex?**
- Die Applikation und der Sedex-Client haben verschiedene Lebenszyklen. So kann man sie getrennt aktualisieren.
- Die Zertifikats-Registrierung passiert nur einmal. Darum passt ein Init-Container.

**Warum ein eigener PDF-Service?**
- Mehrere Services brauchen PDFs. Ein Service statt vieler Kopien.
- PDF/A und PDF/UA sind schwer richtig zu machen: Schriften einbetten, Struktur-Tags. Das löst man einmal.
- Trade-off: ein weiterer Service im Netz. Fällt er aus, kann niemand PDFs machen.

**Warum eine Bibliothek für Audit und kein Service?**
- Audit soll in jedem Service gleich sein. Autoconfiguration gibt gleiche Felder und gleiche Regeln.
- Asynchron: Das Audit-Log darf den Request nicht langsam machen.
- Trade-off: Asynchron kann ein Log verloren gehen, wenn der Service abstürzt. *(Prüfen: Wie haben Sie das behandelt? Puffer, Retry?)*
- Trade-off: Eine Bibliothek muss man in allen Services aktualisieren. Darum Versionierung und klare Release Notes.

**DSG-konform heisst:** Wer hat wann was mit welchen Daten gemacht. Aber keine unnötigen Personendaten im Log. *(Prüfen: Welche Felder loggt die Bibliothek genau?)*

## Follow-ups
- Was ist Sedex? → Sedex ist die sichere Plattform für Datenaustausch zwischen Behörden in der Schweiz, betrieben vom BFS.
- Was ist ein Sidecar? → Ein zweiter Container im selben Pod oder in derselben App. Er teilt Netz und Lebenszyklus mit der Applikation.
- Wie funktioniert Spring Boot Autoconfiguration? → Die Bibliothek listet ihre Konfiguration in META-INF/spring/…AutoConfiguration.imports. Mit @ConditionalOn… wird sie nur aktiv, wenn sie passt.
- Was ist PDF/UA? → Ein Standard für barrierefreie PDFs, zum Beispiel für Screenreader. Im Bund ist Barrierefreiheit Pflicht.
- Wie viele Services nutzen die Audit-Bibliothek? → *(Ihr echtes Beispiel: Anzahl Services.)*
- Was ist ein Data Collection Endpoint? → Ein Endpunkt von Azure Monitor für die Logs Ingestion API. Mit Private Link bleibt der Verkehr im privaten Netz.

## Don't say
- „Audit-Logs sind normale Logs.“ Audit hat Pflichtfelder, Aufbewahrung und Datenschutz-Regeln.
- Nicht Sedex als „E-Mail für Behörden“ abtun. Es geht um signierten, sicheren Austausch.

## Words
- **Baustein** = building block
- **barrierefrei** = accessible
- **Init-Container** = läuft einmal vor der App
- **Aufbewahrung** = retention
- **DSG** = Schweizer Datenschutzgesetz
