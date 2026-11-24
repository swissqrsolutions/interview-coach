---
id: review-transaction-boundary
round: review
tech: [spring, hibernate, postgres]
tier: 1
q: Manchmal ist Geld abgebucht, aber nicht gutgeschrieben. Was ist falsch an diesem Code?
en: Sometimes money is debited but not credited. What is wrong with this code?
---
## 30s
```java
@Service
public class TransferService {

    public void transfer(long from, long to, BigDecimal amount) {
        withdraw(from, amount);
        deposit(to, amount);
        mailClient.sendConfirmation(from, amount);
    }

    @Transactional
    void withdraw(long id, BigDecimal amount) { /* UPDATE account ... */ }

    @Transactional
    void deposit(long id, BigDecimal amount) { /* UPDATE account ... */ }
}
```
Das Problem ist die Transaktionsgrenze.
`withdraw` und `deposit` laufen nicht in einer gemeinsamen Transaktion.
Schlimmer: Es sind interne Aufrufe. Der Spring-Proxy greift nicht. `@Transactional` wirkt hier gar nicht.
Scheitert `deposit`, ist das Geld weg.
Fix: `@Transactional` auf `transfer`. Die E-Mail erst nach dem Commit senden.

## 90s
**Der Fix:**
```java
@Service
public class TransferService {

    @Transactional
    public void transfer(long from, long to, BigDecimal amount) {
        // Sperren in fester Reihenfolge, siehe "Deadlock" unten
        Account a = accounts.findByIdForUpdate(from).orElseThrow();
        Account b = accounts.findByIdForUpdate(to).orElseThrow();
        a.withdraw(amount);   // wirft bei zu wenig Geld
        b.deposit(amount);
        events.publishEvent(new TransferDone(from, to, amount));
    }
}

@Component
class TransferMailer {
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    void on(TransferDone e) { mailClient.sendConfirmation(e.from(), e.amount()); }
}
```
**Laut gesagt:** „Beide Updates sind in einer Transaktion. Alles oder nichts. Die E-Mail geht erst nach dem Commit raus. Ein Rollback schickt keine falsche E-Mail.“

**Warum der Proxy nicht greift:** Spring legt einen Proxy um die Bean. Nur Aufrufe von aussen gehen durch den Proxy. `this.withdraw()` geht direkt. Dazu sind die Methoden nicht `public`.

## 3min
**Weitere Punkte im Review:**
- **Nebenläufigkeit:** Zwei Überweisungen vom selben Konto gleichzeitig. Ohne Sperre gibt es Lost Updates. Lösung: `SELECT ... FOR UPDATE` (pessimistisch) oder `@Version` (optimistisch, mit Retry).
- **Deadlock:** A→B und B→A gleichzeitig. Darum die Konten immer in fester Reihenfolge sperren, zum Beispiel nach ID.
- **Rollback-Regeln:** Standard ist Rollback nur bei unchecked Exceptions. Bei checked Exceptions braucht man `rollbackFor`.
- **Externe Aufrufe in der Transaktion:** Ein langsamer HTTP-Aufruf hält die DB-Verbindung und die Sperren. Darum externe Aufrufe ausserhalb der Transaktion.
- **E-Mail muss sicher ankommen?** `AFTER_COMMIT` geht verloren, wenn der Pod danach stirbt. Dann Outbox Pattern: das Ereignis in derselben Transaktion speichern, ein Worker sendet.

**Die richtige Grenze:** Eine Transaktion = ein fachlicher Anwendungsfall. Sie liegt im Service, nicht im Repository und nicht im Controller.

**Wie bemerke ich das in Produktion?** Summen stimmen nicht. Ein Abgleich-Job prüft: Summe aller Konten bleibt gleich. Logs zeigen eine Exception zwischen den zwei Updates.

## Follow-ups
- Was ist Propagation REQUIRES_NEW? → Eine neue, eigene Transaktion. Die äussere wird pausiert. Gut für ein Audit-Log, das auch bei Rollback bleiben soll.
- Welches Isolation Level hat PostgreSQL standardmässig? → Read Committed. Für Geld nutze ich Sperren oder Serializable mit Retry.
- Was ist der Unterschied zwischen optimistischem und pessimistischem Locking? → Optimistisch prüft beim Schreiben eine Version und scheitert bei Konflikt. Pessimistisch sperrt die Zeile beim Lesen.
- Funktioniert `@Transactional` auf privaten Methoden? → Mit dem Standard-Proxy nicht. Nur auf Methoden, die von aussen über den Proxy aufgerufen werden.
- Wie machen Sie das über zwei Microservices? → Keine verteilte Transaktion. Saga mit Kompensation und Outbox.

## Don't say
- „`@Transactional` auf jeder Methode löst das.“ Interne Aufrufe gehen am Proxy vorbei.
- Nicht die E-Mail in der Transaktion senden.

## Words
- **Transaktionsgrenze** = transaction boundary
- **abbuchen / gutschreiben** = debit / credit
- **Proxy** = wrapper object that adds behaviour
- **Sperre** = lock
- **Lost Update** = one update overwrites another
