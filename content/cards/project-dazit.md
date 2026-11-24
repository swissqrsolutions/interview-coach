---
id: project-dazit
round: project
tech: [microservices, kafka, java, spring, observability]
tier: 1
project: BIT DAZiT (VSP)
q: Erzählen Sie von DAZiT. Wie haben Sie die Microservices und die Events entworfen?
en: Tell me about DAZiT. How did you design the microservices and events?
---
## 30s
DAZiT ist die Transformation beim BAZG. Ich war im Projekt VSP, der Plattform für Verbrauchssteuern.
Wir haben Java-Microservices mit Spring Boot, Angular und Kafka gebaut.
Sie verbinden mehrere Fachsysteme für Steuererklärungen.
Ich habe gemeinsame Services gebaut, die mehr als fünf Teams im SAFe Release Train nutzen.
Dazu OpenTelemetry-Tracing und Health Checks für alle Services, mit Java 21.
Soll ich das Event-Design oder die gemeinsamen Services erklären?

## 90s
**Die Architektur:**
1. Jeder Service hat eine fachliche Aufgabe und seine eigenen Daten.
2. Services sprechen über Kafka-Events, wenn sie nicht sofort eine Antwort brauchen.
3. REST nur dort, wo eine direkte Antwort nötig ist.
4. Das Frontend ist Angular mit TypeScript, RxJS und Quadrel.

**Event-Design (meine Regeln):**
- Ein Event beschreibt etwas, das passiert ist: `DeclarationSubmitted`, nicht `SubmitDeclaration`.
- Der Key ist die fachliche ID. So bleiben alle Events einer Erklärung in derselben Partition und in Reihenfolge.
- Consumer sind idempotent. Ein Event kann zweimal kommen.
- Schemas sind versioniert. Neue Felder sind optional.

*(Prüfen: Welche dieser Regeln haben Sie im Projekt wirklich so festgelegt? Ergänzen Sie ein echtes Event.)*

**Gemeinsame Services:** von 5+ Teams genutzt. OpenTelemetry zeigt einen Request über alle Services. Health Checks in allen Services für den Betrieb und das Monitoring.

## 3min
**Warum Kafka?**
- Mehrere Fachsysteme müssen auf dieselbe Änderung reagieren. Mit Events kennt der Sender die Empfänger nicht.
- Fällt ein Consumer aus, liest er später weiter. Nichts geht verloren.

**Trade-offs:**
- Eventual Consistency: Ein System sieht eine Änderung erst etwas später. Das muss das Fachteam verstehen.
- Debugging ist schwerer. Darum OpenTelemetry: Eine Trace-ID geht durch REST und Kafka.
- Gemeinsame Services für 5+ Teams: Eine Änderung trifft viele. Darum stabile APIs, Versionierung und klare Kommunikation im ART.

**Arbeit mit dem Fachbereich:**
Ich habe mit den Fachabteilungen Anforderungen und Integrations-Spezifikationen erarbeitet. *(Ihr echtes Beispiel: ein Fall, wo das Gespräch das Design geändert hat.)*

**Was schiefgehen kann:**
- Ein Event ist kaputt (Poison Message). Der Consumer blockiert die Partition. Lösung: Dead-Letter-Topic.
- Datenbank-Update und Event sind nicht atomar. Lösung: Outbox-Pattern. *(Prüfen: Haben Sie Outbox im Projekt genutzt?)*

**Was ich heute anders machen würde:** *(Ihr echtes Beispiel.)*

## Follow-ups
- Wie viele Services, wie viele Topics? → *(Ihr echtes Beispiel: Anzahl.)*
- Was ist SAFe und ein ART? → SAFe skaliert Agile auf viele Teams. Ein Agile Release Train sind mehrere Teams mit gemeinsamer PI-Planung.
- Wie verhindern Sie, dass ein gemeinsamer Service die anderen Teams bricht? → Versionierte APIs, Contract Tests und alte Versionen eine Zeit lang behalten. *(Prüfen: Contract Tests im Projekt?)*
- Wie funktioniert OpenTelemetry mit Kafka? → Der Producer schreibt den Trace-Kontext in die Kafka-Header. Der Consumer liest ihn und setzt den Trace fort.
- Was macht ein Health Check? → Liveness sagt: Der Prozess lebt. Readiness sagt: Der Service kann Anfragen annehmen. Spring Boot Actuator liefert beides.
- Warum Java 21? → LTS-Version, Virtual Threads, Records und Pattern Matching. *(Prüfen: Welche Features haben Sie genutzt?)*
- Was ist Quadrel? → Die Angular-Komponenten-Bibliothek der Bundesverwaltung für ein einheitliches Design. *(Prüfen.)*
- Wie lief CI? → Jenkins und Docker, im Scrum-Team.

## Don't say
- „Microservices sind immer besser.“ Sagen Sie, welches Problem sie bei DAZiT lösen.
- Nicht „Kafka garantiert exactly-once“ ohne Erklärung. Sagen Sie: idempotente Consumer.

## Words
- **Verbrauchssteuer** = excise / consumption tax
- **Fachsystem** = business system
- **Eventual Consistency** = später konsistent
- **Poison Message** = Nachricht, die immer fehlschlägt
- **Release Train (ART)** = mehrere Teams mit gemeinsamem Takt
