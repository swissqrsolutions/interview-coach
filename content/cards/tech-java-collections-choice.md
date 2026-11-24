---
id: tech-java-collections-choice
round: tech
tech: [java]
tier: 2
project: BIT DAZiT
q: Welche Collection wählen Sie wann? ArrayList, LinkedList, HashSet, TreeMap …?
en: Which collection do you choose when? ArrayList, LinkedList, HashSet, TreeMap …?
---
## 30s
Ich frage drei Dinge: Brauche ich Reihenfolge? Duplikate? Schnellen Zugriff per Key?
Für Listen nehme ich fast immer `ArrayList`.
Für eindeutige Werte `HashSet`, für Key-Value `HashMap`.
Brauche ich Sortierung, nehme ich `TreeMap` oder `TreeSet`.
Für Queues und Stacks nehme ich `ArrayDeque`.
In den Java-Services bei DAZiT war das tägliche Arbeit.
Soll ich die Komplexität vergleichen?

## 90s
| Collection | Get / Suche | Einfügen | Reihenfolge |
|---|---|---|---|
| `ArrayList` | Index O(1), Suche O(n) | Ende O(1) amortisiert | Einfüge-Reihenfolge |
| `LinkedList` | O(n) | Anfang/Ende O(1) | Einfüge-Reihenfolge |
| `HashSet` / `HashMap` | O(1) im Schnitt | O(1) | keine |
| `LinkedHashMap` | O(1) | O(1) | Einfüge- oder Zugriffs-Reihenfolge |
| `TreeMap` / `TreeSet` | O(log n) | O(log n) | sortiert |
| `ArrayDeque` | – | Anfang/Ende O(1) | Queue / Stack |
| `PriorityQueue` | Kopf O(1) | O(log n) | nach Priorität |

**Spezielle:**
- `EnumMap` / `EnumSet` für Enum-Keys: sehr schnell und klein.
- `ConcurrentHashMap` für parallelen Zugriff.
- `CopyOnWriteArrayList`: viel Lesen, sehr selten Schreiben, zum Beispiel Listener.

## 3min
**Warum fast nie LinkedList?** In der Theorie ist Einfügen O(1). In der Praxis muss man erst zur Stelle laufen: O(n). Jeder Knoten ist ein eigenes Objekt. Das ist schlecht für den CPU-Cache. `ArrayList` und `ArrayDeque` sind fast immer schneller.

**Warum nicht Stack und Vector?** Sie sind alt und synchronisiert. `ArrayDeque` ist der Ersatz.

**Java 21: Sequenced Collections.** Neue Interfaces mit `getFirst()`, `getLast()`, `reversed()`. `List`, `LinkedHashSet`, `LinkedHashMap` haben das jetzt einheitlich.

**LRU-Cache mit LinkedHashMap:**
```java
var cache = new LinkedHashMap<String, Rate>(16, 0.75f, true) {   // true = Zugriffs-Reihenfolge
    protected boolean removeEldestEntry(Map.Entry<String, Rate> e) { return size() > 1000; }
};
```
Für Produktion nehme ich aber lieber eine Library wie Caffeine. Sie ist thread-safe.

**Unveränderlich:** `List.of`, `Set.of`, `Map.of` für feste Daten. Kein `null` erlaubt. Ein Versuch zu ändern gibt `UnsupportedOperationException`.

**Grösse vorgeben:** Wenn ich die Grösse kenne, `new ArrayList<>(n)`. Das spart Kopieren.

## Follow-ups
- Wann nehmen Sie LinkedList? → Fast nie. Für Queue und Stack ist `ArrayDeque` besser.
- HashSet oder TreeSet? → HashSet ist schneller, O(1). TreeSet nur, wenn ich Sortierung oder Bereiche brauche, zum Beispiel `headSet`.
- Wie finden Sie die Top 10 aus einer Million Werten? → Eine `PriorityQueue` mit Grösse 10 als Min-Heap. Das ist O(n log 10).
- Was passiert bei List.of mit null? → Eine NullPointerException.
- Wie entferne ich Elemente beim Iterieren? → Mit `removeIf` oder dem Iterator. Sonst kommt eine `ConcurrentModificationException`.

## Don't say
- „LinkedList ist schneller beim Einfügen.“ Nur in der Theorie, wenn man schon an der Stelle ist.
- „Ich nehme immer HashMap.“ Ohne Grund wirkt das unreflektiert.

## Words
- **die Reihenfolge** = order
- **sortiert** = sorted
- **die Komplexität** = complexity (Big O)
- **amortisiert** = im Durchschnitt über viele Operationen
- **das Duplikat** = duplicate
