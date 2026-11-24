---
id: tech-micro-vs-monolith
round: tech
tech: [microservices]
tier: 1
project: BIT DAZiT
q: Microservices oder Monolith? Wann empfehlen Sie was?
en: Microservices or monolith? When do you recommend which?
---
## 30s
Ein Monolith ist eine App, ein Deployment. Microservices sind viele kleine Services mit eigenem Deployment.
Microservices lösen vor allem ein Organisationsproblem: Viele Teams sollen unabhängig liefern.
Sie kosten aber viel: Netzwerk, verteilte Daten, Monitoring, Betrieb.
Für ein kleines Team starte ich mit einem modularen Monolithen.
Bei DAZiT waren Microservices richtig: Viele Fachsysteme, mehrere Teams im SAFe Agile Release Train. Unsere gemeinsamen Services haben mehr als 5 Teams genutzt.
Soll ich die Kriterien für die Entscheidung nennen?

## 90s
**Wann Microservices?**
- Mehrere Teams brauchen unabhängige Deployments.
- Teile haben sehr verschiedene Last und müssen getrennt skalieren.
- Klare fachliche Grenzen (Bounded Contexts) sind bekannt.
- Das Team kann den Betrieb: CI/CD, Container, Monitoring, Tracing.

**Wann Monolith?**
- Kleines Team, neues Produkt, Grenzen noch unklar.
- Starke Konsistenz über viele Daten nötig.
- Wenig Betriebs-Erfahrung.

**Modularer Monolith:** Ein Deployment, aber klare Module mit eigenen Schnittstellen. Kein Modul greift in die Tabellen eines anderen. Später kann man ein Modul herauslösen.

**Bei DAZiT:** Spring-Boot-Microservices, Kafka für Events, OpenTelemetry-Tracing und Health Checks über alle Services.

## 3min
**Die versteckten Kosten:**
- **Netzwerk:** Jeder Aufruf kann langsam sein oder fehlschlagen. Ich brauche Timeouts, Retries, Circuit Breaker.
- **Daten:** Keine Transaktion über Services. Ich brauche Sagas, Outbox und Eventual Consistency.
- **Debugging:** Ein Fehler geht über fünf Services. Ohne Tracing findet man ihn nicht. Darum war OpenTelemetry bei DAZiT wichtig.
- **Tests:** Integration über Services ist schwer. Contract Tests helfen.

**Anti-Pattern: verteilter Monolith.** Services müssen zusammen deployt werden. Sie teilen eine Datenbank. Ein Service ruft synchron fünf andere auf. Dann hat man die Nachteile von beidem.

**Wie schneide ich Services?** Nach Fachlichkeit (Domain-Driven Design), nicht nach Technik. Nicht "DB-Service" und "UI-Service", sondern zum Beispiel "Deklaration" und "Zahlung". Conway's Law: Die Architektur folgt der Team-Struktur.

**Was ich anders machen würde:** *(Ihr echtes Beispiel: Gab es bei DAZiT Services, die zu klein oder zu stark gekoppelt waren?)*

**Migration vom Monolithen:** Strangler Fig Pattern. Neue Funktionen kommen als Service daneben. Ein Gateway leitet Schritt für Schritt um. Ähnlich wie bei MATCH: Der neue Lakehouse-Weg lief parallel zum alten System, mit einem Feature Switch.

## Follow-ups
- Wie gross ist ein Microservice? → Nicht nach Zeilen messen. Ein Service gehört einem Team und deckt einen Bounded Context ab.
- Was ist ein verteilter Monolith? → Services, die man nur zusammen deployen kann. Man hat die Komplexität von Microservices ohne den Nutzen.
- Was ist das Strangler Fig Pattern? → Ein altes System Stück für Stück ersetzen. Neues läuft daneben, Verkehr wird schrittweise umgeleitet.
- Wie kommunizieren die Services? → Synchron mit REST oder gRPC, wenn ich sofort eine Antwort brauche. Asynchron mit Events, wenn nicht.
- Wie sehen Sie, wo ein Request langsam ist? → Mit Distributed Tracing, zum Beispiel OpenTelemetry. Jeder Request hat eine Trace-ID über alle Services.

## Don't say
- „Microservices sind immer moderner und besser.“
- „Monolithen skalieren nicht.“ Viele Monolithen skalieren gut horizontal.

## Words
- **unabhängig** = independent
- **die fachliche Grenze** = domain boundary
- **herauslösen** = to extract
- **gekoppelt** = coupled
- **der Betrieb** = operations
