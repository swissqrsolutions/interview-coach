---
id: review-n-plus-1
round: review
tech: [hibernate, spring, postgres]
tier: 1
q: Diese Seite ist sehr langsam. Was ist falsch an diesem Code?
en: This page is very slow. What is wrong with this code?
---
## 30s
```java
@Entity
class Order {
    @Id Long id;
    @OneToMany(mappedBy = "order")   // LAZY ist Standard
    List<OrderItem> items;
}

@Transactional(readOnly = true)
public List<OrderSummary> summaries() {
    List<Order> orders = orderRepository.findAll();      // 1 Query
    return orders.stream()
        .map(o -> new OrderSummary(o.getId(), o.getItems().size()))  // n Queries
        .toList();
}
```
Das ist das N+1-Problem.
Eine Query lädt alle Bestellungen. Dann lädt jede Bestellung ihre Positionen mit einer eigenen Query.
Bei 1000 Bestellungen sind das 1001 Queries.
Die Lösung: die Daten in einer Query holen, mit `JOIN FETCH` oder einem `@EntityGraph`.
Hier reicht sogar eine Projektion mit `COUNT`.

## 90s
**Fix 1: JOIN FETCH**
```java
@Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items")
List<Order> findAllWithItems();
```
**Fix 2: EntityGraph**
```java
@EntityGraph(attributePaths = "items")
List<Order> findAll();
```
**Fix 3, hier am besten: nur das laden, was ich brauche**
```java
@Query("""
    SELECT new com.example.OrderSummary(o.id, COUNT(i))
    FROM Order o LEFT JOIN o.items i
    GROUP BY o.id
    """)
List<OrderSummary> findSummaries();
```
**Laut gesagt:** „Ich brauche nur die Anzahl. Also zählt die Datenbank. Eine Query, keine Entities, wenig Speicher.“

**Wie ich es beweise:** Ich schalte das SQL-Logging ein, `spring.jpa.show-sql` oder besser Hibernate Statistics. Dann sehe ich die vielen gleichen SELECTs.

## 3min
**Trade-offs der Fixes:**
- `JOIN FETCH` mit Paging ist gefährlich. Hibernate lädt dann alles in den Speicher und paginiert dort. Es gibt eine Warnung „firstResult/maxResults specified with collection fetch“.
- Zwei Collections gleichzeitig fetchen ergibt ein kartesisches Produkt. Bei `List` sogar eine `MultipleBagFetchException`.
- **Batch Fetching** als Mittelweg: `@BatchSize(size = 50)` oder `hibernate.default_batch_fetch_size`. Dann lädt Hibernate die Positionen für 50 Bestellungen in einer Query. Aus 1001 werden etwa 21 Queries.
- **DTO-Projektion** ist oft die beste Lösung für Lesezugriffe. Keine Entities, kein Dirty Checking.

**Warum passiert das oft?** Der Code sieht harmlos aus. `getItems()` ist nur ein Getter. Mit 10 Testdaten merkt es niemand. Mit echten Daten ist es langsam.

**Wie bemerke ich es in Produktion?** Viele kurze gleiche Queries in der Datenbank, zum Beispiel in `pg_stat_statements`. Hohe Antwortzeit bei wenig CPU in der App. Ein Trace mit OpenTelemetry zeigt hunderte DB-Spans pro Request.

**Vorbeugen:** Ein Test, der die Anzahl Queries zählt. Und `spring.jpa.open-in-view=false`, damit Lazy Loading nicht heimlich im Controller passiert.

## Follow-ups
- Warum nicht einfach `FetchType.EAGER`? → Dann wird immer geladen, auch wenn ich es nicht brauche. Und bei `findAll` gibt es trotzdem N+1. EAGER löst das Problem nicht.
- Was ist Open Session in View? → Die Session bleibt bis zur View offen. Lazy Loading geht dann überall, auch im Controller. Das versteckt N+1. Ich schalte es aus.
- Was ist eine LazyInitializationException? → Zugriff auf eine Lazy Collection nach dem Ende der Session. Lösung: die Daten in der Transaktion laden, nicht EAGER.
- Gibt es N+1 auch ohne ORM? → Ja. Jede Schleife mit einer Query oder einem REST-Aufruf pro Element. Auch zwischen Microservices.

## Don't say
- „Ich mache alles EAGER.“
- „Hibernate ist langsam.“ Das Problem ist die Nutzung, nicht das Tool.

## Words
- **N+1-Problem** = 1 query + 1 per row
- **Lazy Loading** = load on first access
- **Projektion** = select only needed columns
- **kartesisches Produkt** = cartesian product
- **Position** = order item
