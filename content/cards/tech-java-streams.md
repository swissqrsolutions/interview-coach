---
id: tech-java-streams
round: tech
tech: [java]
tier: 1
project: BIT DAZiT
q: Wie funktionieren Java Streams? Wann benutzen Sie sie und wann nicht?
en: How do Java streams work? When do you use them and when not?
---
## 30s
Ein Stream ist eine Pipeline über Daten.
Es gibt Zwischenoperationen wie `filter` und `map`, und eine Endoperation wie `collect`.
Streams sind lazy. Erst die Endoperation startet die Arbeit.
Der Code wird deklarativ: Ich sage, was ich will, nicht wie.
In den Java-21-Services bei DAZiT nutze ich Streams für Transformationen von Listen.
Für einfache Schleifen mit Seiteneffekten nehme ich lieber eine for-Schleife.
Soll ich ein Beispiel mit groupingBy zeigen?

## 90s
**Beispiel:** Summe pro Kunde, nur bezahlte Bestellungen.
```java
Map<String, BigDecimal> totalPerCustomer = orders.stream()
    .filter(o -> o.status() == Status.PAID)
    .collect(Collectors.groupingBy(
        Order::customerId,
        Collectors.reducing(BigDecimal.ZERO, Order::amount, BigDecimal::add)));

List<String> ids = orders.stream().map(Order::id).toList(); // Java 16+, unveränderlich
```

**Wie es intern läuft:**
1. Jede Zwischenoperation baut nur eine Stufe. Nichts passiert.
2. Die Endoperation zieht die Elemente einzeln durch alle Stufen.
3. Kurzschluss: `findFirst`, `anyMatch`, `limit` hören früh auf.
4. Ein Stream ist nur einmal benutzbar.

**Wichtige Collectors:** `toMap`, `groupingBy`, `partitioningBy`, `joining`, `counting`.

## 3min
**Fallen:**
- `Collectors.toMap` wirft eine Exception bei doppelten Keys. Lösung: dritter Parameter, eine Merge-Funktion.
- `Stream.toList()` ist unveränderlich. `collect(Collectors.toList())` gibt eine ArrayList. Das kann im Code einen Unterschied machen.
- Seiteneffekte in `map` oder `peek` vermeiden. Die Reihenfolge und Anzahl der Aufrufe ist nicht garantiert.
- Checked Exceptions passen schlecht in Lambdas. Ich kapsle sie in eine eigene Methode.

**Parallel Streams:**
- Sie nutzen den gemeinsamen ForkJoinPool. Ein langsamer Aufruf blockiert andere Teile der App.
- Sinnvoll nur für viel CPU-Arbeit auf grossen Datenmengen, ohne I/O.
- In einem Web-Service benutze ich sie fast nie.

**Lesbarkeit:** Eine Kette mit zehn Stufen und verschachtelten Lambdas ist schwer zu lesen. Dann ziehe ich Teile in Methoden mit gutem Namen. Oder ich nehme eine Schleife.

**Performance:** Für normale Listen ist der Unterschied zur Schleife klein. Primitive Streams (`IntStream`, `mapToLong`) vermeiden Boxing.

## Follow-ups
- Was ist der Unterschied zwischen map und flatMap? → `map` macht aus einem Element ein Element. `flatMap` macht aus einem Element einen Stream und flacht alles zu einem Stream ab.
- Kann ich einen Stream zweimal benutzen? → Nein. Danach kommt eine `IllegalStateException`. Ich erstelle einen neuen Stream.
- Was heisst lazy? → Zwischenoperationen laufen erst, wenn eine Endoperation kommt.
- Wann nehmen Sie parallel()? → Selten. Nur bei grosser, CPU-lastiger Arbeit ohne I/O und nach einer Messung.
- Was macht Optional bei findFirst? → Es zeigt: Vielleicht gibt es kein Element. Ich nutze `orElseThrow` oder `orElse`, nicht `get()` ohne Prüfung.

## Don't say
- „Streams sind immer schneller als Schleifen.“ Nicht wahr, oft gleich oder etwas langsamer.
- „parallel() macht es schneller.“ Nur in speziellen Fällen.

## Words
- **die Zwischenoperation** = intermediate operation
- **die Endoperation** = terminal operation
- **der Seiteneffekt** = side effect
- **abflachen** = to flatten
- **lazy** = erst bei Bedarf ausgeführt
