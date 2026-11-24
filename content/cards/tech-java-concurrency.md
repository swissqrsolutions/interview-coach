---
id: tech-java-concurrency
round: tech
tech: [java]
tier: 1
project: BIT DAZiT
q: Erklären Sie synchronized, volatile, ConcurrentHashMap und ExecutorService.
en: Explain synchronized, volatile, ConcurrentHashMap and ExecutorService.
---
## 30s
Bei Nebenläufigkeit gibt es zwei Probleme: Sichtbarkeit und Atomarität.
`synchronized` löst beides. Nur ein Thread darf in den Block.
`volatile` löst nur die Sichtbarkeit. Es ist kein Lock.
`ConcurrentHashMap` ist eine thread-sichere Map ohne globales Lock.
`ExecutorService` verwaltet einen Pool von Threads für Aufgaben.
In Spring-Services wie bei DAZiT sind Beans Singletons. Darum dürfen sie keinen veränderbaren Zustand ohne Schutz haben.
Soll ich ein Beispiel mit einem Zähler zeigen?

## 90s
**Das Problem:** `count++` sind drei Schritte: lesen, addieren, schreiben. Zwei Threads können sich überholen. Ein Update geht verloren.

**Lösungen:**
```java
private int count;
synchronized void inc() { count++; }          // Lock, korrekt

private volatile boolean running = true;      // nur Sichtbarkeit: Flag zum Stoppen

private final AtomicInteger hits = new AtomicInteger();
hits.incrementAndGet();                       // CAS, ohne Lock

private final ConcurrentHashMap<String, LongAdder> perTenant = new ConcurrentHashMap<>();
perTenant.computeIfAbsent(tenant, t -> new LongAdder()).increment();
```

**ExecutorService:**
```java
try (ExecutorService pool = Executors.newFixedThreadPool(8)) {
    Future<Report> f = pool.submit(() -> buildReport(id));
    Report r = f.get(5, TimeUnit.SECONDS);
}   // seit Java 19: close() wartet auf alle Aufgaben
```

**volatile:** Ein Thread schreibt, andere Threads sehen den neuen Wert sofort. Es gibt eine happens-before-Beziehung. Aber `count++` bleibt auch mit volatile falsch.

## 3min
**ConcurrentHashMap intern:** Seit Java 8 kein Segment-Lock mehr. Leere Buckets werden mit CAS gefüllt. Sonst sperrt sie nur den ersten Knoten im Bucket. Lesen braucht fast nie ein Lock.
- `computeIfAbsent` und `merge` sind atomar. Aber `if (!map.containsKey(k)) map.put(k, v)` ist nicht atomar.
- Iteratoren sind "weakly consistent": keine `ConcurrentModificationException`, aber vielleicht nicht der neuste Stand.

**ExecutorService-Fallen:**
- `newFixedThreadPool` hat eine unbegrenzte Queue. Bei Last wächst der Speicher bis zum OOM. Besser ein `ThreadPoolExecutor` mit begrenzter Queue und Rejection Policy.
- Pool nie vergessen zu schliessen. Sonst bleiben Threads hängen.
- Für I/O-lastige Aufgaben in Java 21: Virtual Threads statt grosser Pools.

**Deadlock:** Zwei Threads nehmen zwei Locks in anderer Reihenfolge. Lösung: immer dieselbe Reihenfolge, oder `tryLock` mit Timeout. Erkennen mit einem Thread Dump (`jcmd <pid> Thread.print`).

**Meine Regel:** Am besten kein geteilter Zustand. Unveränderliche Objekte, lokale Variablen, Zustand in der Datenbank. In Spring-Singletons halte ich keine Felder mit Request-Daten.

## Follow-ups
- Ist volatile genug für einen Zähler? → Nein. volatile macht `count++` nicht atomar. Ich nehme `AtomicInteger` oder `LongAdder`.
- Was ist der Unterschied zwischen synchronized und ReentrantLock? → ReentrantLock kann `tryLock` mit Timeout und Fairness. synchronized ist einfacher und wird automatisch freigegeben.
- Warum erlaubt ConcurrentHashMap kein null? → Sonst weiss man bei `get` nicht: fehlt der Key oder ist der Wert null? Das kann man parallel nicht sicher prüfen.
- Wie finden Sie einen Deadlock? → Thread Dump mit `jcmd` oder `jstack`. Die JVM zeigt "Found one Java-level deadlock".
- Was ist CompletableFuture? → Eine Future, die man verketten kann: `thenApply`, `thenCombine`. Gut für parallele Aufrufe ohne Blockieren.

## Don't say
- „volatile macht Code thread-safe.“ Nur Sichtbarkeit, keine Atomarität.
- „Collections.synchronizedMap ist dasselbe wie ConcurrentHashMap.“ Die erste sperrt die ganze Map, die zweite nur Buckets.

## Words
- **Nebenläufigkeit** = concurrency
- **die Sichtbarkeit** = visibility
- **atomar** = alles oder nichts, nicht unterbrechbar
- **der geteilte Zustand** = shared state
- **sperren** = to lock
