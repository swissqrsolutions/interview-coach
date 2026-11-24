---
id: coding-sliding-window
round: coding
tech: [java, python]
tier: 2
q: Finden Sie die Länge des längsten Teilstrings ohne wiederholte Zeichen.
en: Find the length of the longest substring without repeating characters.
---
## 30s
Ich wiederhole: Ich suche das längste zusammenhängende Stück ohne doppeltes Zeichen. Ich gebe die Länge zurück.
Beispiel: „abcabcbb“ gibt 3, für „abc“.
Meine Fragen: Welche Zeichen? Ist ein leerer String möglich?
Einfache Lösung: alle Teilstrings prüfen. Das ist O(n³) oder O(n²).
Bessere Lösung: ein Sliding Window mit zwei Zeigern und einer Map. Das ist O(n).
Soll ich das Fenster genauer erklären?

## 90s
**Idee laut gesagt:** „Ich habe ein Fenster von `left` bis `right`. Im Fenster gibt es keine Duplikate. Ich schiebe `right` nach rechts. Kommt ein Zeichen doppelt vor, springt `left` hinter das alte Vorkommen. Ich merke mir die grösste Fensterlänge.“

**Python:**
```python
def longest_unique(s: str) -> int:
    last_seen = {}
    left = 0
    best = 0
    for right, c in enumerate(s):
        if c in last_seen and last_seen[c] >= left:
            left = last_seen[c] + 1
        last_seen[c] = right
        best = max(best, right - left + 1)
    return best
```

**Java:**
```java
static int longestUnique(String s) {
    Map<Character, Integer> lastSeen = new HashMap<>();
    int left = 0, best = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        Integer prev = lastSeen.get(c);
        if (prev != null && prev >= left) {
            left = prev + 1;
        }
        lastSeen.put(c, right);
        best = Math.max(best, right - left + 1);
    }
    return best;
}
```

**Test von Hand:** „abba“
- a: Fenster „a“, best 1
- b: Fenster „ab“, best 2
- b: doppelt, left = 2, Fenster „b“
- a: altes a bei 0, das ist vor left. Fenster „ba“, best bleibt 2.

## 3min
**Der wichtige Randfall:** `last_seen[c] >= left`. Ohne diese Prüfung springt `left` bei „abba“ zurück. Dann ist das Ergebnis falsch: 3 statt 2. Diesen Fall teste ich immer laut.

**Komplexität:** Zeit O(n), jedes Zeichen einmal. Speicher O(min(n, Alphabet)).

**Variante mit Set:** `left` geht Schritt für Schritt nach rechts und entfernt Zeichen aus dem Set. Auch O(n), weil jeder Zeiger maximal n Schritte macht. Einfacher zu erklären, etwas mehr Arbeit.

**Das Muster Sliding Window erkenne ich so:**
- Es geht um ein zusammenhängendes Stück (Teilstring, Teilarray).
- Gesucht ist das längste oder kürzeste Stück mit einer Bedingung.
- Beispiele: Summe ≤ k, höchstens k verschiedene Zeichen, Fenster mit fester Grösse.

**Andere Randfälle:** leerer String → 0. Ein Zeichen → 1. Alle gleich, „bbbb“ → 1. Leerzeichen zählen auch als Zeichen.

## Follow-ups
- Wie geben Sie den Teilstring selbst zurück? → Ich speichere `left` und `right` beim besten Fenster. Am Ende `s[start:start+best]`.
- Geht es ohne Map? → Bei ASCII ja: ein Array mit 128 Feldern. Das ist schneller.
- Warum ist die Set-Variante auch O(n)? → `left` und `right` gehen nur vorwärts. Zusammen sind es höchstens 2n Schritte.
- Was ist mit höchstens k verschiedenen Zeichen? → Gleiches Fenster, aber ich zähle die Zeichen. Bei mehr als k schiebe ich `left` weiter.

## Don't say
- Nicht „Ich prüfe alle Teilstrings“ als Endlösung.
- Nicht `left = last_seen[c] + 1` ohne die Prüfung `>= left`. Das ist der klassische Bug.

## Words
- **Teilstring** = substring
- **zusammenhängend** = contiguous
- **Fenster** = window
- **Zeiger** = pointer
- **verschieben** = to move / shift
