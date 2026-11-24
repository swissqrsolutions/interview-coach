---
id: tech-java-jvm-memory-gc
round: tech
tech: [java]
tier: 1
project: CARIAD, ElCom MATCH
q: Wie ist der Speicher der JVM aufgebaut? Und wie finden Sie die Ursache für einen OutOfMemoryError?
en: How is JVM memory organised? And how do you find the cause of an OutOfMemoryError?
---
## 30s
Die JVM hat zwei wichtige Bereiche: Heap und Stack.
Im Heap liegen die Objekte. Der Garbage Collector räumt ihn auf.
Jeder Thread hat einen eigenen Stack für Methodenaufrufe und lokale Variablen.
Bei einem OutOfMemoryError mache ich zuerst einen Heap Dump und analysiere ihn.
In Kubernetes prüfe ich auch: War es ein Java-Fehler oder hat der Container das Limit überschritten?
Das habe ich bei MATCH gesehen: Ein Test-Container in der CI wurde OOM-killed.
Soll ich die Diagnose Schritt für Schritt erklären?

## 90s
**Die Bereiche:**
- **Heap:** Young Generation (Eden + Survivor) und Old Generation. Neue Objekte kommen in Eden. Wer lange lebt, kommt in die Old Generation.
- **Stack:** pro Thread. Zu tiefe Rekursion gibt `StackOverflowError`.
- **Metaspace:** Klassen-Metadaten, ausserhalb vom Heap.
- **Andere native Bereiche:** Code Cache, Direct Buffers, Thread-Stacks.

**Garbage Collection:** Objekte ohne Referenz werden gelöscht. Die meisten Objekte sterben jung. Darum ist ein Young-GC schnell und häufig.
- **G1:** Standard seit Java 9. Gute Balance aus Pausen und Durchsatz.
- **ZGC:** sehr kurze Pausen, auch bei grossem Heap. In Java 21 gibt es den generationalen ZGC (`-XX:+UseZGC -XX:+ZGenerational`).

**Diagnose eines OOM:**
1. Fehlermeldung lesen: `Java heap space`, `Metaspace`, `GC overhead limit exceeded`, `unable to create native thread`.
2. Heap Dump: `-XX:+HeapDumpOnOutOfMemoryError` oder `jcmd <pid> GC.heap_dump`.
3. Dump in Eclipse MAT öffnen. Den "Dominator Tree" ansehen: Wer hält den meisten Speicher?
4. GC-Logs mit `-Xlog:gc*` lesen. Steigt der Heap nach jedem Full GC weiter? Dann ist es ein Leak.

## 3min
**Java-OOM oder Container-OOM?**
- Java-OOM: Die JVM wirft `OutOfMemoryError`. Es gibt einen Stack Trace.
- Container-OOM: Kubernetes beendet den Pod. Status `OOMKilled`, Exit Code 137. Kein Java-Log. Ursache oft: Heap plus nativer Speicher ist grösser als das Limit.
- Darum setze ich im Container `-XX:MaxRAMPercentage=75` statt eines festen `-Xmx`. Der Rest bleibt für Metaspace, Threads und Buffers.

**Typische Leaks:**
- Ein statischer Cache ohne Grenze. Lösung: Cache mit Grösse und Ablaufzeit.
- Listener oder ThreadLocal, die nie entfernt werden.
- Eine Abfrage lädt eine ganze Tabelle in eine Liste. Lösung: Pagination oder Streaming.

**Was ich bei MATCH gelernt habe:** Der SQL-Server-Test-Container wurde in der CI OOM-killed. Viele Test-Collections liefen parallel. Wir haben den Container auf 2 GB begrenzt und die schweren Tests seriell gemacht. Die Lektion gilt auch für die JVM: Speicher-Limits bewusst setzen, nicht dem Zufall überlassen.

**Monitoring:** Heap, GC-Pausen und Pod-Restarts in Grafana beobachten. Ein Alarm bei Restarts zeigt das Problem früh.

## Follow-ups
- Was ist der Unterschied zwischen Stack und Heap? → Stack: pro Thread, Methodenaufrufe und lokale Variablen, schnell. Heap: geteilt, alle Objekte, vom GC verwaltet.
- Kann Java ein Memory Leak haben? → Ja. Wenn Objekte noch referenziert sind, aber nicht mehr gebraucht werden. Der GC darf sie nicht löschen.
- Welchen GC wählen Sie? → Meist G1, den Standard. ZGC, wenn kurze Pausen wichtig sind und der Heap gross ist.
- Was bedeutet Exit Code 137? → Der Prozess wurde mit SIGKILL beendet. In Kubernetes meist OOMKilled.
- Hilft mehr Heap immer? → Nein. Bei einem Leak verschiebt es den Fehler nur. Und im Container fehlt dann Platz für nativen Speicher.

## Don't say
- „Ich rufe System.gc() auf.“ Das ist nur ein Hinweis und löst kein Leak.
- „Ich setze -Xmx gleich dem Container-Limit.“ Dann wird der Pod gekillt.

## Words
- **der Heap Dump** = Abbild aller Objekte im Speicher
- **das Speicherleck** = memory leak
- **die Pause** = Zeit, in der die App wegen GC stoppt
- **überschreiten** = to exceed
- **die Ursache** = root cause
