---
tech: java
id: hashmap
title: HashMap
tier: 1
---
## In einem Satz
Eine HashMap speichert Paare aus Schlüssel und Wert. Sie findet einen Wert über den Hash des Schlüssels, meistens in konstanter Zeit O(1).

## Das Bild im Kopf
Stellen Sie sich einen Schrank mit 16 Schubladen vor.
Jeder Schlüssel bekommt eine Nummer: seinen Hash.
Aus dem Hash rechnet die HashMap die Schublade aus.
Sie legt das Paar in diese Schublade.
Beim Suchen rechnet sie wieder die Schublade aus und schaut nur dort nach.
Darum muss sie nicht alle Einträge durchsuchen.
Die Schubladen heissen **Buckets**. Der Schrank ist ein Array: `Node<K,V>[] table`.

## Wie es intern funktioniert

### 1. Der Aufbau
- Intern gibt es ein Array von Buckets: `table`.
- Jeder Eintrag ist ein `Node` mit vier Feldern: `hash`, `key`, `value`, `next`.
- `next` zeigt auf den nächsten Node im selben Bucket. So entsteht eine verkettete Liste.
- Das Array wird erst beim ersten `put` erstellt (lazy). Standardgrösse: 16.

### 2. put(key, value) Schritt für Schritt
1. Java ruft `key.hashCode()` auf.
2. HashMap mischt die Bits: `hash = h ^ (h >>> 16)`. Die oberen 16 Bits werden in die unteren gemischt. Grund: Für den Index zählen nur die unteren Bits. So verteilen sich die Schlüssel besser.
3. Der Index ist `(n - 1) & hash`. `n` ist die Grösse des Arrays, immer eine Zweierpotenz. Das `&` ist schneller als Modulo `%`.
4. Ist der Bucket leer, kommt der neue Node hinein.
5. Ist der Bucket voll, geht HashMap die Kette durch. Für jeden Node prüft sie: gleicher Hash **und** `equals()`?
   - Ja: der alte Wert wird ersetzt. `put` gibt den alten Wert zurück.
   - Nein: der neue Node kommt ans Ende der Kette.
6. Danach steigt `size`. Ist `size > threshold`, gibt es ein **Resize**.

### 3. get(key)
1. Hash berechnen, Index berechnen.
2. Im Bucket den ersten Node prüfen.
3. Sonst die Kette (oder den Baum) durchgehen, mit Hash-Vergleich und `equals()`.
4. Nichts gefunden: `null`.

### 4. Kollisionen
- Eine Kollision heisst: zwei Schlüssel landen im selben Bucket.
- Das ist normal. Die Kette löst das (**Separate Chaining**).
- Viele Kollisionen machen die Map langsam: Suche in einer Liste ist O(n).

### 5. Treeify (seit Java 8)
- Hat ein Bucket **8 oder mehr** Nodes, wird die Liste zu einem **Rot-Schwarz-Baum** (`TreeNode`).
- Bedingung: Das Array hat mindestens **64** Buckets (`MIN_TREEIFY_CAPACITY`). Sonst macht HashMap zuerst ein Resize.
- Im Baum ist die Suche O(log n) statt O(n).
- Fällt ein Baum beim Resize auf **6** oder weniger Nodes, wird er wieder eine Liste (`UNTREEIFY_THRESHOLD`).
- Grund für diese Funktion: Schutz gegen Angriffe mit vielen gleichen Hashes (Hash-Flooding).
- Im Baum hilft es, wenn die Schlüssel `Comparable` sind.

### 6. Load Factor und Resize
- **Load Factor** = wie voll die Map sein darf. Standard: **0.75**.
- **Threshold** = Kapazität × Load Factor. Bei 16 Buckets: 12.
- Beim 13. Eintrag verdoppelt HashMap das Array: 16 → 32.
- Alle Einträge werden neu verteilt (**Rehash**). Das kostet O(n).
- Trick seit Java 8: Ein Eintrag bleibt am gleichen Index oder geht auf `index + alteGrösse`. Nur ein Bit entscheidet. Die Reihenfolge in der Kette bleibt erhalten.
- 0.75 ist ein Kompromiss zwischen Speicher und Geschwindigkeit.

### 7. null
- **Ein** `null`-Schlüssel ist erlaubt. Er liegt immer in Bucket 0 (Hash 0).
- Viele `null`-Werte sind erlaubt.
- Achtung: `get()` gibt `null` zurück, wenn der Schlüssel fehlt **oder** der Wert `null` ist. Darum gibt es `containsKey()`.

