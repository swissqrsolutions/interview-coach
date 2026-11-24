---
id: review-swallowed-exception
round: review
tech: [java, spring]
tier: 2
q: Ein Kunde sagt, seine Zahlung fehlt. Im Log steht nichts. Was ist falsch an diesem Code?
en: A customer says his payment is missing. The log shows nothing. What is wrong with this code?
---
## 30s
```java
public void processPayment(Payment p) {
    try {
        paymentClient.send(p);
        repository.markSent(p.getId());
    } catch (Exception e) {
        // sollte nie passieren
    }
}
```
Die Exception wird verschluckt. Es gibt kein Log, keinen Retry und keine Meldung an den Aufrufer.
Der Aufrufer denkt, alles war gut.
Darum fehlt die Zahlung, und niemand merkt es.
`catch (Exception e)` fängt auch Programmierfehler wie NullPointerException.
Fix: nur erwartete Exceptions fangen, mit Kontext loggen, und dann weiterwerfen oder bewusst behandeln.

## 90s
**Der Fix:**
```java
public void processPayment(Payment p) {
    try {
        paymentClient.send(p);
    } catch (PaymentGatewayException e) {
        log.error("Payment {} failed at gateway", p.getId(), e);
        throw new PaymentFailedException(p.getId(), e);
    }
    repository.markSent(p.getId());
}
```
**Laut gesagt:** „Ich fange nur die Exception, die ich verstehe. Ich logge die ID und den Stacktrace. Dann werfe ich eine fachliche Exception mit der Ursache. Der Aufrufer entscheidet: Retry oder Fehlermeldung.“

**Wichtig:** Das `e` als letztes Argument. Dann loggt SLF4J den ganzen Stacktrace. Nur `e.getMessage()` reicht nicht.

**Meine Reihenfolge:**
1. **Korrekt?** Nein: Fehler verschwinden.
2. **Sicher?** Loggen ja, aber keine Kartennummern oder Personendaten im Log.
3. **Schnell?** Kein Thema.
4. **Lesbar?** Der Kommentar „sollte nie passieren“ ist ein Warnsignal.
5. **Design:** Senden und Speichern sind nicht atomar. Was, wenn `send` klappt und `markSent` scheitert?

## 3min
**Das tiefere Design-Problem:** Ein externer Aufruf und ein DB-Update sind keine gemeinsame Transaktion.
- `send` klappt, `markSent` scheitert → die Zahlung ist raus, aber nicht markiert. Ein Retry zahlt doppelt.
- Lösung 1: Ein **Idempotency Key** pro Zahlung. Der Zahlungsdienst erkennt den zweiten Versuch.
- Lösung 2: **Outbox Pattern.** Ich speichere „Zahlung senden“ in derselben DB-Transaktion. Ein Worker sendet und markiert. Retries sind sicher, weil der Empfänger idempotent ist.

**Wann ist Schlucken okay?** Fast nie. Ausnahmen: ein optionaler Cache oder eine Metrik. Dann trotzdem loggen, zum Beispiel als `warn`, und einen Kommentar mit dem Grund.

**Weitere Anti-Patterns:**
- `catch (Exception e) { throw new RuntimeException(); }` ohne `e` → die Ursache ist weg.
- `e.printStackTrace()` → geht an stderr, nicht ins Logging-System.
- Loggen und werfen auf jeder Ebene → derselbe Fehler fünfmal im Log. Regel: loggen dort, wo ich behandle.
- `catch (InterruptedException e) {}` → das Interrupt-Flag geht verloren. Immer `Thread.currentThread().interrupt()`.

**Wie bemerke ich verschluckte Fehler?** Zahlen passen nicht: 100 Zahlungen rein, 97 gesendet. Ich zähle Erfolg und Fehler als Metrik und alarmiere auf die Differenz. SonarQube meldet leere catch-Blöcke.

## Follow-ups
- Checked oder unchecked Exceptions? → Für Fachfehler, auf die der Aufrufer reagieren kann, ist beides möglich. In Spring nimmt man meist unchecked. Wichtig ist die Ursache weitergeben.
- Wo behandeln Sie Fehler in einer REST-API? → Zentral in einem `@RestControllerAdvice`. Dort wird die Exception zu einem HTTP-Status und `ProblemDetail`.
- Was ist mit `@Transactional` und gefangenen Exceptions? → Wenn ich die Exception fange und nicht weiterwerfe, gibt es kein Rollback. Die Transaktion wird committed.
- Wie machen Sie Retries? → Nur bei vorübergehenden Fehlern, mit Backoff und Limit. Zum Beispiel mit Spring Retry oder Resilience4j. Danach eine Dead-Letter-Queue.

## Don't say
- „Ich fange einfach `Exception`, dann stürzt nichts ab.“
- Nicht nur „Logging fehlt“ sagen. Die doppelte Zahlung ist das grössere Problem.

## Words
- **verschlucken** = to swallow (an exception)
- **Ursache** = cause
- **weiterwerfen** = to rethrow
- **Stacktrace** = call stack of the error
- **Idempotency Key** = unique key against duplicates
