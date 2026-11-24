---
id: coding-when-stuck
round: coding
tech: [java, python]
tier: 1
q: Sie kommen bei der Aufgabe nicht weiter. Was machen Sie jetzt?
en: You are stuck on the task. What do you do now?
---
## 30s
Ich bleibe ruhig und sage es offen: „Ich stecke gerade fest. Ich denke laut weiter.“
Dann mache ich vier Dinge.
1. Ich nehme ein kleines Beispiel und löse es von Hand.
2. Ich schreibe die einfache Lösung, auch wenn sie langsam ist.
3. Ich frage mich: Welches Muster passt? HashMap, zwei Zeiger, Sliding Window, Sortieren, Heap?
4. Ich frage den Interviewer nach einem Hinweis. Das ist erlaubt.
Stille ist schlimmer als eine langsame Lösung.

## 90s
**Sätze, die ich sagen kann:**
- „Ich stecke gerade fest. Darf ich laut überlegen?“
- „Ich mache zuerst ein kleines Beispiel auf Papier.“
- „Die einfache Lösung ist O(n²). Ich schreibe sie zuerst. Dann verbessere ich sie.“
- „Welche Information habe ich noch nicht benutzt? Die Liste ist sortiert. Das hilft vielleicht.“
- „Darf ich einen kleinen Hinweis bekommen?“
- „Ich glaube, hier ist ein Fehler. Ich gehe den Code mit dem Beispiel Zeile für Zeile durch.“

**Wenn der Code einen Fehler hat:**
1. Ich nehme das kleinste Beispiel, das falsch ist.
2. Ich gehe den Code laut durch und schreibe die Variablen auf.
3. Ich vergleiche mit dem erwarteten Wert. Wo weicht es ab?
4. Erst dann ändere ich den Code. Nicht raten.

**Checkliste für Muster:**
- Suchen in O(1)? → HashMap oder Set.
- Sortiert oder sortierbar? → zwei Zeiger oder binäre Suche.
- Zusammenhängendes Stück? → Sliding Window.
- Top k? → Heap.
- Baum oder Graph? → BFS oder DFS.
- Klammern, „zurück zum letzten“? → Stack.

## 3min
**Was der Interviewer sehen will:** Wie ich mit Problemen umgehe. Im Alltag stecke ich auch fest. Ruhig bleiben und strukturiert vorgehen ist ein Senior-Signal.

**Einen Hinweis gut nutzen:** Ich wiederhole den Hinweis in meinen Worten. Dann sage ich, was er für meine Lösung bedeutet. „Sie meinen, ich soll mir gesehene Werte merken. Dann brauche ich eine HashMap.“

**Wenn die Zeit knapp wird:**
- Ich sage ehrlich: „Ich schaffe die optimale Lösung nicht mehr ganz. Ich zeige die einfache Lösung, die funktioniert.“
- Ich beschreibe die bessere Lösung in Worten und sage die Komplexität.
- Ich schreibe Kommentare für die Teile, die fehlen: `// TODO: Randfall leere Liste`.

**Typische Ursachen für Blockaden:**
- Ich habe die Aufgabe nicht ganz verstanden. → Zurück zu den Fragen und einem Beispiel.
- Ich will sofort die perfekte Lösung. → Zuerst die einfache.
- Nervosität. → Langsam atmen. Einen Schritt zurück. Ein Beispiel auf Papier.

**Übung:** Ich übe mit Timer und ohne KI. Ich spreche laut, auch allein. So wird das Sprechen beim Denken normal.

## Follow-ups
- Ist es schlecht, nach einem Hinweis zu fragen? → Nein. Im Team frage ich auch. Schlecht ist, zehn Minuten still zu sein.
- Was machen Sie, wenn Ihre Lösung falsch ist und die Zeit vorbei ist? → Ich sage, wo der Fehler wahrscheinlich ist und wie ich ihn finden würde. Das zeigt mein Vorgehen.
- Wie debuggen Sie ohne Debugger? → Mit einem kleinen Beispiel von Hand. Ich schreibe die Werte der Variablen pro Schritt auf.
- Was machen Sie im Alltag, wenn Sie feststecken? → Ich mache das Problem kleiner, lese Logs und Doku. Nach einer festen Zeit frage ich einen Kollegen.

## Don't say
- Nicht schweigen und auf den Bildschirm starren.
- Nicht „Das kann ich nicht.“ Besser: „Ich fange mit der einfachen Lösung an.“
- Nicht zufällig den Code ändern und hoffen.

## Words
- **feststecken** = to be stuck
- **Hinweis** = hint
- **laut überlegen** = think aloud
- **raten** = to guess
- **Blockade** = mental block
