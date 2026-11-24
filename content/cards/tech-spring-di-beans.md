---
id: tech-spring-di-beans
round: tech
tech: [spring]
tier: 1
project: BIT DAZiT, CARIAD
q: Was ist Dependency Injection in Spring? Welche Bean Scopes gibt es, und was sind Proxies?
en: What is dependency injection in Spring? Which bean scopes exist, and what are proxies?
---
## 30s
Bei Inversion of Control erstellt nicht mein Code die Objekte, sondern der Spring-Container.
Der Container gibt jeder Klasse ihre Abhängigkeiten. Das ist Dependency Injection.
Ich nutze Konstruktor-Injection. So sind die Felder final und Tests einfach.
Der Standard-Scope ist Singleton: eine Instanz pro Container.
Für Features wie @Transactional baut Spring einen Proxy um die Bean.
So habe ich Spring Boot bei DAZiT und CARIAD benutzt.
Soll ich erklären, wie die Proxies funktionieren?

## 90s
**Beans definieren:**
- `@Component`, `@Service`, `@Repository`, `@RestController` → Component Scan findet sie.
- `@Bean`-Methoden in einer `@Configuration`-Klasse → für fremde Klassen.

**Injection:**
```java
@Service
class DeclarationService {
    private final DeclarationRepository repo;
    private final Clock clock;
    DeclarationService(DeclarationRepository repo, Clock clock) {  // kein @Autowired nötig
        this.repo = repo;
        this.clock = clock;
    }
}
```

**Scopes:**
- `singleton` (Standard), `prototype` (neue Instanz bei jedem Holen).
- Web: `request`, `session`, `application`.

**Proxies:**
1. Spring erstellt die Bean.
2. Ein BeanPostProcessor sieht zum Beispiel `@Transactional` oder `@Async`.
3. Er gibt statt der Bean einen Proxy zurück.
4. Andere Beans bekommen den Proxy. Der Proxy macht Extra-Arbeit und ruft dann die echte Methode.
Spring Boot nutzt standardmässig CGLIB: eine Unterklasse zur Laufzeit. JDK-Proxies gehen nur über Interfaces.

## 3min
**Fallen:**
- **Self-Invocation:** Ruft eine Methode eine andere Methode derselben Klasse mit `this` auf, geht der Aufruf am Proxy vorbei. `@Transactional` oder `@Async` wirken dann nicht.
- **final:** CGLIB kann finale Klassen und Methoden nicht überschreiben. Der Proxy wirkt dort nicht.
- **Prototype in Singleton:** Die Singleton-Bean bekommt die Prototype-Bean nur einmal. Lösung: `ObjectProvider<T>` und `getObject()` bei Bedarf.
- **Zustand in Singletons:** Alle Requests teilen dieselbe Instanz. Keine Request-Daten in Feldern.

**Zwei Beans vom gleichen Typ:** `@Primary` für den Standard, `@Qualifier` für die Auswahl. Oder `List<PaymentStrategy>` injizieren und alle bekommen.

**Zirkuläre Abhängigkeiten:** Seit Spring Boot 2.6 standardmässig verboten. Gut so. Ein Zyklus zeigt meist ein Design-Problem. Ich löse ihn mit einer dritten Klasse oder einem Event.

**Warum Konstruktor-Injection?** Pflicht-Abhängigkeiten sind sichtbar. Felder sind final. Im Unit-Test brauche ich keinen Spring-Kontext: einfach `new` mit Mocks. Viele Parameter zeigen mir: Die Klasse macht zu viel.

## Follow-ups
- Field Injection oder Konstruktor? → Konstruktor. Field Injection versteckt Abhängigkeiten und braucht Reflection im Test.
- Ist eine Singleton-Bean thread-safe? → Nicht automatisch. Sie ist es, wenn sie keinen veränderbaren Zustand hat.
- Was ist der Unterschied zwischen @Component und @Bean? → @Component auf der eigenen Klasse. @Bean auf einer Methode, oft für Klassen aus Libraries.
- Wann wird eine Singleton-Bean erstellt? → Beim Start vom Kontext, eager. Mit `@Lazy` erst beim ersten Gebrauch.
- Wie umgehen Sie Self-Invocation? → Die Methode in eine andere Bean verschieben. Das ist die sauberste Lösung.

## Don't say
- „Spring macht Singletons thread-safe.“ Nein, das ist meine Aufgabe.
- „@Autowired auf Felder ist Best Practice.“ Heute nicht mehr.

## Words
- **die Abhängigkeit** = dependency
- **der Container** = Spring ApplicationContext, erstellt und verwaltet Beans
- **der Proxy** = Stellvertreter-Objekt um die echte Bean
- **injizieren** = to inject
- **zirkulär** = circular
