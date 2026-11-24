---
id: tech-testing-pyramid
round: tech
tech: [testing]
tier: 2
project: ElCom MATCH, CARIAD, Unisys
q: Wie sieht Ihre Teststrategie aus? Was ist die Testpyramide?
en: What does your test strategy look like? What is the test pyramid?
---
## 30s
Die Testpyramide hat drei Ebenen.
Unten viele Unit-Tests: schnell und genau.
In der Mitte Integrationstests: echte DB, echtes Kafka, mit Testcontainers.
Oben wenige End-to-End-Tests durch das UI, zum Beispiel mit Playwright oder Cypress.
Ziel: schnelles Feedback und Vertrauen beim Deployen.
Bei Unisys habe ich Code-Qualitäts-Standards eingeführt: SonarQube, Code-Reviews, Testautomatisierung mit JUnit, Playwright und Cypress.
Soll ich erzählen, wie wir bei MATCH 100 % Parität getestet haben?

## 90s
**Unit-Tests:**
- Fachlogik ohne Framework. Millisekunden pro Test.
- JUnit 5, AssertJ, Mockito nur für Grenzen nach aussen.

**Integrationstests:**
- Eine Komponente mit echten Abhängigkeiten. Testcontainers für PostgreSQL oder Kafka.
- Spring Test Slices: `@WebMvcTest`, `@DataJpaTest`.
- Fremde APIs mit WireMock.

**Contract-Tests:**
- Prüfen, dass Consumer und Provider denselben Vertrag haben. Zum Beispiel Pact oder Spring Cloud Contract.

**End-to-End:**
- Wenige kritische Abläufe: Login, Einreichung, Report.
- Playwright oder Cypress.

**In der Pipeline:** Unit-Tests bei jedem Commit. Integration im Pull Request. E2E vor dem Deploy. SonarQube Quality Gate. Bei CARIAD hatten wir SonarQube Quality Gates in Bamboo.

## 3min
**Spezielle Tests aus meiner Praxis:**
- **Parity Harness bei MATCH:** Wir haben die Statistik-Engine von .NET nach PySpark portiert. Am Anfang passten die Ergebnisse nicht. Wir haben fünf Extraktor-Bugs gefunden und behoben: Zahlen- und Datumsformate, null vs leerer String, Zeitzone. Danach habe ich einen eigenen Job gebaut: `validate_parity.py`. Er vergleicht SQL-Server- und Iceberg-Ergebnisse Tabelle für Tabelle. Go-live nur bei 100 % Parität. Lektion: Business-Logik nie ohne maschinell prüfbare Parität portieren.
- **Ein CI-Gate:** Bei MATCH liefen die Python-Tests in den .NET-Komponententests mit. Ein Gate, nicht zwei.

**Trade-offs:**
- Zu viele E2E-Tests: langsam und flaky. Das Team ignoriert rote Builds.
- Zu viele Mocks: Tests sind grün, aber die Integration bricht. Darum echte DB mit Testcontainers.
- Manche Teams nutzen eine "Testing Trophy": mehr Integrationstests, weniger Unit-Tests. Für Services mit wenig Logik und viel I/O finde ich das sinnvoll.

**Flaky Tests:** Ich ignoriere sie nicht. Ursache finden: Zeit, Reihenfolge, geteilte Daten, Ressourcen. Bei MATCH wurde der SQL-Container in der CI OOM-killed. Wir haben ihn auf 2 GB begrenzt, Speicher vor den Tests freigemacht und schwere Tests seriell gemacht.

**Coverage:** Ein Hinweis, kein Ziel. 80 % Coverage mit schwachen Asserts sagt wenig. Ich schaue auf wichtige Pfade und Fehlerfälle.

## Follow-ups
- Was ist ein guter Unit-Test? → Schnell, unabhängig, wiederholbar, ein klares Verhalten. Name sagt, was erwartet wird.
- Wie gehen Sie mit flaky Tests um? → Sofort analysieren, eventuell kurz in Quarantäne, aber mit Ticket. Nie einfach Retry und vergessen.
- Wann mocken Sie? → An Grenzen nach aussen: fremde APIs, Zeit, Zufall. Nicht die eigene Datenbank, wenn ein Container geht.
- Was ist TDD? → Erst ein roter Test, dann minimaler Code, dann Refactoring. Ich nutze es gern für Fachlogik mit klaren Regeln.
- Wie hoch soll die Coverage sein? → Kein fester Wert. Ich achte auf wichtige Logik und Fehlerfälle, nicht auf die Zahl.

## Don't say
- „Wir testen manuell vor dem Release.“ Für einen Senior zu wenig.
- „100 % Coverage ist unser Ziel.“ Coverage misst nicht die Qualität der Asserts.

## Words
- **die Teststrategie** = test strategy
- **die Parität** = gleiche Ergebnisse wie das alte System
- **flaky** = mal grün, mal rot ohne Code-Änderung
- **die Abdeckung (Coverage)** = coverage
- **das Vertrauen** = confidence
