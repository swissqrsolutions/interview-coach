---
tech: java
id: jit-compiler
title: JIT-Compiler
tier: 1
---
## In einem Satz
Der JIT-Compiler (Just-in-Time) übersetzt häufig genutzten Bytecode während der Laufzeit in optimierten Maschinencode. Er nutzt dafür Messungen aus dem laufenden Programm.

## Das Bild im Kopf
Java läuft in zwei Schritten.
Zuerst übersetzt `javac` den Code in **Bytecode** (`.class`). Bytecode ist für keine echte CPU.
Dann startet die JVM. Sie **interpretiert** den Bytecode zuerst: Befehl für Befehl. Das ist langsam, aber sofort bereit.
Die JVM zählt, welche Methoden oft laufen. Diese heissen **Hot Spots**. Daher der Name "HotSpot JVM".
Nur die heissen Methoden übersetzt der JIT in echten Maschinencode für genau diese CPU.
Der Maschinencode liegt im **Code Cache**. Ab dann läuft die Methode schnell.

Wie ein Übersetzer: Zuerst übersetzt er mündlich, Satz für Satz. Sätze, die immer wieder kommen, schreibt er einmal sauber auf und liest sie danach nur noch ab.

## Wie es intern funktioniert

### 1. Warum nicht alles vorher kompilieren?
- Der JIT kennt das **echte Verhalten** zur Laufzeit: welche Klassen wirklich vorkommen, welche Zweige wirklich laufen.
- Damit kann er Dinge optimieren, die ein Compiler vorher nicht sicher weiss.
- Nachteil: Am Anfang ist das Programm langsam. Das heisst **Warm-up**.

### 2. Die Stufen: Interpreter, C1, C2 (Tiered Compilation)
Seit Java 8 ist **Tiered Compilation** Standard. Es gibt 5 Stufen:
| Stufe | Wer | Was |
|---|---|---|
| 0 | Interpreter | führt Bytecode aus, sammelt Profil |
| 1 | C1 | einfach optimiert, ohne Profil |
| 2 | C1 | mit wenig Profil |
| 3 | C1 | mit vollem Profil (sammelt Daten für C2) |
| 4 | C2 | stark optimiert, mit allen Profildaten |

- **C1 (Client Compiler):** kompiliert schnell, optimiert wenig. Gut für schnellen Start.
- **C2 (Server Compiler):** kompiliert langsam, optimiert stark. Gut für langen Betrieb.
- Normaler Weg einer heissen Methode: 0 → 3 → 4.
- Die JVM entscheidet mit **Zählern**: wie oft eine Methode aufgerufen wird (Invocation Counter) und wie oft Schleifen laufen (Backedge Counter).
- Die Kompilierung läuft in **eigenen Hintergrund-Threads**. Das Programm läuft währenddessen weiter, im Interpreter.

### 3. On-Stack Replacement (OSR)
- Problem: Eine Methode wird nur einmal aufgerufen, hat aber eine riesige Schleife.
- Der Invocation Counter bleibt bei 1. Trotzdem ist die Schleife heiss.
- Lösung: **OSR**. Die JVM kompiliert die Schleife und wechselt **mitten in der Ausführung** vom Interpreter in den kompilierten Code. Der Stack Frame wird ersetzt.

### 4. Die wichtigsten Optimierungen
- **Inlining:** Der Code einer kleinen Methode wird direkt in den Aufrufer kopiert. Kein Methodenaufruf mehr. Das ist die wichtigste Optimierung, weil sie weitere Optimierungen möglich macht. Kleine Methoden (Getter) werden fast immer inlined.
- **Escape Analysis:** Der JIT prüft, ob ein Objekt die Methode "verlässt". Wenn nicht:
  - **Scalar Replacement:** Das Objekt wird gar nicht erzeugt. Seine Felder werden lokale Variablen in Registern. Weniger Arbeit für den GC.
  - **Lock Elision:** Ein `synchronized` auf einem lokalen Objekt wird entfernt.
- **Loop-Optimierungen:** Loop Unrolling (mehrere Durchläufe auf einmal), Range Check Elimination (Array-Grenzen nur einmal prüfen), Vektorisierung mit SIMD-Befehlen.
- **Dead Code Elimination:** Code, der nie läuft oder dessen Ergebnis nie genutzt wird, fällt weg.
- **Constant Folding:** `3 * 4` wird schon beim Kompilieren 12.
- **Devirtualisierung:** Ein Interface-Aufruf hat oft nur eine echte Klasse. Der JIT ruft dann direkt diese Methode auf. Mit 1 Klasse: **monomorph**, mit 2: **bimorph**, mit mehr: **megamorph** (dann langsamer).
- **Intrinsics:** Für manche JDK-Methoden (z. B. `Math`, `System.arraycopy`, `String`-Methoden) hat die JVM fertigen, handoptimierten Maschinencode.

