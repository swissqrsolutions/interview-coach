---
id: review-resource-leak
round: review
tech: [java]
tier: 2
q: Dieser Service stürzt nach ein paar Stunden ab. Was ist falsch an diesem Code?
en: This service crashes after a few hours. What is wrong with this code?
---
## 30s
```java
public String readConfig(String path) throws IOException {
    FileInputStream in = new FileInputStream(path);
    BufferedReader reader = new BufferedReader(new InputStreamReader(in));
    StringBuilder sb = new StringBuilder();
    String line;
    while ((line = reader.readLine()) != null) {
        sb.append(line);
    }
    return sb.toString();
}
```
Das Problem ist ein Resource Leak. Die Datei wird nie geschlossen.
Jeder Aufruf hält einen File Handle offen.
Nach vielen Aufrufen gibt es „Too many open files“. Dann stürzt der Service ab.
Die Lösung: try-with-resources.
Dazu fehlt das Encoding, und die Zeilenumbrüche gehen verloren.

## 90s
**Der Fix:**
```java
public String readConfig(Path path) throws IOException {
    try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line).append('\n');
        }
        return sb.toString();
    }
}
```
Für kleine Dateien noch kürzer: `Files.readString(path)`. Das schliesst die Datei selbst.

**Laut gesagt:** „try-with-resources schliesst den Reader immer. Auch bei einer Exception. Der Reader schliesst den Stream darunter mit.“

**Meine Reihenfolge:**
1. **Korrekt?** Zeilenumbrüche fehlen. Das Encoding hängt vom System ab.
2. **Sicher?** Ist `path` eine Nutzereingabe? Dann Path Traversal: `../../etc/passwd`. Ich prüfe das.
3. **Schnell?** Okay.
4. **Lesbar?** Mit `Files` kürzer.
5. **Design:** Liest der Service die Config bei jedem Aufruf? Besser einmal beim Start laden.

## 3min
**Welche Ressourcen müssen geschlossen werden?** Alles mit `AutoCloseable`: Streams, Reader, JDBC `Connection`, `Statement`, `ResultSet`, HTTP-Antworten, `Files.lines`, `ExecutorService` (seit Java 19 auch `AutoCloseable`).

**Wie bemerke ich so ein Leak in Produktion?**
- Fehler „Too many open files“ im Log.
- Die Zahl offener File Descriptors steigt. Unter Linux: `ls /proc/<pid>/fd | wc -l`.
- Bei Datenbank-Verbindungen: Der Connection Pool ist leer. HikariCP meldet Timeouts. Mit `leakDetectionThreshold` zeigt HikariCP den Stacktrace der Stelle.
- Monitoring: Ein Grafana-Panel mit offenen Verbindungen oder Handles zeigt eine Treppe nach oben.

**Warum nicht `finally`?** Es geht, aber es ist länger und fehleranfällig. Wirft `close()` selbst eine Exception, verdeckt sie die erste. try-with-resources hängt sie als „suppressed“ an.

**Statische Analyse:** SonarQube und IntelliJ warnen bei nicht geschlossenen Ressourcen. Ich nehme diese Warnungen ernst.

## Follow-ups
- Was passiert mit dem inneren Stream, wenn ich nur den Reader schliesse? → Der Reader schliesst den Stream mit. Ein `try` für den äussersten reicht, wenn der Konstruktor nicht scheitert.
- Wann wird eine Ressource in try-with-resources geschlossen? → Am Ende des Blocks, in umgekehrter Reihenfolge der Deklaration.
- Schliesst der Garbage Collector die Datei nicht? → Nicht zuverlässig. `finalize` ist veraltet. Darauf darf man sich nie verlassen.
- Wie ist das in Python? → Mit `with open(...) as f:`. Das ist das gleiche Prinzip.
- Wie finden Sie ein Connection Leak? → HikariCP `leakDetectionThreshold` aktivieren. Dann steht im Log, wo die Verbindung geholt und nicht zurückgegeben wurde.

## Don't say
- „Der Garbage Collector räumt das auf.“
- Nicht nur den Leak finden und das Encoding übersehen.

## Words
- **Resource Leak** = resource not released
- **File Handle / File Descriptor** = open file reference
- **schliessen** = to close
- **Connection Pool** = shared database connections
- **verdecken** = to hide (an exception)
