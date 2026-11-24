---
id: review-null-handling
round: review
tech: [java]
tier: 2
q: Hier gibt es manchmal eine NullPointerException. Was ist falsch an diesem Code?
en: This code sometimes throws a NullPointerException. What is wrong?
---
## 30s
```java
public String cityOfCustomer(Long customerId) {
    Customer c = customerRepository.findById(customerId).get();
    if (c.getAddress().getCity().equals("Bern")) {
        return "local";
    }
    return c.getAddress().getCity().toUpperCase();
}
```
Es gibt drei Stellen für eine NPE oder eine Exception.
`Optional.get()` wirft eine `NoSuchElementException`, wenn es den Kunden nicht gibt.
`getAddress()` kann `null` sein. `getCity()` auch.
`city.equals("Bern")` wirft bei `null`. Besser: `"Bern".equals(city)`.
Fix: `Optional` richtig nutzen und klar sagen, was „fehlt“ fachlich bedeutet.

## 90s
**Der Fix:**
```java
public Optional<String> cityOfCustomer(long customerId) {
    return customerRepository.findById(customerId)
        .map(Customer::getAddress)
        .map(Address::getCity)
        .map(city -> "Bern".equals(city) ? "local" : city.toUpperCase(Locale.ROOT));
}
```
Oder mit klarer Fehlermeldung:
```java
Customer c = customerRepository.findById(customerId)
    .orElseThrow(() -> new CustomerNotFoundException(customerId));
```
**Laut gesagt:** „Ein fehlender Kunde ist ein Fachfall. Darum eine eigene Exception oder ein leeres Optional. Kein `get()` ohne Prüfung.“

**Meine Reihenfolge:**
1. **Korrekt?** Nein, drei NPE-Stellen.
2. **Sicher?** Ein Stacktrace an den Client verrät Interna. Fehler zentral behandeln.
3. **Schnell?** Okay.
4. **Lesbar?** `getAddress().getCity()` doppelt. Einmal in eine Variable.
5. **Design:** Darf ein Kunde ohne Adresse existieren? Das klärt man im Modell, nicht mit `if`.

## 3min
**Null im Design vermeiden:**
- **Validierung an der Grenze:** Bean Validation mit `@NotNull` an der API. Dann ist innen klar, was es gibt.
- **Im Modell:** Pflichtfelder im Konstruktor prüfen: `Objects.requireNonNull(city, "city")`. Records machen das einfach.
- **In der Datenbank:** `NOT NULL`-Constraints. Die Datenbank ist die letzte Verteidigung.
- **Rückgabewerte:** Leere Liste statt `null`. `Optional` nur als Rückgabe, nicht als Feld oder Parameter.
- **Annotationen:** JSpecify `@Nullable` / `@NonNull` mit einem Checker wie NullAway findet Fehler beim Build.

**Hilfreiche NPE-Meldungen:** Seit Java 14 sagt die NPE genau, was `null` war: „Cannot invoke getCity() because the return value of getAddress() is null“. Das hilft beim Lesen von Logs.

**Optional falsch benutzt:**
- `optional.isPresent()` dann `get()` → das ist nur ein `null`-Check mit mehr Text.
- `Optional<List<…>>` → besser eine leere Liste.
- `Optional.of(x)` mit `x == null` → wirft sofort. Für unsichere Werte `Optional.ofNullable`.

**Locale:** `toUpperCase()` ohne Locale ist ein bekannter Bug. In der türkischen Locale wird „i“ zu „İ“. Darum `Locale.ROOT`.

## Follow-ups
- Wann nutzen Sie `Optional`? → Als Rückgabewert, wenn „kein Ergebnis“ normal ist. Nicht für Felder, Parameter oder Collections.
- Was ist der Unterschied zwischen `orElse` und `orElseGet`? → `orElse` berechnet den Standardwert immer. `orElseGet` nur, wenn das Optional leer ist.
- Wie gehen Sie in TypeScript mit null um? → Mit `strictNullChecks`, Optional Chaining `?.` und `??` für Standardwerte.
- Warum `"Bern".equals(city)`? → Der feste String ist nie `null`. So wirft der Vergleich keine NPE.

## Don't say
- „Ich mache überall `if (x != null)`.“ Das versteckt Designfehler.
- „`Optional.get()` ist okay, der Kunde existiert immer.“

## Words
- **NullPointerException (NPE)** = access on null
- **Pflichtfeld** = required field
- **leeres Optional** = empty Optional
- **Grenze** = boundary (API, input)
- **Standardwert** = default value
