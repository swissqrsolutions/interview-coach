---
id: project-cariad
round: project
tech: [angular, spring, postgres, aws, scrum, cicd]
tier: 1
project: CARIAD (HAD Map Learning)
q: Erzählen Sie von Ihrer Zeit bei CARIAD. Was haben Sie dort gebaut?
en: Tell me about your time at CARIAD. What did you build there?
---
## 30s
CARIAD ist die Software-Firma vom Volkswagen-Konzern.
Ich war im Team OneMap Development, Projekt Kingfisher.
Die Pipeline verarbeitet Sensordaten von Millionen VW-Fahrzeugen. Daraus entstehen HD-Karten für autonomes Fahren.
Ich habe Infrastruktur, Tools und Monitoring für diese Pipeline gebaut, mit Angular, Spring Boot und PostgreSQL.
Ich habe Scrum im Team eingeführt und den ganzen Release-Prozess automatisiert.
Soll ich die Architektur oder die Release-Automatisierung erklären?

## 90s
**Was das System macht:** Die Pipeline baut HD-Karten aus Flottendaten. Unsere Plattform prüft die Qualität der Karten, bevor sie zurück in die Flotte gehen. Das ist sicherheitskritisch.

**Die Architektur:**
1. **Frontend:** Angular 14, TypeScript, RxJS, Angular Material. Dashboards mit Lazy-Loaded Feature-Modulen, Standalone Components, Smart/Presentational-Trennung.
2. **Backend:** Spring Boot mit Java 11 und PostgreSQL.
3. **Pipeline:** Kubernetes. gRPC und Protobuf zwischen den Services.
4. **Login:** LDAP über Keycloak.
5. **Betrieb:** CI/CD mit Bamboo, SonarQube Quality Gates, Grafana-Dashboards für die Pipeline. Entwicklung auf AWS.

**Meine Rollen:**
- Architektur und Infrastruktur der Monitoring- und Test-Plattform mitverantwortet.
- Dockerfiles für ein schnelles Datenbank-Setup.
- Automatisches Requirements-Tracing aus der DOORS-Datenbank.
- Plugins, Widgets und Checker für das EB GUIDE Framework entwickelt, getestet und reviewt.
- Code Reviews in Bitbucket, Best Practices in Confluence.

## 3min
**Release-Automatisierung:**
Ich habe den ganzen Release-Prozess automatisiert. Das hat viel manuelle Arbeit gespart. *(Ihr echtes Beispiel: Wie lange dauerte ein Release vorher und nachher? Welche Schritte?)*

**Requirements-Tracing aus DOORS:**
In der Autoindustrie muss man zeigen: Welche Anforderung wird von welchem Code und Test abgedeckt? Ich habe das Tracing aus der DOORS-Datenbank automatisiert. *(Prüfen: Wie genau, z. B. Export, Skript, Report?)*

**Scrum eingeführt:**
Ich habe Planning, Review, Retro und Daily moderiert. Dazu Backlog-Pflege, Velocity und Burndown. *(Ihr echtes Beispiel: Was wurde danach besser?)*

**Trade-offs und Lernpunkte:**
- Kotlin nur für interne Tools (Validierung, Metriken), nicht in Produktions-Services. So bleibt der Produktions-Stack einheitlich.
- gRPC ist schnell und typisiert. Aber man kann es nicht einfach im Browser oder mit curl testen. Für das Frontend blieb REST mit Swagger.
- Sicherheitskritisch heisst: viele Tests. REST-Service-Tests mit Swagger, Unit- und Integrationstests, Quality Gates.

**Feedback im Zeugnis:** Eigeninitiative, überdurchschnittlicher Einsatz, Arbeitstempo weit über den Erwartungen, bei Kollegen sehr geschätzt.

## Follow-ups
- Ihr CV sagt ab 2017, das Zeugnis ab Dezember 2020. Warum? → CARIAD wurde erst 2020 gegründet. *(Prüfen: Erklären Sie klar, wo und wie Sie 2017–2020 gearbeitet haben.)*
- Was ist HAD? → Highly Automated Driving, also hochautomatisiertes Fahren. Die Autos brauchen sehr genaue Karten.
- Was ist EB GUIDE? → Ein Framework von Elektrobit für Fahrzeug-HMIs. Ich habe Plugins, Widgets und Checker dafür gebaut. *(Prüfen: Wofür genau?)*
- Was haben Sie auf AWS gemacht? → Entwicklung auf AWS: Anwendungen, Datenbanken, Sicherheit, Skalierung und Monitoring. *(Ihr echtes Beispiel: welche AWS-Dienste.)*
- Warum Standalone Components? → Weniger NgModule-Code. Jede Komponente sagt selbst, was sie braucht. Lazy Loading wird einfacher.
- Wie gross war das Team? → *(Ihr echtes Beispiel: Teamgrösse.)*
- Warum sind Sie gegangen? → Auf eigenen Wunsch. *(Ihr echtes Beispiel: positiver Grund, z. B. Wechsel in die Schweiz.)*

## Don't say
- Nicht sagen, dass Sie die Karten selbst berechnet haben. Sie haben Infrastruktur, Tools und Monitoring gebaut.
- Nicht über die Daten-Lücke 2017–2020 stolpern. Die Antwort muss vorbereitet sein.

## Words
- **Flotte** = fleet
- **sicherheitskritisch** = safety-critical
- **Requirements-Tracing** = Anforderung ↔ Code ↔ Test verbinden
- **Konzern** = group of companies
- **Zeugnis** = reference letter