### 8. Iteration
- Iteration geht über alle Buckets. Kosten: O(Kapazität + Anzahl).
- Die Reihenfolge ist **nicht garantiert**. Sie kann sich nach einem Resize ändern.
- Ändert man die Map während der Iteration (nicht über den Iterator), kommt eine `ConcurrentModificationException`. Das ist **fail-fast**, aber nur "best effort", keine Garantie.

## Der equals/hashCode-Vertrag
- Gleiche Objekte (`equals` = true) **müssen** den gleichen `hashCode` haben.
- Gleicher `hashCode` heisst nicht gleiche Objekte (Kollision ist erlaubt).
- Überschreibt man nur `equals`, nicht `hashCode`: Die Map findet den Schlüssel nicht mehr. Zwei "gleiche" Objekte landen in verschiedenen Buckets.
- Ein **veränderbarer Schlüssel** ist gefährlich: Ändert sich ein Feld nach dem `put`, ändert sich der Hash. Die Map sucht dann im falschen Bucket. Der Eintrag ist "verloren", aber er belegt noch Speicher.
- Darum: unveränderliche Schlüssel nutzen. `String`, `Integer`, Records.
- `String` speichert seinen Hash nach dem ersten Aufruf (Cache). Darum ist `String` ein schneller Schlüssel.

## Komplexität
| Operation | normal | schlimmster Fall vor Java 8 | schlimmster Fall ab Java 8 |
|---|---|---|---|
| get / put / remove | O(1) | O(n) | O(log n) |
| containsValue | O(n) | O(n) | O(n) |
| Iteration | O(Kapazität + n) | | |
| Resize | O(n), selten | | |

O(1) ist **amortisiert**: im Durchschnitt, über viele Operationen.

## Vergleich mit anderen Maps
| | Reihenfolge | null-Schlüssel | Thread-sicher | Zeit |
|---|---|---|---|---|
| HashMap | keine | 1 erlaubt | nein | O(1) |
| LinkedHashMap | Einfüge- oder Zugriffsreihenfolge | 1 erlaubt | nein | O(1) |
| TreeMap | sortiert | nein (ausser eigener Comparator) | nein | O(log n) |
| Hashtable | keine | nein | ja, alles synchronized (alt) | O(1), langsam |
| ConcurrentHashMap | keine | nein | ja, fein gesperrt | O(1) |
| EnumMap | Enum-Reihenfolge | nein | nein | sehr schnell, Array |
| WeakHashMap | keine | 1 erlaubt | nein | Schlüssel werden vom GC entfernt |
| IdentityHashMap | keine | 1 erlaubt | nein | vergleicht mit `==` statt `equals` |

**HashMap vs Hashtable:** Hashtable ist alt (Java 1.0). Jede Methode ist `synchronized`. Kein `null`. Heute nimmt man `ConcurrentHashMap`.

**HashMap vs ConcurrentHashMap:** HashMap ist nicht thread-sicher. Bei gleichzeitigen Writes gehen Daten verloren. Vor Java 8 konnte ein gleichzeitiges Resize sogar eine Endlosschleife erzeugen. ConcurrentHashMap sperrt nur einzelne Buckets (CAS und `synchronized` auf dem ersten Node). Sie erlaubt kein `null`, weil man sonst "fehlt" und "null" nicht unterscheiden kann.

**HashMap vs HashSet:** Ein HashSet ist intern eine HashMap. Die Elemente sind die Schlüssel. Der Wert ist immer dasselbe Dummy-Objekt.

## Wann nutzen – Praxis
- Schneller Zugriff über einen Schlüssel: Cache, Lookup-Tabelle, Zählen, Gruppieren.
- Zählen: `map.merge(wort, 1, Integer::sum)`
- Gruppieren: `map.computeIfAbsent(kunde, k -> new ArrayList<>()).add(bestellung)`
- Mit Streams: `Collectors.groupingBy(...)` liefert eine HashMap.
- Grösse vorher bekannt? Kapazität setzen, dann kein Resize. Seit Java 19: `HashMap.newHashMap(1000)` rechnet den Load Factor selbst ein. Vorher: `new HashMap<>(1000)` reicht **nicht** für 1000 Einträge ohne Resize (nur für 750).
- Unveränderliche kleine Map: `Map.of(...)` (keine `null`, Reihenfolge zufällig).

