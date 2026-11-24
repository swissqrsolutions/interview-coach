---
id: tech-kotlin
round: tech
tech: [kotlin]
tier: 4
project: CARIAD
q: Welche Erfahrung haben Sie mit Kotlin? Was ist anders als Java?
en: What experience do you have with Kotlin? What is different from Java?
---
## 30s
Kotlin ist eine JVM-Sprache. Sie arbeitet direkt mit Java-Code zusammen.
Der Code ist kürzer, und Null-Sicherheit ist im Typsystem eingebaut.
Bei CARIAD habe ich Kotlin für interne Tooling-Skripte auf der JVM benutzt.
Zum Beispiel für Validierung und das Aggregieren von Metriken.
Diese Skripte liefen bewusst außerhalb der Produktions-Services. Die Services waren in Java mit Spring Boot.
Soll ich die wichtigsten Unterschiede zu Java zeigen?

## 90s
**Null-Sicherheit:**
```kotlin
val name: String = "map"     // nie null
val tile: String? = find()    // darf null sein
val len = tile?.length ?: 0   // Safe Call + Elvis
```

**Data Class** (ähnlich wie ein Java Record):
```kotlin
data class Metric(val name: String, val value: Double)
```

**Extension Function und Collections:**
```kotlin
fun List<Metric>.avgOf(name: String) =
    filter { it.name == name }.map { it.value }.average()
```

- `val` = unveränderlich, `var` = veränderlich.
- Kein `new`, keine Checked Exceptions.
- Default- und benannte Parameter statt vieler Overloads.

## 3min
**Coroutines:** Leichte, asynchrone Funktionen mit `suspend`. Sie lesen sich wie normaler, sequenzieller Code. Ähnliche Idee wie Virtual Threads in Java 21, aber auf Sprachebene, mit Structured Concurrency.

**Java-Interop – Fallen:**
- Typen aus Java sind „Platform Types“. Kotlin weiß nicht, ob sie null sein können. Hier entstehen NullPointerExceptions trotzdem.
- Klassen sind in Kotlin standardmäßig `final`. Spring braucht offene Klassen für Proxies. Darum gibt es das Plugin `kotlin-spring` (allopen).
- JPA-Entities brauchen einen leeren Konstruktor. Dafür gibt es das Plugin `kotlin-jpa` (no-arg).

**Warum bei CARIAD nur für Tooling:** *(Ihr echter Grund. Prüfen, z. B. Team-Standard Java für Produktions-Services.)*

**Kotlin vs. Java heute:** Java hat mit Records, Pattern Matching und Virtual Threads aufgeholt. Kotlin ist weiter kürzer und hat Null-Sicherheit. Für ein Java-Team ist der Wechsel leicht, aber man braucht gemeinsame Regeln.

## Follow-ups
- Was ist der Elvis-Operator? → `?:` gibt einen Ersatzwert, wenn links `null` steht.
- Was ist der Unterschied zwischen val und var? → `val` kann man nicht neu zuweisen. `var` schon.
- Funktioniert Kotlin mit Spring Boot? → Ja, sehr gut. Spring unterstützt Kotlin offiziell, auch Coroutines.
- Was ist `!!`? → Es sagt: „Das ist nie null.“ Wenn doch, gibt es eine NullPointerException. Nur selten benutzen.
- Würden Sie Kotlin in Produktion einsetzen? → Ja, wenn das Team es will und die Regeln klar sind. Gemischter Code mit Java geht gut.

## Don't say
- „In Kotlin gibt es keine NullPointerException.“ Doch, bei Java-Interop und mit `!!`.
- „Ich habe Produktions-Services in Kotlin gebaut.“ Nicht wahr, es war Tooling.

## Words
- **die Null-Sicherheit** = null safety
- **unveränderlich** = immutable
- **das Tooling** = interne Werkzeuge und Skripte
- **aggregieren** = zusammenfassen, z. B. Summe oder Durchschnitt
- **bewusst** = on purpose
