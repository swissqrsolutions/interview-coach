---
id: takehome-structure
round: takehome
tech: [spring, patterns, python]
tier: 1
q: Warum haben Sie Ihr Projekt so strukturiert?
en: Why did you structure your project this way?
---
## 30s
Ich habe nach Fachlichkeit strukturiert, nicht nur nach Technik.
Innen liegt die Logik. Aussen sind REST, Datenbank und Konfiguration.
Die Logik hängt nicht von Spring oder der Datenbank ab. So kann ich sie schnell testen.
Für die Grösse der Aufgabe habe ich es bewusst einfach gehalten. Keine zehn Module für drei Endpoints.
*(Ihr echtes Beispiel: Name der Aufgabe und ein Satz zur Struktur.)*
Soll ich eine Entscheidung genauer erklären?

## 90s
**Spring-Boot-Service (Beispiel):**
```
src/main/java/com/example/orders
├── api           OrderController, OrderRequest, OrderResponse, ErrorHandler
├── domain        Order, OrderStatus, PriceCalculator
├── application   OrderService (Use Cases, @Transactional)
└── persistence   OrderEntity, OrderRepository, Mapper
src/main/resources/db/migration   V1__create_orders.sql (Flyway)
src/test/java/...                 Unit, WebMvc, Testcontainers
Dockerfile, docker-compose.yml, README.md
```
**PySpark-ETL (Beispiel):**
```
etl/
├── jobs/ingest.py        # dünner Einstieg: lesen, transformieren, schreiben
├── transforms/orders.py  # reine Funktionen: DataFrame rein, DataFrame raus
├── io/                   # Lesen und Schreiben, Pfade aus Konfiguration
└── tests/test_orders.py  # pytest mit lokaler SparkSession
```
**Laut gesagt:** „Die Transformationen sind reine Funktionen. Ich teste sie mit kleinen DataFrames, ohne Dateien und ohne Cluster.“

**Drei Entscheidungen, die ich verteidige:**
1. DTOs in `api`, Entities in `persistence`. Die API ändert sich nicht, wenn die Tabelle sich ändert.
2. Flyway von Anfang an. Das Schema ist versioniert und reproduzierbar.
3. Konfiguration über Umgebungsvariablen. Keine Secrets im Repo.

## 3min
**Warum nicht vollständig hexagonal?** Für eine Aufgabe von wenigen Stunden wäre das zu viel Code. Ich habe die Idee übernommen: Die Logik ist unabhängig. Aber ohne extra Port-Interfaces für alles. Das sage ich offen: „In einem echten Produkt mit mehreren Adaptern würde ich Ports einführen.“

**Package by Feature oder by Layer?** Bei einer kleinen Aufgabe ist das Ergebnis ähnlich. Bei mehreren Fachbereichen nehme ich Package by Feature: `orders`, `customers`. Jeder Bereich hat innen seine Schichten.

**Was ich bewusst weggelassen habe:**
- Kein Microservice-Split. Ein Service reicht.
- Kein Message Broker, wenn die Aufgabe ihn nicht braucht.
- Kein Caching ohne gemessenes Problem.
Das nenne ich im README unter „Entscheidungen“.

**Aus meinen Projekten übernommen:** Bei MATCH waren die Python-Tests in die .NET-Komponententests integriert, ein gemeinsames CI-Gate. Die Lektion für eine Aufgabe: Ein Befehl startet alle Tests. Multi-Stage-Dockerfiles habe ich bei MATCH auch genutzt: kleines Laufzeit-Image ohne Build-Werkzeuge.

**Typische Gegenfrage:** „Ist das nicht over-engineered?“ → „Ich habe drei Pakete und eine Klasse pro Aufgabe. Das ist die kleinste Struktur, die ich noch gut testen kann.“

## Follow-ups
- Warum haben Sie keine Interfaces für die Services? → Mit nur einer Implementierung bringt ein Interface wenig. Mockito kann auch Klassen mocken. Bei einem zweiten Adapter führe ich eins ein.
- Wo liegt die Validierung? → Formale Prüfung an der API mit Bean Validation. Fachliche Regeln in der Domain.
- Wie würde die Struktur bei fünf Entwicklern aussehen? → Package by Feature, klare Besitzer, ArchUnit-Regeln gegen falsche Abhängigkeiten.
- Warum Flyway und nicht `ddl-auto`? → `ddl-auto` ist für Demos. Flyway ist versioniert, reviewbar und gleich in allen Umgebungen.

## Don't say
- „So macht man das halt.“ Jede Entscheidung braucht einen Grund.
- Nicht eine riesige Struktur für eine kleine Aufgabe verteidigen. Einfachheit ist ein Argument.

## Words
- **Struktur** = project layout
- **Fachlichkeit** = business domain
- **bewusst weglassen** = leave out on purpose
- **reine Funktion** = pure function, no side effects
- **verteidigen** = to defend
