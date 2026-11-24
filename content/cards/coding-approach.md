---
id: coding-approach
round: coding
tech: [java, python]
tier: 1
q: Wir machen jetzt eine Live-Coding-Aufgabe. Wie gehen Sie vor?
en: We will now do a live coding task. How do you approach it?
---
## 30s
Ich arbeite in sieben Schritten. Ich sage jeden Schritt laut.
1. Ich wiederhole die Aufgabe in meinen Worten.
2. Ich frage nach der Eingabe: Grösse, leere Liste, Duplikate?
3. Ich sage zuerst eine einfache Lösung, auch wenn sie langsam ist.
4. Dann mache ich sie besser. Ich sage, warum.
5. Ich schreibe den Code.
6. Ich teste mit einem kleinen Beispiel, von Hand.
7. Ich sage die Komplexität: Zeit und Speicher.
Darf ich mit Schritt eins anfangen?

## 90s
**Beispiel: „Finde Duplikate in einer Liste.“**
1. **Wiederholen:** „Ich bekomme eine Liste von Zahlen. Ich gebe alle Zahlen zurück, die mehr als einmal vorkommen. Richtig?“
2. **Fragen:** „Wie gross ist die Liste? Darf sie leer sein? Soll jedes Duplikat nur einmal im Ergebnis stehen?“
3. **Einfach:** „Ich vergleiche jedes Element mit jedem anderen. Das ist O(n²).“
4. **Besser:** „Ich merke mir gesehene Zahlen in einem Set. Dann ist es O(n).“
5. **Code:**
```java
static Set<Integer> duplicates(List<Integer> nums) {
    Set<Integer> seen = new HashSet<>();
    Set<Integer> dups = new HashSet<>();
    for (int n : nums) {
        if (!seen.add(n)) {
            dups.add(n);
        }
    }
    return dups;
}
```
6. **Test:** „[1, 2, 1, 3, 2] gibt {1, 2}. Eine leere Liste gibt ein leeres Set.“
7. **Komplexität:** „Zeit O(n). Speicher O(n) für die zwei Sets.“

## 3min
**Warum diese Methode?**
- Der Interviewer bewertet das Denken, nicht nur den Code. Laut denken zeigt mein Denken.
- Die Fragen am Anfang verhindern, dass ich das falsche Problem löse.
- Die einfache Lösung zuerst gibt mir eine sichere Basis. Wenn die Zeit knapp ist, habe ich wenigstens etwas.

**Zeitplan für 45 Minuten:**
- 5 Minuten: verstehen und fragen.
- 5 Minuten: Ideen und Komplexität.
- 20 Minuten: Code.
- 10 Minuten: Testen und Fehler fixen.
- 5 Minuten: Komplexität und Verbesserungen.

**Typische Fehler und wie ich sie bemerke:**
- Ich schreibe sofort Code. → Ich zwinge mich zu Schritt 1 und 2.
- Ich bin still. → Ich sage jeden Gedanken, auch „Ich überlege kurz“.
- Ich vergesse Randfälle. → Ich prüfe immer: leer, ein Element, Duplikate, negative Zahlen, sehr gross.

**Sprache:** Java oder Python, je nach Wunsch. In Python bin ich schneller. In Java sind Typen klarer. Ich frage: „Welche Sprache ist Ihnen lieber?“

## Follow-ups
- Warum fangen Sie nicht direkt mit der besten Lösung an? → Die einfache Lösung zeigt, dass ich das Problem verstehe. Dann verbessere ich gezielt.
- Was machen Sie, wenn Sie die Aufgabe nicht verstehen? → Ich frage nach einem Beispiel mit Eingabe und Ausgabe.
- Schreiben Sie auch Tests? → Ja. Zuerst von Hand mit einem Beispiel. Wenn Zeit bleibt, schreibe ich einen kleinen Unit-Test.
- Dürfen Sie Hilfsmittel benutzen? → Ich frage am Anfang. Ohne KI ist für mich kein Problem.

## Don't say
- Nicht schweigend tippen. Stille wirkt wie Unsicherheit.
- Nicht „Das kenne ich von LeetCode“ und dann die Lösung auswendig schreiben. Zeigen Sie den Weg.

## Words
- **laut denken** = think aloud
- **Randfall** = edge case
- **Komplexität** = complexity (Big-O)
- **Eingabe / Ausgabe** = input / output
- **verbessern** = to improve