### 5. Spekulation und Deoptimierung
- C2 **spekuliert**: „Dieser Zweig lief nie, also lasse ich ihn weg.“ „Hier kommt immer nur Klasse A.“
- Ist die Annahme plötzlich falsch (z. B. eine neue Klasse wird geladen), passiert eine **Deoptimierung**.
- Die JVM wirft den Maschinencode weg und springt zurück in den Interpreter. Später kompiliert sie neu, mit dem neuen Wissen.
- Darum sieht man manchmal plötzliche, kurze Langsamkeit.
- Im Log heisst das "made not entrant".

### 6. Code Cache
- Der Maschinencode liegt im **Code Cache** (ausserhalb vom Heap). Grösse: `-XX:ReservedCodeCacheSize`.
- Ist er voll, kompiliert die JVM nichts Neues mehr. Das Programm wird langsam. Im Log: "CodeCache is full. Compiler has been disabled."

## Vergleich: JIT vs AOT vs Interpreter
| | Start | Höchstleistung | Speicher | Anpassung zur Laufzeit |
|---|---|---|---|---|
| Interpreter | sofort | langsam | wenig | nein |
| JIT (HotSpot) | langsam (Warm-up) | sehr hoch | mehr (Compiler, Code Cache, Profile) | ja |
| AOT (GraalVM Native Image) | sehr schnell (Millisekunden) | gut, oft etwas tiefer als JIT | wenig | nein, alles vorher festgelegt |

- **GraalVM Native Image:** Kompiliert alles vorher (Ahead-of-Time) zu einer Binärdatei. Sehr schneller Start, wenig Speicher. Gut für Serverless und kleine Container. Nachteile: lange Build-Zeit, Reflection braucht Konfiguration, keine Laufzeit-Optimierung. Spring Boot 3 unterstützt Native Images.
- **Graal JIT:** Ein JIT-Compiler, geschrieben in Java. Kann C2 ersetzen.
- **Projekt Leyden / AOT Cache (Java 24+):** Die JVM speichert Klassen- und Profil-Informationen von einem Trainingslauf. Der nächste Start ist schneller. *(Prüfen Sie den genauen Stand für die Java-Version des Jobs.)*
- **CDS (Class Data Sharing):** Geladene Klassen werden in einem Archiv gespeichert. Schnellerer Start.

## Wann ist das wichtig – Praxis
- **Benchmarks:** Ohne Warm-up misst man den Interpreter, nicht den JIT. Darum gibt es **JMH** (Java Microbenchmark Harness). Er macht Warm-up und verhindert, dass der JIT den Test-Code wegoptimiert.
- **Microservices und Container:** Nach jedem Deployment ist der Service zuerst langsam. Lösungen: Warm-up-Requests vor der Readiness Probe, CDS, AOT Cache, oder Native Image.
- **Serverless (z. B. Azure Functions):** Kalter Start mit JIT ist langsam. Native Image hilft.
- **Kleine CPU-Limits in Kubernetes:** Der JIT braucht CPU für seine Threads. Mit sehr wenig CPU dauert der Warm-up lange.
- **Code-Stil:** Kleine Methoden schaden nicht, weil der JIT sie inlined. Lesbarer Code ist meistens auch schneller Code.

## Nachteile und Fallen
- Warm-up: Die ersten Requests sind langsam.
- Zusätzlicher Speicher und CPU für Compiler-Threads und Code Cache.
- Deoptimierung kann Leistung kurz einbrechen lassen.
- Megamorphe Aufrufe (viele Klassen an einer Stelle) lassen sich schlecht optimieren.
- Sehr grosse Methoden werden nicht kompiliert (Grenze ca. 8000 Bytes Bytecode, `-XX:-DontCompileHugeMethods`).
- Falsche Benchmarks ohne Warm-up führen zu falschen Entscheidungen.

## Werkzeuge und Flags
- `-XX:+PrintCompilation` – zeigt, welche Methode wann kompiliert wird.
- `-XX:+UnlockDiagnosticVMOptions -XX:+PrintInlining` – zeigt Inlining-Entscheidungen.
- `-XX:TieredStopAtLevel=1` – nur C1. Schneller Start, weniger Höchstleistung (oft in Entwicklung).
- `-Xint` – nur Interpreter (zum Vergleich).
- `-XX:ReservedCodeCacheSize=256m` – Code Cache vergrössern.
- **JITWatch** – Werkzeug, um JIT-Logs grafisch zu lesen.
- **Java Flight Recorder (JFR)** – zeigt auch Kompilierungen und Deoptimierungen.

## In meinem Projekt
*(Ihr echtes Beispiel: Haben Sie Warm-up nach Deployments gesehen, z. B. bei Spring Boot auf Kubernetes? Haben Sie JVM-Flags oder Readiness Probes deswegen angepasst?)*
Allgemein gut zu sagen: „Nach einem Deployment sind die ersten Requests langsamer, weil der JIT noch nicht optimiert hat. Darum setze ich die Readiness Probe nicht zu früh und lasse den Service kurz warm laufen.“

