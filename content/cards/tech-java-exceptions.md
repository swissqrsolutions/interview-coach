---
id: tech-java-exceptions
round: tech
tech: [java]
tier: 2
project: BIT DAZiT
q: Wie gehen Sie mit Exceptions um? Checked oder unchecked?
en: How do you handle exceptions? Checked or unchecked?
---
## 30s
Java hat drei Arten: Checked Exceptions, Runtime Exceptions und Errors.
Checked Exceptions muss der Aufrufer behandeln oder weitergeben.
Runtime Exceptions muss er nicht.
In Spring-Services nehme ich meist eigene Runtime Exceptions mit klarer Bedeutung.
Ein zentraler Handler macht daraus eine saubere HTTP-Antwort.
So war es auch in den Spring-Boot-Services bei DAZiT. *(Prüfen: Hatten Sie dort einen zentralen @RestControllerAdvice?)*
Soll ich den globalen Handler zeigen?

## 90s
**Hierarchie:** `Throwable` → `Exception` (checked) → `RuntimeException` (unchecked). Daneben `Error`, zum Beispiel `OutOfMemoryError`. Errors fange ich nicht.

**Ressourcen sicher schliessen:**
```java
try (var in = Files.newInputStream(path)) {
    return parse(in);
}   // close() wird immer aufgerufen, auch bei Fehlern
```

**Globaler Handler in Spring Boot 3:**
```java
@RestControllerAdvice
class ApiErrors {
    @ExceptionHandler(DeclarationNotFoundException.class)
    ProblemDetail notFound(DeclarationNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }
}
```
`ProblemDetail` ist das Standard-Format nach RFC 9457 (`application/problem+json`).

**Kette erhalten:** `throw new ImportFailedException("Datei 42", e);` So bleibt die Ursache im Stack Trace.

## 3min
**Checked vs unchecked:**
- Checked zwingt zum Behandeln. Das ist gut, wenn der Aufrufer wirklich etwas tun kann.
- Aber sie passen schlecht zu Lambdas und Streams. Und oft schreibt man nur `catch` und wirft weiter.
- Moderne Frameworks wie Spring nutzen fast nur unchecked Exceptions.

**Spring-Detail:** `@Transactional` macht Rollback nur bei Runtime Exceptions und Errors. Bei einer checked Exception wird committed. Dann braucht man `rollbackFor`.

**Fehler, die ich in Reviews sehe:**
- Leerer `catch`-Block. Der Fehler verschwindet still.
- Log und Rethrow auf jeder Ebene. Dann steht der Fehler fünfmal im Log. Regel: nur einmal loggen, am Rand.
- `catch (Exception e)` überall. Das fängt auch Programmierfehler.
- Exceptions für normalen Ablauf. Das ist langsam und schwer zu lesen.
- Stack Traces oder interne Details in der HTTP-Antwort. Das ist ein Sicherheitsproblem.

**Fachliche Fehler vs technische Fehler:** Fachlich, zum Beispiel "Frist abgelaufen" → 4xx mit klarer Nachricht. Technisch, zum Beispiel DB nicht erreichbar → 5xx, loggen, Alarm, eventuell Retry.

## Follow-ups
- Was ist der Unterschied zwischen Exception und Error? → Exceptions kann die App behandeln. Errors sind schwere JVM-Probleme, zum Beispiel OutOfMemoryError.
- Was macht finally? → Es läuft immer, mit oder ohne Exception. Für Ressourcen nehme ich lieber try-with-resources.
- Was sind Suppressed Exceptions? → Wenn auch `close()` in try-with-resources wirft, hängt Java diese Exception an die Haupt-Exception an.
- Warum rollt @Transactional bei IOException nicht zurück? → Standard ist Rollback nur bei unchecked. Mit `rollbackFor = IOException.class` ändere ich das.
- Was geben Sie dem Client zurück? → Status-Code, eine kurze Meldung und eine Fehler-ID. Keine Stack Traces.

## Don't say
- „Ich fange einfach Exception und logge sie.“ Das versteckt Fehler.
- „Checked Exceptions sind immer besser.“ Es kommt auf den Aufrufer an.

## Words
- **behandeln** = to handle
- **weitergeben / werfen** = to propagate / to throw
- **die Ursache** = cause
- **fachlich** = business-related
- **verschlucken** = to swallow (an exception)