## Nachteile und Fallen
- **Nicht thread-sicher.** Für mehrere Threads: `ConcurrentHashMap`.
- **Keine Reihenfolge.** Wenn Reihenfolge wichtig ist: `LinkedHashMap` oder `TreeMap`.
- **Speicher:** Jeder Eintrag ist ein eigenes Objekt (ca. 32–48 Bytes plus Schlüssel und Wert). Für Millionen kleiner Einträge ist das viel.
- **Schlechter hashCode** = viele Kollisionen = langsam.
- **Veränderbare Schlüssel** = verlorene Einträge, Memory Leak.
- **Resize** kostet Zeit. In Hot Paths die Kapazität vorher setzen.
- **Autoboxing:** `HashMap<Integer, Integer>` erzeugt viele Objekte.
- `get() == null` sagt nicht, ob der Schlüssel fehlt.

## Was hat sich mit den Versionen geändert
- **Java 8:** Treeify (Bäume ab 8 Nodes), neues Resize ohne Umkehr der Kette, Einfügen am Ende statt am Anfang, neue Methoden: `getOrDefault`, `putIfAbsent`, `computeIfAbsent`, `compute`, `merge`, `forEach`, `replaceAll`.
- **Java 9:** `Map.of()` und `Map.ofEntries()` für unveränderliche Maps.
- **Java 19:** `HashMap.newHashMap(int)`.
- **Java 21:** `SequencedMap` für geordnete Maps (`LinkedHashMap`, `TreeMap`), nicht für HashMap.

## In meinem Projekt
*(Ihr echtes Beispiel: Wo haben Sie eine HashMap bewusst eingesetzt, z. B. ein Lookup oder ein Cache in DAZiT oder CARIAD?)*
Allgemein gut zu sagen: „Für Lookups über eine ID nehme ich eine HashMap. Bei mehreren Threads eine ConcurrentHashMap. Wenn die Reihenfolge zählt, eine LinkedHashMap.“

