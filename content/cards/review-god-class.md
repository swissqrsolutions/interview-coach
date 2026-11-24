---
id: review-god-class
round: review
tech: [patterns, java, spring]
tier: 2
q: Diese Klasse hat 2000 Zeilen. Was halten Sie davon, und wie würden Sie sie refactoren?
en: This class has 2000 lines. What do you think, and how would you refactor it?
---
## 30s
```java
@Service
public class OrderManager {
    public void createOrder(OrderRequest r) {
        // 1. Eingabe prüfen (80 Zeilen)
        // 2. Preis und Rabatt berechnen (150 Zeilen)
        // 3. SQL direkt mit JdbcTemplate speichern
        // 4. PDF-Rechnung erzeugen
        // 5. E-Mail senden
        // 6. Lager per REST aktualisieren
    }
    // ... 40 weitere Methoden: Reports, Export, Admin
}
```
Das ist eine God Class. Sie verletzt das Single Responsibility Principle.
Die Klasse hat viele Gründe, sich zu ändern: Preise, Datenbank, PDF, E-Mail, Lager.
Folgen: schwer zu testen, viele Merge-Konflikte, Änderungen brechen andere Teile.
Mein Plan: zuerst Tests, dann in kleinen Schritten Verantwortungen herausziehen.

## 90s
**Ziel-Struktur:**
```java
@Service
class CreateOrderService {
    private final OrderValidator validator;
    private final PriceCalculator prices;
    private final OrderRepository orders;
    private final ApplicationEventPublisher events;

    @Transactional
    public OrderId create(OrderRequest r) {
        validator.validate(r);
        Order order = Order.from(r, prices.calculate(r));
        orders.save(order);
        events.publishEvent(new OrderCreated(order.id()));
        return order.id();
    }
}
// Listener nach dem Commit: InvoicePdfGenerator, OrderMailer, StockUpdater
```
**Laut gesagt:** „Der Service orchestriert nur. Jede Klasse hat eine Aufgabe. PDF, E-Mail und Lager reagieren auf ein Event. So ist das Erstellen der Bestellung nicht von der E-Mail abhängig.“

**Refactoring in Schritten:**
1. **Characterization Tests** um das heutige Verhalten. Ohne Tests kein Refactoring.
2. **Extract Class** für reine Logik zuerst: `PriceCalculator`. Das ist leicht zu testen.
3. Datenzugriff in ein Repository.
4. Nebenwirkungen (PDF, Mail, Lager) hinter Events oder Interfaces.
5. Nach jedem Schritt: Tests grün, kleiner Merge Request.

## 3min
**Wie erkenne ich eine God Class?**
- Viele Abhängigkeiten im Konstruktor, zum Beispiel mehr als sieben.
- Methodennamen aus verschiedenen Fachgebieten.
- Die Klasse ändert sich in fast jedem Ticket. Git zeigt das: `git log --format= --name-only | sort | uniq -c | sort -rn`.
- SonarQube meldet hohe kognitive Komplexität.

**SOLID kurz:**
- **S**ingle Responsibility: ein Grund für Änderungen.
- **O**pen/Closed: erweitern ohne ändern, zum Beispiel neue Rabattart als neue Strategy.
- **L**iskov: Unterklassen halten den Vertrag.
- **I**nterface Segregation: kleine Interfaces.
- **D**ependency Inversion: von Abstraktionen abhängen, nicht von Details.

**Passende Patterns:** Strategy für Rabatte. Domain Events oder Observer für Nebenwirkungen. Facade, wenn alte Aufrufer die alte API brauchen.

**Trade-off:** Zu viele kleine Klassen sind auch schlecht. Dann sucht man den Ablauf in zwanzig Dateien. Ich schneide nach Fachlichkeit, nicht nach Zeilen.

**Im Team:** Ich schlage das Refactoring als eigene Aufgabe vor, mit Nutzen: weniger Fehler, schnellere Änderungen. Nicht alles auf einmal. Die Pfadfinder-Regel: Jede Änderung macht die Klasse ein bisschen besser.

## Follow-ups
- Woher wissen Sie, dass Sie nichts kaputt machen? → Characterization Tests vorher. Kleine Schritte. IDE-Refactorings statt Handarbeit.
- Ist das nicht viel Arbeit ohne Business-Nutzen? → Ich verbinde es mit Features. Wer den Preis ändert, zieht zuerst den `PriceCalculator` heraus.
- Was ist der Unterschied zwischen Kohäsion und Kopplung? → Kohäsion: Teile einer Klasse gehören zusammen, gut wenn hoch. Kopplung: Abhängigkeit zwischen Klassen, gut wenn niedrig.
- Wann ist eine grosse Klasse okay? → Wenn sie eine klare Aufgabe hat, zum Beispiel ein generierter Mapper. Grösse allein ist nicht das Problem.

## Don't say
- „Ich schreibe die Klasse neu.“ Ein Big-Bang-Rewrite ist riskant.
- Nicht nur „SRP verletzt“ sagen. Den Plan in Schritten nennen.

## Words
- **God Class** = class that does everything
- **Verantwortung** = responsibility
- **herausziehen** = to extract
- **Characterization Test** = test that captures current behaviour
- **Kohäsion / Kopplung** = cohesion / coupling
