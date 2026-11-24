---
id: tech-java-hashmap
round: tech
tech: [java]
tier: 1
project: BIT DAZiT
q: Wie funktioniert eine HashMap intern? Und warum braucht man equals und hashCode?
en: How does a HashMap work internally? And why do you need equals and hashCode?
---
## 30s
Eine HashMap speichert Paare aus Key und Value.
Intern ist sie ein Array von Buckets.
Der hashCode vom Key bestimmt den Bucket.
Mit equals findet die Map den richtigen Key im Bucket.
Get und put sind im Durchschnitt O(1).
Ich nutze Maps täglich, zum Beispiel bei DAZiT mit Java 21 für Lookups in den Services.
Soll ich erklären, was bei Kollisionen passiert?

## 90s
**Ablauf bei `put(key, value)`:**
1. Java ruft `key.hashCode()` auf. Die Map mischt die oberen Bits mit den unteren Bits.
2. Der Index ist `hash & (n - 1)`. `n` ist die Grösse vom Array, immer eine Zweierpotenz.
3. Ist der Bucket leer, kommt der Eintrag hinein.
4. Ist der Bucket voll, vergleicht die Map mit `equals`. Gleicher Key = Value wird ersetzt. Sonst kommt ein neuer Knoten dazu.

**Kollisionen:** Mehrere Keys im selben Bucket bilden eine Liste. Ab 8 Einträgen in einem Bucket wird daraus ein Baum (Red-Black-Tree). Das passiert aber nur, wenn das Array mindestens 64 Plätze hat. Sonst vergrössert die Map zuerst das Array.

**Resize:** Start mit 16 Plätzen, Load Factor 0.75. Ab 12 Einträgen verdoppelt sich das Array. Alle Einträge werden neu verteilt.

**Der Vertrag:**
```java
// a.equals(b) == true  =>  a.hashCode() == b.hashCode()
record CaseKey(String tenant, long caseId) {}  // record: equals + hashCode automatisch
```

## 3min
**Typische Fehler:**
- Nur `equals` überschreiben, nicht `hashCode`. Dann findet `get` den Key nicht. Er liegt in einem anderen Bucket.
- Ein veränderbarer Key. Ich ändere ein Feld nach dem `put`. Der Hash ändert sich. Der Eintrag ist dann "verloren". Darum nehme ich unveränderliche Keys: String, Long oder ein Record.
- Ein schlechter `hashCode`, zum Beispiel immer `42`. Dann liegt alles in einem Bucket. Die Map wird langsam.

**Thread-Sicherheit:** HashMap ist nicht thread-safe. Bei parallelen Schreibzugriffen gehen Daten verloren. Dann nehme ich `ConcurrentHashMap`.

**Varianten:**
- `LinkedHashMap`: behält die Einfüge-Reihenfolge.
- `TreeMap`: sortiert nach Key, O(log n).
- `HashMap` erlaubt einen `null`-Key. `ConcurrentHashMap` erlaubt kein `null`.

**Performance-Tipp:** Wenn ich die Grösse kenne, gebe ich sie vor. Seit Java 19 gibt es `HashMap.newHashMap(1000)`. So spare ich Resizes.

## Follow-ups
- Was ist die Komplexität im schlechtesten Fall? → Mit Bäumen O(log n) pro Bucket. Vor Java 8 war es O(n).
- Warum ist die Grösse eine Zweierpotenz? → Dann geht der Index mit `hash & (n - 1)`. Das ist schneller als Modulo.
- Ist die Reihenfolge beim Iterieren fest? → Nein. Sie kann sich nach einem Resize ändern. Für feste Reihenfolge nehme ich `LinkedHashMap`.
- Was ist der Unterschied zu ConcurrentHashMap? → ConcurrentHashMap ist thread-safe und sperrt nur einzelne Buckets. Sie erlaubt kein `null`.
- Warum sind Records gute Keys? → Sie sind unveränderlich und haben equals und hashCode automatisch.

## Don't say
- „Gleicher hashCode heisst gleiches Objekt.“ Falsch. Zwei verschiedene Objekte können denselben Hash haben. Das ist eine Kollision.
- „HashMap ist immer O(1).“ Besser: im Durchschnitt O(1).

## Words
- **der Bucket** = Fach im internen Array
- **die Kollision** = zwei Keys im selben Bucket
- **der Load Factor** = wie voll die Map sein darf vor dem Resize
- **unveränderlich** = immutable
- **überschreiben** = to override
