---
id: tech-java-modern
round: tech
tech: [java]
tier: 2
project: BIT DAZiT
q: Welche modernen Java-Features nutzen Sie? Records, Sealed Classes, Pattern Matching, Switch?
en: Which modern Java features do you use? Records, sealed classes, pattern matching, switch?
---
## 30s
Seit Java 17 und 21 schreibe ich Java viel kürzer.
Records sind unveränderliche Datenklassen. Ideal für DTOs und Events.
Sealed Classes begrenzen, wer eine Klasse erweitern darf.
Pattern Matching für switch ist seit Java 21 final.
Zusammen kann der Compiler prüfen, ob ich alle Fälle behandle.
Bei DAZiT haben wir mit Java 21 gearbeitet. Records passen gut für Kafka-Events.
*(Prüfen: Welche Features haben Sie bei DAZiT konkret benutzt?)*
Soll ich ein Beispiel mit einem Event-Typ zeigen?

## 90s
**Beispiel: ein Event-Modell**
```java
sealed interface DeclarationEvent permits Submitted, Corrected, Rejected {}
record Submitted(String id, BigDecimal amount) implements DeclarationEvent {}
record Corrected(String id, BigDecimal newAmount) implements DeclarationEvent {}
record Rejected(String id, String reason) implements DeclarationEvent {}

String describe(DeclarationEvent e) {
    return switch (e) {
        case Submitted s when s.amount().signum() == 0 -> "Leere Deklaration " + s.id();
        case Submitted s                     -> "Eingereicht " + s.id();
        case Corrected(String id, var amt)   -> "Korrigiert " + id;   // Record Pattern
        case Rejected r                      -> "Abgelehnt: " + r.reason();
    };   // kein default nötig: der Compiler kennt alle Fälle
}
```

**Weitere Features:**
- `instanceof` mit Pattern: `if (o instanceof String s) { ... }` (Java 16).
- Switch Expressions mit `->` (Java 14).
- Text Blocks `"""` für SQL und JSON (Java 15).
- Sequenced Collections: `getFirst()`, `getLast()`, `reversed()` (Java 21).

## 3min
**Records im Detail:**
- Felder sind `final`. Konstruktor, Getter, equals, hashCode, toString sind automatisch.
- Validierung im kompakten Konstruktor: `record Money(BigDecimal value) { Money { Objects.requireNonNull(value); } }`
- Nur flach unveränderlich: Eine `List` im Record kann sich ändern. Darum `List.copyOf()` im Konstruktor.
- Nicht als JPA-Entity geeignet: Entities brauchen einen leeren Konstruktor und Veränderbarkeit. Für DTOs und Projektionen sind Records perfekt.

**Sealed + Switch:** Wenn ein neuer Event-Typ dazukommt, kompiliert jeder Switch ohne den Fall nicht mehr. Das ist sicherer als ein `default`, der neue Fälle still verschluckt.

**Trade-off:** Sealed Hierarchien sind gut für ein festes Modell im selben Modul. Für Erweiterungen durch andere Teams sind sie zu streng.

**Migration:** Alter Code von Java 11 kann schrittweise umgestellt werden. Ich beginne mit DTOs als Records. Das ist risikoarm.

## Follow-ups
- Kann ein Record von einer Klasse erben? → Nein. Ein Record ist implizit final und erbt von `java.lang.Record`. Er kann aber Interfaces implementieren.
- Was ist ein Guard im Switch? → Eine Bedingung mit `when`, zum Beispiel `case Submitted s when s.amount().signum() > 0`.
- Was passiert bei null im Pattern Switch? → Ohne `case null` gibt es eine NullPointerException. Mit `case null ->` kann ich es behandeln.
- Kann man Records mit Jackson benutzen? → Ja. Jackson unterstützt Records seit Version 2.12.
- Was bedeutet permits? → Es listet die erlaubten Unterklassen. Andere dürfen nicht erweitern.

## Don't say
- „Records sind komplett unveränderlich.“ Nur flach. Veränderbare Felder bleiben veränderbar.
- „Pattern Matching ist in Java 21 noch Preview.“ Für switch und Record Patterns ist es in Java 21 final.

## Words
- **die Datenklasse** = data carrier class
- **erweitern** = to extend
- **vollständig (exhaustive)** = alle Fälle sind behandelt
- **der kompakte Konstruktor** = compact constructor im Record
- **flach** = shallow
