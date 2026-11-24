---
id: tech-java-immutability
round: tech
tech: [java]
tier: 2
project: BIT DAZiT
q: Warum sind unveränderliche Objekte wichtig? Wie bauen Sie eine immutable Klasse in Java?
en: Why are immutable objects important? How do you build an immutable class in Java?
---
## 30s
Ein unveränderliches Objekt ändert sich nach dem Erstellen nie mehr.
Das macht Code einfacher und sicherer.
Es ist automatisch thread-safe. Man kann es ohne Lock teilen.
Es ist ein sicherer Key in einer HashMap.
In Java 21 nehme ich dafür meist einen Record. Bei DAZiT passt das gut für Events: Ein Event ist ein Fakt und ändert sich nicht.
Soll ich die Regeln für eine eigene Klasse zeigen?

## 90s
**Die Regeln:**
1. Alle Felder `private final`.
2. Keine Setter.
3. Die Klasse ist `final`, oder ein Record. So kann keine Unterklasse Zustand ändern.
4. Veränderbare Felder defensiv kopieren: beim Erstellen und beim Herausgeben.
5. Änderungen geben ein neues Objekt zurück ("wither").

```java
public record Declaration(String id, List<Item> items, Instant submittedAt) {
    public Declaration {
        items = List.copyOf(items);          // defensive Kopie, unveränderlich
    }
    public Declaration withItem(Item item) {
        var copy = new ArrayList<>(items);
        copy.add(item);
        return new Declaration(id, copy, submittedAt);
    }
}
```

**Gute Bausteine:** `String`, `Integer`, `BigDecimal`, `LocalDate`, `Instant`, `List.of`, `Map.of` sind schon unveränderlich.

## 3min
**Fallen:**
- `Collections.unmodifiableList(list)` ist nur eine Sicht. Ändert jemand die Original-Liste, ändert sich die Sicht mit. `List.copyOf` macht eine echte Kopie.
- `java.util.Date` ist veränderbar. Ich nehme `java.time`.
- Ein Record mit einem Array-Feld: Das Array bleibt veränderbar.
- `List.of` und `List.copyOf` erlauben kein `null`.

**Trade-offs:**
- Jede Änderung erzeugt ein neues Objekt. Für die meisten Business-Daten ist das egal. Der GC räumt junge Objekte billig weg.
- In einer engen Schleife mit Millionen Änderungen kann ein veränderbarer Builder besser sein.
- JPA-Entities sind veränderbar. Dirty Checking braucht das. Darum trenne ich: Entity intern, Record als DTO nach aussen.

**Warum es im Team hilft:** Weniger Fehler durch "wer hat das geändert?". Code-Reviews werden einfacher. Werte kann man frei zwischen Threads und Services teilen.

## Follow-ups
- Ist String unveränderlich? Warum? → Ja. So kann die JVM Strings im Pool teilen. Und Strings sind sichere Keys und sicher für Security-Checks.
- Was ist eine defensive Kopie? → Ich kopiere eine veränderbare Eingabe, bevor ich sie speichere. So kann der Aufrufer mein Objekt nicht von aussen ändern.
- Ist ein final-Feld schon genug? → Nein. final heisst nur: Die Referenz ändert sich nicht. Das Objekt dahinter kann sich ändern.
- Was ist der Unterschied zwischen List.of und unmodifiableList? → `List.of` ist eine echte unveränderliche Liste. `unmodifiableList` ist nur eine Sicht auf eine andere Liste.
- Wie macht man Änderungen bei vielen Feldern einfach? → Mit einem Builder oder "with"-Methoden, die ein neues Objekt zurückgeben.

## Don't say
- „final heisst unveränderlich.“ Nur die Referenz ist fest.
- „Immutability ist langsam.“ Meist ist der Unterschied nicht messbar.

## Words
- **unveränderlich** = immutable
- **die defensive Kopie** = defensive copy
- **die Sicht** = view
- **teilen** = to share
- **der Zustand** = state