## Interviewfragen mit Antworten
- Wie funktioniert eine HashMap intern? → Array von Buckets. Index aus dem Hash des Schlüssels. Kollisionen in einer Liste, ab 8 Einträgen in einem Baum. Bei 75 % Füllung verdoppelt sie das Array.
- Was passiert bei `put()`? → hashCode, Bits mischen, Index berechnen, Bucket prüfen, mit equals vergleichen, ersetzen oder anhängen, eventuell Resize.
- Was ist eine Kollision? → Zwei Schlüssel im selben Bucket. Normal. Gelöst mit Verkettung.
- Wie wird eine Kollision gelöst? → Separate Chaining: verkettete Liste, ab 8 Nodes Rot-Schwarz-Baum.
- Warum ist die Kapazität immer eine Zweierpotenz? → Dann ist `(n-1) & hash` gleich wie Modulo, aber schneller. Und das Resize kann Einträge mit einem Bit neu verteilen.
- Warum `h ^ (h >>> 16)`? → Für den Index zählen nur die unteren Bits. Das Mischen bringt die oberen Bits dazu. Weniger Kollisionen.
- Was ist der Load Factor? → Wie voll die Map sein darf, bevor sie wächst. Standard 0.75.
- Warum 0.75? → Guter Kompromiss: wenig Kollisionen, nicht zu viel leerer Speicher.
- Was ist Rehashing? → Beim Resize werden alle Einträge auf das neue, doppelt so grosse Array verteilt.
- Was ist Treeify? → Ab 8 Nodes in einem Bucket (und mindestens 64 Buckets) wird die Liste ein Rot-Schwarz-Baum. Suche O(log n).
- Warum nicht sofort ein Baum? → Ein TreeNode braucht etwa doppelt so viel Speicher. Bei guten Hashes sind Ketten sehr kurz.
- Komplexität von get? → Normal O(1), schlimmster Fall O(log n) ab Java 8, vorher O(n).
- Darf ein Schlüssel null sein? → Ja, einer. Er liegt in Bucket 0. In ConcurrentHashMap nicht.
- Was passiert, wenn ich equals überschreibe, aber nicht hashCode? → Gleiche Objekte haben verschiedene Hashes. Die Map findet sie nicht. Duplikate entstehen.
- Was passiert mit einem veränderbaren Schlüssel? → Ändert sich der Hash, sucht die Map im falschen Bucket. Der Eintrag ist nicht mehr erreichbar. Memory Leak.
- Warum ist String ein guter Schlüssel? → Unveränderlich, Hash wird gecacht, equals ist korrekt.
- Ist HashMap thread-sicher? → Nein. Daten gehen verloren. Lösung: ConcurrentHashMap.
- HashMap vs Hashtable? → Hashtable ist alt, ganz synchronized, ohne null. Heute ConcurrentHashMap.
- HashMap vs ConcurrentHashMap? → CHM ist thread-sicher, sperrt fein (CAS und Bucket-Lock), kein null, Iteratoren sind weakly consistent statt fail-fast.
- HashMap vs TreeMap? → TreeMap ist sortiert (Rot-Schwarz-Baum), O(log n). HashMap ist ungeordnet, O(1).
- HashMap vs LinkedHashMap? → LinkedHashMap merkt sich die Reihenfolge mit einer doppelt verketteten Liste. Mit accessOrder kann man einen LRU-Cache bauen.
- Wie baue ich einen LRU-Cache? → LinkedHashMap mit accessOrder = true und `removeEldestEntry` überschreiben.
- Wie ist HashSet aufgebaut? → Intern eine HashMap. Element = Schlüssel, Wert = Dummy.
- Was ist ConcurrentModificationException? → Die Map wurde während der Iteration geändert. Lösung: `iterator.remove()` oder `removeIf`.
- Wie entferne ich Einträge beim Durchlaufen? → `map.entrySet().removeIf(e -> ...)`.
- Was ist schneller: keySet + get oder entrySet? → entrySet. Kein zweites Suchen.
- Wie gross wird die Map mit `new HashMap<>(100)`? → Die nächste Zweierpotenz: 128. Threshold 96.
- Wie reserviere ich Platz für 1000 Einträge? → `HashMap.newHashMap(1000)` (Java 19+) oder Kapazität 1000 / 0.75 + 1.
- Was macht computeIfAbsent? → Gibt den Wert zurück. Fehlt er, wird er berechnet und gespeichert. Gut zum Gruppieren.
- Was macht merge? → Kombiniert den alten und den neuen Wert. Gut zum Zählen.
- Kann eine HashMap ein Memory Leak verursachen? → Ja: wachsende Caches ohne Limit oder veränderte Schlüssel.
- Was ist Hash-Flooding? → Ein Angreifer schickt viele Schlüssel mit gleichem Hash. Die Map wird langsam. Treeify begrenzt den Schaden auf O(log n).
- Was passiert beim Resize unter mehreren Threads? → Vor Java 8 konnte eine Endlosschleife entstehen. Heute gehen trotzdem Daten verloren. Nie ohne Synchronisation teilen.
- Welche Reihenfolge hat die Iteration? → Keine garantierte. Sie kann sich nach einem Resize ändern.
- Wie viel Speicher braucht ein Eintrag? → Ungefähr 32 bis 48 Bytes für den Node, plus Schlüssel und Wert.
- Wann nehmen Sie keine HashMap? → Bei Threads (CHM), bei Sortierung (TreeMap), bei Reihenfolge (LinkedHashMap), bei Enum-Schlüsseln (EnumMap), bei Millionen primitiver Werte (spezielle Bibliotheken oder Arrays).

## Fangfragen
- „HashMap hat immer O(1).“ → Falsch. Nur im Durchschnitt. Schlimmster Fall O(log n), Resize O(n).
- „Gleicher hashCode heisst gleiches Objekt.“ → Falsch. Nur umgekehrt: gleiches Objekt braucht gleichen Hash.
- „Collections.synchronizedMap ist so gut wie ConcurrentHashMap.“ → Nein. Ein Lock für alles, und beim Iterieren muss man selbst synchronisieren.
- „Map.of() erlaubt null.“ → Nein, NullPointerException. Und die Reihenfolge ist zufällig.
- „new HashMap<>(1000) speichert 1000 Einträge ohne Resize.“ → Nein. Kapazität 1024, Threshold 768.
- „Ab 8 Einträgen in einem Bucket gibt es immer einen Baum.“ → Nur wenn das Array mindestens 64 Buckets hat. Sonst Resize.

## Wörter
- **Bucket** = Fach im Array
- **Kollision** = zwei Schlüssel im selben Fach
- **Load Factor** = Füllgrad, ab dem die Map wächst
- **Resize / Rehash** = Array verdoppeln und neu verteilen
- **Treeify** = Liste wird zum Baum
- **amortisiert** = im Durchschnitt über viele Operationen
- **fail-fast** = bricht sofort ab, wenn etwas falsch ist
