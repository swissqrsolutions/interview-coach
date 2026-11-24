---
id: coding-two-sum
round: coding
tech: [java, python]
tier: 1
q: Gegeben ist ein Array von Zahlen und ein Ziel. Finden Sie die zwei Indizes, deren Zahlen zusammen das Ziel ergeben.
en: Given an array of numbers and a target, find the two indices whose numbers add up to the target.
---
## 30s
Ich wiederhole: Ich bekomme `nums` und `target`. Ich gebe zwei Indizes zurück. Die zwei Zahlen ergeben zusammen das Ziel.
Meine Fragen: Gibt es immer genau eine Lösung? Darf ich ein Element zweimal nehmen? Gibt es negative Zahlen?
Einfache Lösung: zwei Schleifen, jedes Paar prüfen. Das ist O(n²).
Bessere Lösung: eine HashMap. Ich speichere jede Zahl mit ihrem Index.
Für jede Zahl suche ich `target - zahl` in der Map. Das ist O(n).
Soll ich das in Java oder in Python schreiben?

## 90s
**Idee laut gesagt:** „Ich gehe einmal durch das Array. Für jede Zahl rechne ich den Rest aus. Ist der Rest schon in der Map? Dann habe ich das Paar. Sonst speichere ich die Zahl.“

**Java:**
```java
static int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> indexByValue = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int rest = target - nums[i];
        Integer j = indexByValue.get(rest);
        if (j != null) {
            return new int[] { j, i };
        }
        indexByValue.put(nums[i], i);
    }
    return new int[0]; // keine Lösung
}
```

**Python:**
```python
def two_sum(nums: list[int], target: int) -> list[int]:
    index_by_value = {}
    for i, n in enumerate(nums):
        rest = target - n
        if rest in index_by_value:
            return [index_by_value[rest], i]
        index_by_value[n] = i
    return []
```

**Test von Hand:** `nums = [2, 7, 11, 15]`, `target = 9`.
- i = 0: Rest 7, nicht in der Map. Ich speichere 2 → 0.
- i = 1: Rest 2, ist in der Map. Ergebnis [0, 1].

## 3min
**Warum erst prüfen, dann speichern?** So nehme ich ein Element nicht zweimal. Beispiel: `[3]`, Ziel 6. Ohne diese Reihenfolge finde ich 3 + 3 mit demselben Index.

**Randfälle:**
- Leeres Array oder ein Element → keine Lösung.
- Duplikate: `[3, 3]`, Ziel 6 → [0, 1]. Das klappt, weil ich vor dem Speichern prüfe.
- Negative Zahlen → kein Problem für die HashMap.
- Keine Lösung → ich gebe ein leeres Array zurück. Oder ich werfe eine Exception. Ich frage, was gewünscht ist.

**Komplexität:** Zeit O(n), ein Durchlauf. Speicher O(n) für die Map.

**Alternative:** Sortieren und zwei Pointer. Zeit O(n log n), Speicher O(1) ohne Kopie. Aber durch das Sortieren verliere ich die originalen Indizes. Das ist gut, wenn man nur die Werte braucht.

**Ein kleiner Test in Java:**
```java
@Test
void findsPair() {
    assertArrayEquals(new int[] {0, 1}, twoSum(new int[] {2, 7, 11, 15}, 9));
    assertArrayEquals(new int[] {0, 1}, twoSum(new int[] {3, 3}, 6));
    assertEquals(0, twoSum(new int[] {1}, 5).length);
}
```

## Follow-ups
- Was ist, wenn das Array sortiert ist? → Dann nehme ich zwei Pointer, links und rechts. Zeit O(n), Speicher O(1).
- Was ist, wenn Sie alle Paare brauchen? → Ich sammle die Paare in einer Liste statt sofort zurückzugeben. Bei Duplikaten speichere ich eine Liste von Indizes pro Wert.
- Was ist der schlimmste Fall für eine HashMap? → Viele Kollisionen. Seit Java 8 werden grosse Buckets zu Bäumen, dann ist es O(log n) pro Zugriff.
- Warum `Integer j` und nicht `int j`? → `get` kann `null` liefern. Mit `int` gibt es eine NullPointerException beim Auspacken.

## Don't say
- Nicht direkt die HashMap-Lösung tippen, ohne die einfache Lösung zu nennen.
- Nicht vergessen zu sagen, dass ein Element nicht zweimal zählt.

## Words
- **Ziel** = target
- **Rest / Differenz** = complement
- **zwei Pointer** = two pointers
- **Durchlauf** = one pass
- **Kollision** = hash collision
