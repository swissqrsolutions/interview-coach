---
id: coding-complexity
round: coding
tech: [java, python]
tier: 1
q: Welche Zeit- und Speicherkomplexität hat Ihre Lösung?
en: What is the time and space complexity of your solution?
---
## 30s
Ich sage immer zwei Dinge: Zeit und Speicher.
Mein Satz: „Die Zeit ist O(n), weil ich einmal durch die Liste gehe. Der Speicher ist O(n) für die HashMap.“
Ich nenne immer den Grund: welche Schleife, welche Datenstruktur.
Ich sage auch, was n ist. Zum Beispiel die Anzahl Wörter.
Bei zwei Grössen nenne ich beide: O(n · k), k ist die Wortlänge.
Soll ich die typischen Klassen kurz zeigen?

## 90s
**Die wichtigsten Klassen, von schnell nach langsam:**
| Klasse | Beispiel |
|---|---|
| O(1) | HashMap `get`, Array-Index |
| O(log n) | binäre Suche, Heap `push` / `pop` |
| O(n) | eine Schleife über alle Elemente |
| O(n log n) | Sortieren |
| O(n²) | zwei verschachtelte Schleifen |
| O(2ⁿ) | alle Teilmengen |

**So rechne ich laut:**
```python
counts = {}
for w in words:              # n Mal
    key = "".join(sorted(w)) # k log k pro Wort
    counts.setdefault(key, []).append(w)  # O(1) im Mittel
```
„Die Schleife läuft n Mal. In jeder Runde sortiere ich k Buchstaben. Das ist k log k. Zusammen O(n · k log k). Der Speicher ist O(n · k), weil alle Wörter in der Map liegen.“

**Regeln:**
- Nacheinander → addieren: O(n) + O(n log n) = O(n log n). Der grösste Teil gewinnt.
- Verschachtelt → multiplizieren: n Mal O(n) = O(n²).
- Konstanten fallen weg: O(2n) = O(n).

## 3min
**Feinheiten, die Senior wirken:**
- **Im Mittel vs. schlimmster Fall:** HashMap ist im Mittel O(1). Bei vielen Kollisionen schlechter. Quicksort im Mittel O(n log n), im schlimmsten Fall O(n²).
- **Amortisiert:** `ArrayList.add` oder Python `list.append` ist meistens O(1). Manchmal wird das Array kopiert. Über viele Aufrufe bleibt es O(1).
- **Versteckte Kosten:** `list.remove(0)` in Python ist O(n). `x in list` ist O(n), `x in set` ist O(1). String-Verkettung in einer Schleife kann O(n²) sein. In Java nehme ich `StringBuilder`.
- **Speicher zählt den Stack mit:** Rekursion mit Tiefe n braucht O(n) Stack. Das ist bei grossen Eingaben ein StackOverflowError.
- **Ausgabe nicht vergessen:** Gebe ich alle Paare zurück, ist der Speicher schon durch die Ausgabe O(n²).

**Praxis über Big-O hinaus:** Big-O sagt, wie es wächst, nicht wie schnell es ist. Bei 100 Elementen ist O(n²) oft egal. Bei 250 Millionen Zeilen nicht. Bei MATCH haben wir 250M+ Zeilen. Dort waren Partition Pruning und weniger I/O wichtiger als die CPU. Ich sage im Interview: „Für diese Grösse reicht das. Ab Millionen würde ich …“

**Den Trade-off nennen:** „Ich tausche Speicher gegen Zeit. Mit der HashMap brauche ich O(n) mehr Speicher, aber die Zeit geht von O(n²) auf O(n).“

## Follow-ups
- Was heisst amortisiert O(1)? → Die meisten Aufrufe sind billig, wenige teuer. Im Durchschnitt über viele Aufrufe ist es O(1).
- Was ist die Komplexität von `HashMap.get` im schlimmsten Fall? → Seit Java 8 O(log n), weil grosse Buckets zu Bäumen werden. Vorher O(n).
- Warum ist Sortieren O(n log n)? → Vergleichsbasiertes Sortieren braucht mindestens n log n Vergleiche. Java und Python nutzen für Objekte TimSort.
- Ist O(n) immer schneller als O(n log n)? → Nicht bei kleinen n. Konstanten und Cache spielen dann eine grössere Rolle.

## Don't say
- Nicht nur „Es ist schnell.“ Immer eine Klasse und einen Grund nennen.
- Nicht den Speicher vergessen.
- Nicht „HashMap ist immer O(1).“ Sagen Sie „im Mittel“.

## Words
- **Zeitkomplexität** = time complexity
- **Speicherkomplexität** = space complexity
- **verschachtelt** = nested
- **amortisiert** = amortized
- **im Mittel / im schlimmsten Fall** = average / worst case
