---
id: tech-patterns-common
round: tech
tech: [patterns]
tier: 1
project: Flaconi (SOAP-Adapter), DigiSanté (PDF-Wrapper)
q: Welche Design Patterns nutzen Sie oft? Strategy, Factory, Builder, Observer, Adapter, Decorator?
en: Which design patterns do you use often? Strategy, factory, builder, observer, adapter, decorator?
---
## 30s
Ich nutze Patterns, wenn sie ein echtes Problem lösen, nicht als Selbstzweck.
Strategy für austauschbare Regeln, Builder für Objekte mit vielen Feldern.
Adapter, um ein fremdes System hinter einer eigenen Schnittstelle zu verstecken.
Bei Flaconi haben wir Legacy-Backends über SOAP mit JAX-WS angebunden. Das war für mich ein Adapter.
Bei DigiSanté ist der PDF-Service ein REST-Wrapper um OpenHTMLtoPDF.
Viele Patterns stecken auch in Spring: Proxies sind Decorators, Events sind Observer.
Soll ich zu einem Pattern ein Code-Beispiel zeigen?

## 90s
**Strategy:** Austauschbare Algorithmen hinter einem Interface.
```java
interface TaxRule { boolean appliesTo(Declaration d); BigDecimal tax(Declaration d); }
@Service class TaxCalculator {
    private final List<TaxRule> rules;                // Spring injiziert alle Regeln
    TaxCalculator(List<TaxRule> rules) { this.rules = rules; }
    BigDecimal calc(Declaration d) {
        return rules.stream().filter(r -> r.appliesTo(d)).findFirst()
            .orElseThrow().tax(d);
    }
}
```

**Factory:** Erstellt das richtige Objekt, ohne dass der Aufrufer die Klasse kennt. Zum Beispiel ein Parser pro Dateityp. `List.of()` ist eine Static Factory Method.

**Builder:** Für Objekte mit vielen optionalen Feldern. Lesbar und unveränderlich. `HttpClient.newBuilder()...build()`, Lombok `@Builder`.

**Observer:** Ein Objekt meldet Änderungen, andere hören zu. In Spring: `ApplicationEventPublisher` und `@EventListener`. Zwischen Services: Kafka.

**Adapter:** Übersetzt eine fremde Schnittstelle in meine. Mein Code kennt nur mein Interface `CustomerDirectory`. Der Adapter spricht SOAP.

**Decorator:** Fügt Verhalten hinzu, mit demselben Interface. Zum Beispiel ein `CachingRateProvider` um einen `RestRateProvider`. Java I/O: `new BufferedInputStream(new FileInputStream(f))`.

## 3min
**Wo Spring Patterns nutzt:**
- **Proxy / Decorator:** `@Transactional`, `@Cacheable`, `@Async`.
- **Template Method:** `JdbcTemplate`, `RestTemplate`. Das Framework macht den Ablauf, ich gebe die Details.
- **Singleton:** Standard-Scope der Beans, aber ohne statisches Feld.
- **Factory:** `@Bean`-Methoden, `FactoryBean`.

**Adapter in der Architektur:** In hexagonaler Architektur sind alle Anbindungen Adapter: REST-Controller, JPA-Repository, Kafka-Producer. Der Kern bleibt frei von Technik. Wenn sich ein Legacy-System ändert, ändere ich nur den Adapter.

**Trade-offs und Fehler:**
- Zu viele Patterns machen einfachen Code kompliziert. Eine `if`-Abfrage mit zwei Fällen braucht keine Strategy.
- Factory für jede Klasse ist unnötig, wenn Spring die Objekte erstellt.
- Observer mit vielen Listenern: Der Ablauf ist schwer zu verfolgen. Und `@EventListener` läuft standardmässig synchron im selben Thread und in derselben Transaktion.
- Java 21 ersetzt manches: Records statt Builder bei wenigen Feldern. Sealed Interfaces mit Pattern Matching statt Visitor.

**Wie ich im Interview ein Pattern erkläre:** Problem → Pattern → Beispiel aus dem Projekt → Nachteil.

## Follow-ups
- Was ist der Unterschied zwischen Adapter und Decorator? → Adapter ändert das Interface. Decorator behält das Interface und fügt Verhalten hinzu.
- Was ist der Unterschied zwischen Adapter und Facade? → Adapter übersetzt ein Interface. Facade macht ein komplexes System mit einer einfachen Schnittstelle nutzbar.
- Ist Singleton ein Anti-Pattern? → Das klassische mit statischem Feld oft ja: schwer zu testen, versteckte Abhängigkeit. Spring-Singletons sind ok, weil sie injiziert werden.
- Wie wählt Spring die richtige Strategy? → Ich injiziere eine `List` oder `Map<String, Strategy>` mit dem Bean-Namen als Key und wähle zur Laufzeit.
- Welches Pattern sehen Sie in Kafka? → Publish-Subscribe, eine verteilte Form vom Observer.

## Don't say
- „Ich nutze alle 23 GoF-Patterns.“ Klingt nach Buch, nicht nach Praxis.
- Patterns aufzählen ohne das Problem, das sie lösen.

## Words
- **austauschbar** = interchangeable
- **die Schnittstelle** = interface
- **anbinden** = to integrate, to connect
- **der Selbstzweck** = an end in itself
- **hinzufügen** = to add
