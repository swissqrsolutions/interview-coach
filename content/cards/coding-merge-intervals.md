---
id: coding-merge-intervals
round: coding
tech: [java, python]
tier: 2
q: Gegeben ist eine Liste von Intervallen. Fassen Sie alle überlappenden Intervalle zusammen.
en: Given a list of intervals, merge all overlapping intervals.
---
## 30s
Ich wiederhole: Ich bekomme Paare [start, end]. Überlappende Paare fasse ich zu einem zusammen.
Beispiel: [1,3], [2,6], [8,10] gibt [1,6], [8,10].
Meine Fragen: Ist die Liste sortiert? Überlappen [1,4] und [4,5]? Darf ich die Eingabe ändern?
Die Idee: Zuerst nach Start sortieren. Dann einmal durchgehen und zusammenfassen.
Zeit O(n log n) wegen dem Sortieren.
Ein echtes Beispiel: Termine oder Zeiträume in einem Kalender.

## 90s
**Laut gesagt:** „Ich sortiere nach Start. Ich nehme das erste Intervall als aktuelles. Beginnt das nächste vor oder am Ende des aktuellen? Dann verlängere ich das Ende. Sonst ist das aktuelle fertig, und ich beginne ein neues.“

**Python:**
```python
def merge(intervals: list[list[int]]) -> list[list[int]]:
    if not intervals:
        return []
    intervals = sorted(intervals, key=lambda iv: iv[0])
    result = [intervals[0][:]]
    for start, end in intervals[1:]:
        last = result[-1]
        if start <= last[1]:
            last[1] = max(last[1], end)
        else:
            result.append([start, end])
    return result
```

**Java:**
```java
static List<int[]> merge(int[][] intervals) {
    List<int[]> result = new ArrayList<>();
    if (intervals.length == 0) return result;
    int[][] sorted = intervals.clone();
    Arrays.sort(sorted, Comparator.comparingInt(iv -> iv[0]));
    int[] current = sorted[0].clone();
    for (int i = 1; i < sorted.length; i++) {
        int[] next = sorted[i];
        if (next[0] <= current[1]) {
            current[1] = Math.max(current[1], next[1]);
        } else {
            result.add(current);
            current = next.clone();
        }
    }
    result.add(current);
    return result;
}
```

**Test von Hand:** [1,4], [2,3] → sortiert gleich. [2,3] liegt in [1,4]. Ende bleibt 4, wegen `max`. Ergebnis [1,4].

## 3min
**Die zwei typischen Bugs:**
- Ohne `max` wird [1,4] + [2,3] zu [1,3]. Das ist falsch.
- Am Ende das letzte Intervall vergessen. Darum `result.add(current)` nach der Schleife.

**Berühren gleich Überlappen?** [1,4] und [4,5]: Mit `<=` werden sie zu [1,5]. Mit `<` bleiben sie getrennt. Das frage ich. Bei Kalendern ist 10–11 Uhr und 11–12 Uhr oft kein Konflikt.

**Komplexität:** Zeit O(n log n) für das Sortieren, der Durchlauf ist O(n). Speicher O(n) für das Ergebnis und die Kopie.

**Warum kopieren?** Ich ändere die Eingabe des Aufrufers nicht. Das sage ich kurz. Es zeigt Sorgfalt.

**Verwandte Aufgaben:**
- Ein neues Intervall einfügen: gleiche Idee, die Liste ist schon sortiert, O(n).
- Wie viele Räume brauche ich? → Starts und Enden getrennt sortieren oder einen Min-Heap mit Endzeiten.
- In SQL: Überlappung prüfen mit `a.start < b.end AND b.start < a.end`.

## Follow-ups
- Was ist, wenn die Liste schon sortiert ist? → Dann fällt das Sortieren weg. Zeit O(n).
- Wie finden Sie, ob zwei Termine kollidieren? → `a.start < b.end && b.start < a.end`. Das ist die Standard-Formel.
- Was ist bei einem Strom von Intervallen? → Ich halte eine sortierte Struktur, zum Beispiel eine `TreeMap` nach Start, und fasse beim Einfügen zusammen.
- Wie viele Meetingräume braucht man mindestens? → Nach Start sortieren, Min-Heap mit Endzeiten. Die maximale Grösse des Heaps ist die Antwort.

## Don't say
- Nicht ohne Sortieren anfangen. Unsortiert klappt der Durchlauf nicht.
- Nicht „Berühren ist immer Überlappen.“ Fragen Sie nach.

## Words
- **Intervall** = interval (start, end)
- **überlappen** = to overlap
- **zusammenfassen** = to merge
- **sortieren nach** = to sort by
- **Durchlauf** = pass
