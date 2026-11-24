---
id: takehome-readme
round: takehome
tech: [cicd, k8s, spring]
tier: 2
q: Was steht in Ihrem README, und warum?
en: What is in your README, and why?
---
## 30s
Mein README hat vier Teile.
1. **Starten:** ein Befehl, zum Beispiel `docker compose up`. Danach eine URL zum Testen.
2. **Entscheidungen:** warum diese Struktur, diese Datenbank, diese Bibliotheken.
3. **Trade-offs:** was ich bewusst einfach gehalten habe.
4. **Nächste Schritte:** was ich mit mehr Zeit machen würde.
Der Leser soll in fünf Minuten starten und verstehen können.
Das README zeigt, wie ich im Team dokumentiere.

## 90s
**Vorlage:**
```
# Order Service

### Starten
docker compose up --build
curl http://localhost:8080/api/orders/1

### Tests
./mvnw verify        # Unit + Integration (braucht Docker)

### API
GET  /api/orders/{id}   200 | 404
POST /api/orders        201 | 400
OpenAPI: http://localhost:8080/swagger-ui.html

### Entscheidungen
- PostgreSQL statt H2: gleiche DB wie in Produktion, Tests mit Testcontainers.
- Flyway für das Schema: versioniert und reproduzierbar.
- Geld als BigDecimal, nie double.

### Trade-offs
- Keine Authentifizierung: nicht Teil der Aufgabe. Nächster Schritt: OAuth2 Resource Server.
- Kein Paging bei GET /orders: bei grossen Daten nötig.

### Nächste Schritte
1. Authentifizierung  2. Paging  3. Metriken mit Micrometer  4. CI-Pipeline

### Annahmen
- Eine Bestellung hat mindestens eine Position.

### KI-Nutzung
- Wofür ich KI benutzt habe und wie ich es geprüft habe.
```
**Laut gesagt:** „Das README beantwortet die Fragen, die Sie mir sonst stellen würden. Wie starte ich es? Warum so? Was fehlt?“

## 3min
**Warum ist das README so wichtig?** Oft liest das Team zuerst das README, dann den Code. Ein gutes README zeigt: Ich denke an den nächsten Entwickler. Ich kenne meine Lücken.

**Annahmen aufschreiben:** Eine Aufgabe ist nie ganz klar. Ich schreibe meine Annahmen auf. So sieht das Team, dass ich die Lücke bemerkt habe. Wenn möglich frage ich vorher per E-Mail nach.

**Reproduzierbar starten:**
- Docker Compose mit App und Datenbank.
- Feste Versionen, zum Beispiel `postgres:16`, nicht `latest`.
- Multi-Stage-Dockerfile: kleines Image ohne Build-Werkzeuge.
- Ich teste den Start einmal auf einem frischen Klon. Fehlende Dateien merkt man nur so.

**Ehrlich zu Lücken:** „Keine Authentifizierung“ im README ist besser als eine halbe, unsichere Lösung. Das Team sieht dann: Ich kenne das Thema, aber ich habe priorisiert.

**Aus meiner Praxis:** Dokumentation in Confluence war in mehreren Projekten Standard, bei MATCH und bei CARIAD. Bei CARIAD habe ich Best Practices in Confluence beschrieben. Bei MATCH gibt es für lokal und für AKS getrennte Helm-Values: `values.local.yaml` und `values.prod.yaml`. Genau solche Unterschiede gehören ins README.

## Follow-ups
- Wie lang sollte ein README sein? → So kurz wie möglich. Starten in den ersten Zeilen. Details in eigene Dateien, zum Beispiel ADRs.
- Was ist ein ADR? → Architecture Decision Record: eine kurze Datei pro Entscheidung mit Kontext, Entscheidung und Folgen.
- Warum schreiben Sie Annahmen auf? → Damit das Team meine Lösung richtig bewertet. Und es zeigt, dass ich Anforderungen kritisch lese.
- Gehört die KI-Nutzung ins README? → Ja, wenn sie erlaubt war. Kurz und ehrlich: wofür und wie geprüft.

## Don't say
- „Der Code erklärt sich selbst.“ Ein Start-Befehl und die Entscheidungen fehlen dann trotzdem.
- Kein README mit nur „mvn spring-boot:run“.

## Words
- **Annahme** = assumption
- **reproduzierbar** = works the same everywhere
- **Lücke** = gap
- **ADR** = architecture decision record
- **frischer Klon** = fresh clone of the repo
