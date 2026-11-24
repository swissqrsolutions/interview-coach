---
id: coding-top-k
round: coding
tech: [java, python]
tier: 2
q: Finden Sie die k häufigsten Elemente in einem Array.
en: Find the k most frequent elements in an array.
---
## 30s
Ich wiederhole: Ich zähle, wie oft jedes Element vorkommt. Ich gebe die k Elemente mit der höchsten Anzahl zurück.
Meine Fragen: Wie gross ist k im Vergleich zu n? Was ist bei Gleichstand? Ist die Reihenfolge wichtig?
Schritt 1: zählen mit einer HashMap, O(n).
Einfache Lösung: alle nach Anzahl sortieren, O(n log n).
Bessere Lösung: ein Min-Heap mit Grösse k. Das ist O(n log k).
Soll ich mit dem Heap anfangen?

## 90s
**Laut gesagt:** „Ich zähle zuerst. Dann gehe ich durch die Zählung. Ich halte einen Min-Heap mit k Elementen. Ist der Heap zu gross, werfe ich das kleinste raus. Am Ende bleiben die k grössten.“

**Python:**
```python
import heapq
from collections import Counter

def top_k(nums: list[int], k: int) -> list[int]:
    counts = Counter(nums)
    heap = []
    for value, count in counts.items():
        heapq.heappush(heap, (count, value))
        if len(heap) > k:
            heapq.heappop(heap)
    return [value for count, value in heap]
```
Kurz geht es auch so: `[v for v, c in Counter(nums).most_common(k)]`. Ich zeige aber zuerst den Heap.

**Java:**
```java
static List<Integer> topK(int[] nums, int k) {
    Map<Integer, Integer> counts = new HashMap<>();
    for (int n : nums) counts.merge(n, 1, Integer::sum);

    PriorityQueue<Map.Entry<Integer, Integer>> heap =
        new PriorityQueue<>(Map.Entry.comparingByValue());
    for (Map.Entry<Integer, Integer> e : counts.entrySet()) {
        heap.offer(e);
        if (heap.size() > k) heap.poll();
    }
    List<Integer> result = new ArrayList<>();
    for (Map.Entry<Integer, Integer> e : heap) result.add(e.getKey());
    return result;
}
```

**Test von Hand:** `[1,1,1,2,2,3]`, k = 2. Zählung: 1→3, 2→2, 3→1. Der Heap wirft die 3 raus. Ergebnis {1, 2}.

## 3min
**Warum ein Min-Heap und nicht ein Max-Heap?** Der Min-Heap hat nur k Elemente. Oben liegt das schwächste der Top k. Das werfe ich raus. Speicher O(k) für den Heap, Zeit O(n log k). Ein Max-Heap mit allen Elementen braucht O(n) Speicher im Heap.

**Bucket-Lösung, O(n):** Die Anzahl ist höchstens n. Ich mache ein Array von Listen. Index = Anzahl. Dann lese ich von hinten, bis ich k Elemente habe.
```python
def top_k_buckets(nums: list[int], k: int) -> list[int]:
    counts = Counter(nums)
    buckets = [[] for _ in range(len(nums) + 1)]
    for value, count in counts.items():
        buckets[count].append(value)
    result = []
    for count in range(len(buckets) - 1, 0, -1):
        for value in buckets[count]:
            result.append(value)
            if len(result) == k:
                return result
    return result
```

**Trade-off:** Buckets sind schneller, aber brauchen O(n) Speicher. Der Heap ist besser bei einem Datenstrom. Ich kenne n nicht vorher, und ich will nur k merken.

**Praxis:** Top 10 Fehlercodes aus Logs, Top-Produkte pro Tag. Bei sehr grossen Daten zählt man verteilt, zum Beispiel mit Spark `groupBy().count()` und dann `orderBy(desc).limit(k)`.

**Randfälle:** k = 0 → leere Liste. k grösser als Anzahl verschiedener Elemente → alle zurückgeben. Gleichstand → ich frage nach einer Regel, zum Beispiel kleinerer Wert zuerst.

## Follow-ups
- Was ist die Komplexität mit Sortieren? → O(n log n). Mit dem Heap O(n log k). Bei kleinem k ist das deutlich besser.
- Wie geht das bei einem endlosen Datenstrom? → Zählen in einer Map und einen Heap mit k halten. Bei zu wenig Speicher gibt es ungefähre Verfahren, zum Beispiel Count-Min Sketch.
- Warum ist die Python-Rückgabe nicht sortiert? → Ein Heap ist nur teilweise sortiert. Wenn nötig, sortiere ich am Ende die k Elemente, O(k log k).
- Was ist Quickselect? → Ein Verfahren wie Quicksort, aber nur auf einer Seite. Im Mittel O(n), im schlimmsten Fall O(n²).

## Don't say
- Nicht „Ein Heap ist sortiert.“ Nur das oberste Element ist sicher das kleinste.
- Nicht den Max-Heap mit allen Elementen als beste Lösung verkaufen.

## Words
- **häufig** = frequent
- **Heap / Prioritätswarteschlange** = heap / priority queue
- **Gleichstand** = tie
- **zählen** = to count
- **Datenstrom** = stream of data
