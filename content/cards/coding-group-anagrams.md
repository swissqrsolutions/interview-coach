---
id: coding-group-anagrams
round: coding
tech: [java, python]
tier: 2
q: Gruppieren Sie eine Liste von Wörtern nach Anagrammen.
en: Group a list of words by anagrams.
---
## 30s
Ich wiederhole: Wörter mit denselben Buchstaben kommen in eine Gruppe. Zum Beispiel „eat“, „tea“ und „ate“.
Meine Fragen: Nur Kleinbuchstaben a bis z? Leere Wörter erlaubt? Ist die Reihenfolge der Gruppen wichtig?
Die Idee: Jedes Anagramm hat denselben Schlüssel.
Der einfachste Schlüssel: das Wort mit sortierten Buchstaben. „eat“ wird „aet“.
Dann nehme ich eine Map: Schlüssel → Liste von Wörtern.
Zeit O(n · k log k), k ist die Wortlänge. Soll ich es schreiben?

## 90s
**Laut gesagt:** „Für jedes Wort sortiere ich die Buchstaben. Das ist der Schlüssel. Ich lege das Wort in die Liste zu diesem Schlüssel. Am Ende gebe ich alle Listen zurück.“

**Python:**
```python
from collections import defaultdict

def group_anagrams(words: list[str]) -> list[list[str]]:
    groups = defaultdict(list)
    for w in words:
        key = "".join(sorted(w))
        groups[key].append(w)
    return list(groups.values())
```

**Java:**
```java
static List<List<String>> groupAnagrams(List<String> words) {
    Map<String, List<String>> groups = new HashMap<>();
    for (String w : words) {
        char[] chars = w.toCharArray();
        Arrays.sort(chars);
        String key = new String(chars);
        groups.computeIfAbsent(key, k -> new ArrayList<>()).add(w);
    }
    return new ArrayList<>(groups.values());
}
```

**Test von Hand:** `["eat", "tea", "tan", "ate", "nat", "bat"]`
- „aet“ → eat, tea, ate
- „ant“ → tan, nat
- „abt“ → bat

## 3min
**Besserer Schlüssel: Buchstaben zählen.** Bei nur a bis z zähle ich jeden Buchstaben. Das Array mit 26 Zahlen ist der Schlüssel. Zeit O(n · k) statt O(n · k log k).
```python
def key_of(w: str) -> tuple:
    counts = [0] * 26
    for c in w:
        counts[ord(c) - ord("a")] += 1
    return tuple(counts)
```
In Python muss der Schlüssel hashbar sein. Darum ein Tuple, keine Liste.

**Trade-off:** Das Sortieren ist einfacher und klappt für alle Zeichen, auch Umlaute. Das Zählen ist schneller, aber nur für ein festes Alphabet. Bei kurzen Wörtern ist der Unterschied klein. Ich nehme zuerst das Sortieren und sage, dass Zählen schneller ist.

**Randfälle:** leere Liste → leeres Ergebnis. Leeres Wort → Schlüssel "", eigene Gruppe. Gross- und Kleinschreibung → ich frage, ob „Tea“ und „eat“ zusammen gehören.

**Komplexität:** Zeit O(n · k log k). Speicher O(n · k) für die Map.

## Follow-ups
- Warum braucht Java `computeIfAbsent`? → Es legt die Liste nur an, wenn der Schlüssel neu ist. Das spart ein `if`.
- Kann man ein `char[]` als Schlüssel nehmen? → Nein. Arrays haben in Java kein inhaltliches `equals` und `hashCode`. Darum mache ich einen String daraus.
- Wie geht es mit Java Streams? → `words.stream().collect(Collectors.groupingBy(this::sortedKey))`. Kürzer, aber im Interview erkläre ich zuerst die Schleife.
- Was ist bei Unicode? → Sortieren über Zeichen geht, aber Zählen mit 26 Feldern nicht. Dann nehme ich eine Map pro Wort oder das Sortieren.

## Don't say
- Nicht jedes Wort mit jedem anderen vergleichen, ohne das O(n² · k) zu nennen.
- Nicht eine Python-Liste als Dictionary-Schlüssel benutzen. Das gibt einen TypeError.

## Words
- **Anagramm** = same letters, different order
- **Schlüssel** = key
- **gruppieren** = to group
- **hashbar** = hashable
- **Alphabet** = set of allowed characters
