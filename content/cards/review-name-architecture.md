---
id: review-name-architecture
round: review
tech: [patterns, java, spring]
tier: 1
q: Schauen Sie sich die Paketstruktur an. Welcher Architekturstil ist das?
en: Look at the package structure. Which architecture style is this?
---
## 30s
```
com.example.billing
├── domain        Invoice, Money, InvoiceRepository (Interface)
├── application   CreateInvoiceUseCase, InvoiceService
├── adapter
│   ├── in.web        InvoiceController
│   └── out.persistence  JpaInvoiceRepository implements InvoiceRepository
└── config        BeanConfig
```
Ich schaue auf zwei Dinge: die Pakete und die Richtung der Abhängigkeiten.
Hier zeigen alle Abhängigkeiten nach innen zur Domain.
Die Domain definiert das Interface `InvoiceRepository`. Der Adapter implementiert es.
Es gibt Adapter für „in“ und „out“. Das ist hexagonal, also Ports and Adapters.
Mein Test: Importiert `domain` etwas von Spring oder JPA? Wenn nein, ist es sauber.

## 90s
**So erkenne ich die vier Stile:**

**Layered (Schichten):**
```
controller → service → repository → Datenbank
```
Abhängigkeiten gehen von oben nach unten. Der Service hängt direkt am Repository und oft an JPA-Entities. Typisch: Pakete `controller`, `service`, `repository`, `model`.

**Hexagonal (Ports and Adapters):**
Pakete `domain`, `application`, `adapter.in`, `adapter.out` oder `port`. Die Kernlogik definiert Ports (Interfaces). Web, DB und Messaging sind Adapter aussen.

**Onion:**
Ringe: `domain.model` innen, dann `domain.services`, dann `application`, aussen `infrastructure` und `ui`. Abhängigkeiten nur nach innen. Sehr ähnlich wie hexagonal, aber mit Ringen in der Mitte beschrieben.

**Clean Architecture:**
`entities`, `usecases` (Interactor), `interfaceadapters` (Controller, Presenter, Gateways), `frameworks`. Ein Use Case pro Klasse, mit Input und Output Port. Die Dependency Rule: Abhängigkeiten zeigen nach innen.

**Laut gesagt:** „Der Unterschied zwischen Layered und den anderen ist die Richtung. Bei Layered hängt die Logik an der Datenbank. Bei hexagonal, onion und clean hängt die Datenbank an der Logik.“

## 3min
**Die drei „inneren“ Stile sind fast gleich.** Alle nutzen Dependency Inversion. Sie unterscheiden sich vor allem in Namen und Detailtiefe:
- Hexagonal betont innen gegen aussen und Ports.
- Onion betont Ringe im Kern.
- Clean betont Use Cases als eigene Klassen.
Ich sage im Interview: „Es ist hexagonal. Clean und Onion folgen derselben Idee.“

**Wie ich die Abhängigkeiten prüfe:**
- Imports anschauen: `import jakarta.persistence` im `domain`-Paket = Leck.
- ArchUnit-Test im Build:
```java
@ArchTest
static final ArchRule domainIsPure = noClasses()
    .that().resideInAPackage("..domain..")
    .should().dependOnClassesThat()
    .resideInAnyPackage("org.springframework..", "jakarta.persistence..");
```

**Trade-offs:**
- **Layered** ist einfach und schnell. Gut für CRUD-Services. Gefahr: Fachlogik verteilt sich in Services und Entities.
- **Hexagonal / Clean** lohnt sich bei viel Fachlogik und mehreren Adaptern, zum Beispiel REST und Kafka. Kosten: mehr Klassen und Mapping zwischen Domain-Objekten und Entities.
- Package by Feature (`billing`, `customer`) ist oft wichtiger als der Stil innen.

**Typische Fehler, die ich im Review finde:** Der Controller ruft das Repository direkt. Die Domain hat JPA-Annotationen. Ein Adapter ruft einen anderen Adapter.

## Follow-ups
- Was ist ein Port? → Ein Interface an der Grenze des Kerns. Eingehend: der Use Case. Ausgehend: zum Beispiel `InvoiceRepository`.
- Darf die Domain JPA-Annotationen haben? → Streng nein. Pragmatisch ist es manchmal okay. Ich sage den Trade-off: weniger Mapping, aber Kopplung an JPA.
- Wann nehmen Sie Layered? → Bei einfachen CRUD-Services mit wenig Logik. Dort ist hexagonal zu viel Aufwand.
- Wie verhindern Sie, dass die Struktur zerfällt? → ArchUnit-Tests im Build und Code-Reviews.
- Was ist DDD dazu? → DDD beschreibt das Modell im Kern: Aggregate, Value Objects, Bounded Contexts. Hexagonal beschreibt die Hülle darum.

## Don't say
- „Hexagonal hat sechs Schichten.“ Das Sechseck ist nur ein Bild.
- Nicht nur nach Paketnamen urteilen. Die Richtung der Imports entscheidet.

## Words
- **Abhängigkeit** = dependency
- **Schicht** = layer
- **Port / Adapter** = interface at the core / technical implementation
- **nach innen zeigen** = point inwards
- **Leck** = leak (here: wrong dependency)
