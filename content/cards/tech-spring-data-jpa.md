---
id: tech-spring-data-jpa
round: tech
tech: [spring, hibernate]
tier: 1
project: BIT NABODAT
q: Was ist das N+1-Problem in JPA? Wie lösen Sie es? Und was ist Dirty Checking?
en: What is the N+1 problem in JPA? How do you solve it? And what is dirty checking?
---
## 30s
N+1 heisst: Eine Abfrage lädt N Objekte. Dann kommt für jedes Objekt noch eine Abfrage.
Das passiert bei Lazy Loading in einer Schleife.
Statt einer Abfrage gibt es dann 101 Abfragen.
Die Lösung ist meist ein Fetch Join, ein Entity Graph oder eine DTO-Projektion.
Dirty Checking heisst: Hibernate merkt Änderungen an geladenen Entities und schreibt sie automatisch.
Mit Hibernate habe ich bei NABODAT gearbeitet, mit PostgreSQL und PostGIS.
Soll ich ein Beispiel zeigen?

## 90s
**Das Problem:**
```java
List<Order> orders = orderRepo.findAll();          // 1 Abfrage
for (Order o : orders) {
    o.getItems().size();                           // N Abfragen, eine pro Order
}
```

**Lösungen:**
```java
@Query("select distinct o from Order o join fetch o.items where o.status = :s")
List<Order> findWithItems(@Param("s") Status s);   // 1 Abfrage

@EntityGraph(attributePaths = "items")
List<Order> findByStatus(Status s);                // 1 Abfrage
```
- `hibernate.default_batch_fetch_size: 50` → Hibernate lädt Lazy-Daten in Gruppen mit `IN (...)`. Aus 100 Abfragen werden 3.
- DTO-Projektion: Nur die Spalten, die ich brauche. Keine Entities, kein Lazy Loading.

**Lazy vs Eager (Standard):**
- `@ManyToOne`, `@OneToOne`: EAGER.
- `@OneToMany`, `@ManyToMany`: LAZY.
Meine Regel: alles LAZY. Dann pro Use Case bewusst laden.

## 3min
**Dirty Checking:**
1. Hibernate lädt eine Entity in den Persistence Context und merkt sich eine Kopie.
2. Ich ändere ein Feld mit einem Setter.
3. Beim Flush (meist beim Commit) vergleicht Hibernate mit der Kopie.
4. Gibt es Unterschiede, schreibt es ein `UPDATE`. Ein `save()` ist nicht nötig.
Gefahr: Ich ändere eine Entity nur zum Anzeigen. Sie wird trotzdem gespeichert. Darum `@Transactional(readOnly = true)` für Lese-Methoden.

**Fallen beim Fetch Join:**
- Fetch Join auf eine Collection plus Pagination: Hibernate lädt alles und paginiert im Speicher. Es gibt eine Warnung im Log. Lösung: zuerst IDs paginieren, dann mit Fetch Join laden.
- Zwei `List`-Collections gleichzeitig fetchen gibt `MultipleBagFetchException`. Lösung: `Set` oder zwei Abfragen.

**Open Session in View:** In Spring Boot standardmässig an. Lazy Loading geht dann auch im Controller. Das versteckt N+1. Ich setze `spring.jpa.open-in-view: false`.

**Wie ich N+1 finde:** SQL-Log in der Entwicklung (`logging.level.org.hibernate.SQL: debug`) oder Hibernate Statistics. Im Test kann man die Anzahl Abfragen zählen.

**Bei NABODAT:** Die PrimeFaces-Tabellen haben wir mit Lazy Loading gebaut. Sie laden nur die sichtbare Seite. *(Prüfen: Gab es bei NABODAT einen konkreten N+1-Fall?)*

## Follow-ups
- Warum nicht einfach alles EAGER? → Dann lädt jede Abfrage riesige Objekt-Graphen. Und EAGER kann selbst N+1 machen.
- Was ist eine LazyInitializationException? → Zugriff auf Lazy-Daten nach dem Ende der Session. Lösung: im Service laden, nicht im Controller.
- Was ist der Unterschied zwischen persist und merge? → `persist` macht ein neues Objekt managed. `merge` kopiert ein detached Objekt in ein managed Objekt und gibt dieses zurück.
- Wann nehmen Sie native SQL? → Für komplexe Reports, Window Functions oder PostGIS-Funktionen. Dann oft mit DTO-Projektion.
- Was ist der First-Level-Cache? → Der Persistence Context. Dieselbe Entity wird in einer Transaktion nur einmal geladen.

## Don't say
- „Ich rufe nach jeder Änderung save() auf.“ Bei managed Entities ist das unnötig.
- „N+1 löse ich mit EAGER.“ Das verschiebt das Problem nur.

## Words
- **nachladen** = to lazy-load
- **der Persistence Context** = Arbeitsspeicher von Hibernate pro Transaktion
- **verwaltet (managed)** = Hibernate beobachtet die Entity
- **die Projektion** = nur ausgewählte Spalten
- **der Flush** = Änderungen an die DB senden