## Interviewfragen mit Antworten
- Was ist der JIT-Compiler? → Er übersetzt heissen Bytecode zur Laufzeit in Maschinencode, mit Optimierungen auf Basis von echten Messdaten.
- Wie läuft Java-Code von der Quelle bis zur CPU? → javac macht Bytecode. Die JVM lädt die Klasse, prüft sie, interpretiert sie. Heisse Methoden kompiliert der JIT zu Maschinencode.
- Warum interpretiert die JVM zuerst? → Schneller Start. Und sie sammelt Profildaten für bessere Optimierung.
- Was ist ein Hot Spot? → Code, der oft läuft. Nur der lohnt sich zu kompilieren.
- Was ist der Unterschied zwischen C1 und C2? → C1 kompiliert schnell mit wenig Optimierung. C2 kompiliert langsam mit starker Optimierung und Profildaten.
- Was ist Tiered Compilation? → Die Kombination: Interpreter → C1 mit Profil → C2. Standard seit Java 8.
- Wie entscheidet die JVM, wann sie kompiliert? → Mit Zählern für Aufrufe und Schleifendurchläufe. Über einer Schwelle wird kompiliert.
- Was ist OSR? → On-Stack Replacement. Eine lange Schleife wird kompiliert und die laufende Ausführung wechselt mittendrin in den Maschinencode.
- Was ist Inlining und warum ist es so wichtig? → Der Aufruf wird durch den Methodencode ersetzt. Kein Aufruf-Overhead, und weitere Optimierungen werden möglich.
- Was ist Escape Analysis? → Prüfung, ob ein Objekt die Methode verlässt. Wenn nicht, kann es auf Register verteilt werden (Scalar Replacement) oder Locks fallen weg.
- Was ist Deoptimierung? → Eine Annahme des JIT stimmt nicht mehr. Der Maschinencode wird verworfen, die JVM geht zurück in den Interpreter und kompiliert später neu.
- Was heisst monomorph, bimorph, megamorph? → Wie viele Klassen an einer Aufrufstelle vorkommen. 1 oder 2: schnell, wird devirtualisiert. Mehr: langsamer.
- Was sind Intrinsics? → Handoptimierter Maschinencode für bestimmte JDK-Methoden.
- Was ist der Code Cache? → Speicher für den kompilierten Maschinencode. Wenn voll, kompiliert die JVM nicht mehr.
- Was ist Warm-up? → Die Zeit, bis der heisse Code kompiliert ist. Vorher ist das Programm langsamer.
- Wie misst man Java-Leistung richtig? → Mit JMH: Warm-up, mehrere Durchläufe, Schutz gegen Dead Code Elimination.
- JIT oder AOT? → JIT: beste Höchstleistung, langsamer Start. AOT/Native Image: schneller Start, wenig Speicher, gut für Serverless.
- Was ist GraalVM Native Image? → AOT-Kompilierung zu einer Binärdatei. Schneller Start, aber lange Builds und Reflection-Konfiguration.
- Was ist CDS? → Class Data Sharing: vorbereitete Klassendaten in einem Archiv. Schnellerer Start.
- Macht der JIT final-Methoden schneller? → Kaum. Der JIT erkennt auch ohne final, dass es nur eine Implementierung gibt.
- Schaden viele kleine Methoden der Leistung? → Nein. Der JIT inlined sie.
- Warum kann ein Programm nach Stunden plötzlich langsamer werden? → Zum Beispiel Deoptimierung, voller Code Cache oder Garbage Collection.
- Was ist der Unterschied zwischen JIT und javac? → javac macht Bytecode (zur Build-Zeit). Der JIT macht Maschinencode (zur Laufzeit).
- Was ist der Unterschied zwischen JIT und Garbage Collector? → JIT macht Code schnell. GC räumt Speicher auf. Beide sind Teile der Execution Engine bzw. Laufzeit der JVM.
- Wie sieht man, was der JIT macht? → `-XX:+PrintCompilation`, `PrintInlining`, JITWatch, Java Flight Recorder.
- Wie beschleunigt man den Start eines Spring-Boot-Service? → CDS oder AOT Cache, weniger Auto-Configuration, Lazy Initialization, oder Native Image.

## Fangfragen
- „Der JIT macht die Kompilierung schneller.“ → Falsch. Er macht die **Ausführung** schneller. Kompilieren kostet sogar Zeit.
- „Java ist interpretiert und darum langsam.“ → Nur am Anfang. Heisser Code läuft als optimierter Maschinencode.
- „AOT ist immer schneller als JIT.“ → Nur beim Start. Bei langer Laufzeit ist der JIT oft schneller.
- „Der JIT kompiliert alle Methoden.“ → Nein, nur heisse Methoden.
- „final macht Code schneller.“ → Meistens nicht messbar.

## Wörter
- **Bytecode** = Zwischencode für die JVM
- **Maschinencode** = Befehle für die echte CPU
- **Hot Spot** = oft laufender Code
- **Warm-up** = Zeit bis zur vollen Geschwindigkeit
- **Inlining** = Methode direkt einsetzen
- **Deoptimierung** = zurück in den Interpreter
- **Code Cache** = Speicher für kompilierten Code
