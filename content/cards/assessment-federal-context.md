---
id: assessment-federal-context
round: assessment
tech: [federal, security, azure]
tier: 1
project: DigiSanté, DAZiT, NABODAT, MATCH
q: Was wissen Sie über unser Umfeld in der Bundesverwaltung?
en: What do you know about our environment in the federal administration?
---
## 30s
Ich arbeite seit 2024 in Bundesprojekten in Bern.
Für das BAG bei DigiSanté, für das BIT bei DAZiT und NABODAT, und für die ElCom bei MATCH.
Das Umfeld ist reguliert: Datenschutz nach DSG, hohe Sicherheit, klare Prozesse.
Zum Beispiel habe ich eine Audit-Bibliothek für DSG-konforme Logs gebaut.
Und bei DigiSanté läuft alles nur über Private Endpoints.

## 90s
**Was das Umfeld ausmacht:**
- **Datenschutz (DSG):** Das revidierte Datenschutzgesetz gilt seit September 2023. Personendaten nur so viel wie nötig, Zugriffe nachvollziehbar.
- **Sicherheit:** Netzwerk privat, Geheimnisse nicht im Code, Identitäten statt Passwörter.
- **Viele Beteiligte:** Fachamt, BIT als Leistungserbringer, Datenschutz, Informationssicherheit.
- **Ausschreibungen:** Externe kommen über öffentliche Ausschreibungen. Die Kriterien sind fix.

**Meine Beispiele:**
- DigiSanté: Audit-Bibliothek als Spring Boot Autoconfigure für DSG-konforme Logs. Ingestion nach Azure Monitor über einen privaten Data Collection Endpoint mit Managed Identity.
- DigiSanté: eine eigene PostgreSQL-Datenbank pro Mandant für AHV-Personendaten über ZAS/UPI.
- DigiSanté: Sedex-Client als Sidecar.
- MATCH: Secrets mit Vault und Azure Key Vault, keine Secrets im Repo. Kyverno erlaubt nur Images aus der ACR.

## 3min
**Sicherheit im Detail (DigiSanté):**
- Upload-Pipeline mit Quarantäne: Die Datei wird erst nach dem Defender-Scan freigegeben oder gelöscht.
- Apache Tika prüft die echten Bytes gegen gefälschte Dateitypen.
- JWT RS256 wird gegen den Public Key im Key Vault geprüft, bevor das erste Byte gespeichert wird.
- Functions, Storage, Key Vault und Event Hub nur über Private Endpoints. Eine bewusste Ausnahme für Event Grid.

**Barrierefreiheit:** Der PDF-Service erzeugt PDF/A und PDF/UA-1. PDF/UA ist für barrierefreie Dokumente.

**Arbeitsweise:**
- Scrum bei DAZiT und NABODAT. Bei DAZiT im SAFe Agile Release Train mit mehr als fünf Teams.
- Qualitätsstandards: SonarQube, Code-Reviews, Testautomatisierung.

**HERMES:** HERMES ist die Projektmanagement-Methode des Bundes. *(Prüfen: Haben Sie damit gearbeitet? Sonst ehrlich sagen: „Ich kenne die Phasen, gearbeitet habe ich agil im Team.“)*

**Was Sie vorher über die konkrete Stelle lesen:** Amt, Auftrag, aktuelle Projekte, Ausschreibung. *(Ihre Notizen zur Stelle.)*

## Follow-ups
- Was ändert das neue DSG für Entwickler? → Privacy by Design und by Default. Nur nötige Daten, Zugriffe protokollieren, Löschen möglich machen.
- Was ist Sedex? → Die sichere Datenaustausch-Plattform des Bundes für Behörden. Bei DigiSanté lief unser Client als Sidecar, ein Init-Container registriert das Zertifikat.
- Wie schützen Sie Personendaten wie die AHV-Nummer? → Mandanten getrennt, eigene Datenbank pro Mandant, Zugriff nur über private Netze, Audit-Logs.
- Was ist die Rolle vom BIT? → Das Bundesamt für Informatik und Telekommunikation. Es baut und betreibt IT für viele Ämter.
- Warum Private Endpoints? → Die Dienste sind nicht aus dem Internet erreichbar. Nur aus dem eigenen Netzwerk.

## Don't say
- „Beim Bund ist alles langsam.“
- Kundendetails nennen, die vertraulich sind.
- „DSG ist wie DSGVO.“ Ähnlich, aber ein eigenes Schweizer Gesetz.

## Words
- **die Bundesverwaltung** = federal administration
- **das DSG** = Swiss Data Protection Act
- **das Amt** = federal office
- **der Leistungserbringer** = service provider
- **nachvollziehbar** = traceable
- **barrierefrei** = accessible
