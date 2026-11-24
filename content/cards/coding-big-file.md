---
id: coding-big-file
round: coding
tech: [java, python]
tier: 2
q: Eine Logdatei ist 50 GB gross. Zählen Sie die Wörter und geben Sie die 10 häufigsten aus.
en: A log file is 50 GB. Count the words and print the 10 most frequent ones.
---
## 30s
Ich wiederhole: Die Datei ist grösser als der Arbeitsspeicher. Ich zähle Wörter und gebe die Top 10 aus.
Meine Fragen: Wie viele verschiedene Wörter gibt es ungefähr? Gross- und Kleinschreibung gleich? Was ist ein Wort?
Die wichtigste Regel: Ich lade nie die ganze Datei. Ich lese sie als Stream, Zeile für Zeile.
Der Speicher hängt dann von der Anzahl verschiedener Wörter ab, nicht von der Dateigrösse.
Für die Top 10 nehme ich einen Heap mit Grösse 10.
Passt die Zählung nicht in den Speicher, teile ich die Arbeit auf.

## 90s
**Python:**
```python
import heapq
import re
from collections import Counter

WORD = re.compile(r"\w+")

def top_words(path: str, k: int = 10) -> list[tuple[str, int]]:
    counts = Counter()
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:  # liest Zeile für Zeile, nicht alles
            counts.update(w.lower() for w in WORD.findall(line))
    return heapq.nlargest(k, counts.items(), key=lambda kv: kv[1])
```

**Java:**
```java
static List<Map.Entry<String, Long>> topWords(Path path, int k) throws IOException {
    Pattern word = Pattern.compile("\\W+");
    Map<String, Long> counts;
    try (Stream<String> lines = Files.lines(path, StandardCharsets.UTF_8)) {
        counts = lines
            .flatMap(word::splitAsStream)
            .filter(w -> !w.isEmpty())
            .map(String::toLowerCase)
            .collect(Collectors.groupingBy(w -> w, Collectors.counting()));
    }
    return counts.entrySet().stream()
        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
        .limit(k)
        .toList();
}
```
Laut gesagt: „`Files.lines` ist lazy. Es liest nur die nächste Zeile. Das try-with-resources schliesst die Datei.“

**Test von Hand:** „a b a“ und „B a“ → a: 3, b: 2.

## 3min
**Was, wenn die Map zu gross wird?** Zum Beispiel eine Milliarde verschiedene IDs.
1. **Aufteilen nach Hash:** Ich lese die Datei einmal. Jedes Wort schreibe ich in eine von 100 Teildateien, nach `hash(wort) % 100`. Gleiche Wörter landen in derselben Teildatei.
2. **Pro Teildatei zählen:** Jede Teildatei passt in den Speicher. Ich zähle und halte die lokalen Top 10.
3. **Zusammenführen:** Die globalen Top 10 sind unter den lokalen Top 10.
Das ist die Idee von MapReduce. Mit Spark ist es ein Einzeiler: `groupBy("word").count().orderBy(desc("count")).limit(10)`.

**Weitere Punkte:**
- **Sehr lange Zeilen:** Eine Datei ohne Zeilenumbruch ist eine einzige riesige Zeile. Dann lese ich in Blöcken, zum Beispiel 1 MB, und achte auf Wörter an der Blockgrenze.
- **Encoding:** Kaputte Bytes sollen den Job nicht stoppen. In Python `errors="replace"`. In Java wirft `Files.lines` bei ungültigem UTF-8 eine `UncheckedIOException`. Dann nehme ich einen `BufferedReader` mit einem toleranten Decoder.
- **Schneller:** Parallel lesen geht bei einer Datei nur mit Byte-Bereichen. Oft ist die Festplatte der Engpass, nicht die CPU. Das messe ich zuerst.
- **Ungefähr reicht?** Count-Min Sketch zählt mit festem Speicher, aber nicht ganz genau.

**Komplexität:** Zeit O(n) über alle Wörter. Speicher O(u), u = verschiedene Wörter. Top k mit Heap O(u log k).

## Follow-ups
- Warum nicht `readAllLines` oder `f.read()`? → Das lädt 50 GB in den Speicher. Das gibt einen OutOfMemoryError oder den OOM-Killer.
- Ist `Files.lines` parallel schneller? → Kaum. `.parallel()` teilt eine Datei schlecht auf, und die Platte ist oft der Engpass. Ich messe zuerst.
- Wie verarbeiten Sie die Datei in einer Pipeline? → Als Batch-Job in Spark, die Datei liegt im Object Storage. Spark teilt sie in Blöcke und zählt verteilt.
- Wie testen Sie das ohne 50 GB? → Mit einer kleinen Datei für die Logik. Für den Speicher ein Test mit kleinem Heap, zum Beispiel `-Xmx64m` und einer generierten Datei.

## Don't say
- „Ich lese die Datei in eine Liste.“ Das ist bei grossen Dateien falsch.
- Nicht vergessen, die Datei zu schliessen. In Java immer try-with-resources um `Files.lines`.

## Words
- **Stream / streamen** = read piece by piece
- **Arbeitsspeicher** = RAM
- **Engpass** = bottleneck
- **Teildatei** = partition file, chunk
- **zusammenführen** = to merge
