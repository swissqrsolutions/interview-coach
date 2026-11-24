---
id: review-thread-safety
round: review
tech: [java, spring]
tier: 1
q: Dieser Zähler zeigt unter Last falsche Werte. Was ist falsch?
en: This counter shows wrong values under load. What is wrong?
---
## 30s
```java
@Service
public class VisitService {
    private int count = 0;
    private final Map<String, Integer> perPage = new HashMap<>();
    private final SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM-dd");

    public void visit(String page) {
        count++;
        perPage.put(page, perPage.getOrDefault(page, 0) + 1);
    }

    public String today() { return fmt.format(new Date()); }
}
```
Ein Spring-Service ist ein Singleton. Alle Requests teilen dieselbe Instanz.
`count++` ist nicht atomar: lesen, plus eins, schreiben. Zwei Threads verlieren Updates.
`HashMap` ist nicht thread-safe. `getOrDefault` und `put` sind zwei Schritte.
`SimpleDateFormat` ist auch nicht thread-safe.
Fix: `AtomicLong`, `ConcurrentHashMap.merge` und `DateTimeFormatter`.

## 90s
**Der Fix:**
```java
@Service
public class VisitService {
    private final AtomicLong count = new AtomicLong();
    private final ConcurrentHashMap<String, LongAdder> perPage = new ConcurrentHashMap<>();
    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    public void visit(String page) {
        count.incrementAndGet();
        perPage.computeIfAbsent(page, p -> new LongAdder()).increment();
    }

    public String today() { return LocalDate.now().format(FMT); }
}
```
**Laut gesagt:** „`AtomicLong` macht das Plus-eins in einem Schritt. `computeIfAbsent` ist bei `ConcurrentHashMap` atomar. `DateTimeFormatter` ist unveränderlich, also thread-safe.“

**Einfachere Alternative:** `perPage.merge(page, 1, Integer::sum)`. Auch atomar. Bei sehr vielen Threads ist `LongAdder` schneller, weil weniger Konkurrenz.

**Meine Reihenfolge:**
1. **Korrekt?** Nein, Race Conditions.
2. **Sicher?** Die Map wächst ohne Grenze. Ein Angreifer schickt viele Seitennamen. Das ist ein Speicher-Problem.
3. **Schnell?** `synchronized` auf der ganzen Methode wäre korrekt, aber ein Engpass.
4. **Design:** Zähler im Speicher gehen beim Neustart verloren. Bei mehreren Pods zählt jeder Pod nur für sich.

## 3min
**Warum ist `count++` nicht atomar?** Es sind drei Schritte: lesen, addieren, schreiben. Thread A und B lesen beide 5. Beide schreiben 6. Ein Besuch fehlt.

**Warum reicht `volatile` nicht?** `volatile` macht Änderungen sichtbar für andere Threads. Aber `count++` bleibt drei Schritte. Für Sichtbarkeit ja, für Atomarität nein.

**Die Regel für Spring-Beans:** Beans sollen zustandslos sein. Felder nur für Abhängigkeiten, `final`. Zustand gehört in die Datenbank, in einen Cache oder in den Request.

**Design-Lösung für mehrere Pods:** Den Zähler in die Datenbank oder in Redis. Oder Metriken mit Micrometer und Prometheus: `meterRegistry.counter("visits", "page", page).increment()`. Aber Achtung: zu viele verschiedene Seiten als Label sind schlecht für Prometheus (hohe Kardinalität).

**Wie bemerke ich so etwas?** Die Fehler sind selten und nicht reproduzierbar. Werte sind zu klein. Unter Last mit `HashMap` gab es in alten Java-Versionen sogar Endlosschleifen. Ein Lasttest mit vielen Threads und eine Prüfung der Summe zeigen es.

**Virtual Threads (Java 21):** Mehr parallele Requests machen solche Fehler häufiger. `synchronized` kann in Java 21 einen Virtual Thread an den Träger-Thread pinnen. Ab Java 24 ist das behoben. Für Java 21 ist `ReentrantLock` die bessere Wahl.

## Follow-ups
- Was ist der Unterschied zwischen `HashMap` und `ConcurrentHashMap`? → `ConcurrentHashMap` ist thread-safe mit feinen Sperren und CAS. Es gibt atomare Methoden wie `merge` und `compute`. Keine `null`-Keys.
- Wann nehmen Sie `synchronized`? → Wenn mehrere Felder zusammen konsistent sein müssen. Dann einen kleinen Block, nicht die ganze Methode.
- Was ist eine Race Condition? → Das Ergebnis hängt von der zeitlichen Reihenfolge der Threads ab.
- Was ist `Collections.synchronizedMap`? → Eine Map mit einer globalen Sperre. Korrekt, aber langsamer. Zusammengesetzte Schritte sind trotzdem nicht atomar.
- Wie testen Sie Thread-Safety? → Mit vielen Threads und einem `CountDownLatch`, dann die Summe prüfen. Es beweist nichts, findet aber Fehler.

## Don't say
- „Ich mache alles `synchronized`.“ Das ist korrekt, aber langsam.
- „`volatile` macht es thread-safe.“

## Words
- **thread-safe** = safe with many threads
- **atomar** = in one indivisible step
- **Race Condition** = timing-dependent bug
- **zustandslos** = stateless
- **Sperre** = lock
