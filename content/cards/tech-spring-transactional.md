---
id: tech-spring-transactional
round: tech
tech: [spring]
tier: 1
project: BIT DAZiT
q: Wie funktioniert @Transactional? Was sind Self-Invocation, Propagation und Rollback-Regeln?
en: How does @Transactional work? What are self-invocation, propagation and rollback rules?
---
## 30s
`@Transactional` funktioniert über einen Proxy.
Der Proxy startet die Transaktion vor der Methode.
Nach der Methode macht er Commit. Bei einer Runtime Exception macht er Rollback.
Wichtig: Ein Aufruf in derselben Klasse geht am Proxy vorbei. Dann gibt es keine Transaktion.
Ich setze die Transaktion auf die Service-Schicht, nicht auf den Controller.
So haben wir es in den Spring-Boot-Services bei DAZiT gemacht. *(Prüfen: Beispiel aus DAZiT bestätigen.)*
Soll ich Propagation erklären?

## 90s
**Ablauf:**
1. Der Controller ruft `service.submit()` auf. In Wahrheit ruft er den Proxy.
2. Der Proxy fragt den `TransactionManager`: Gibt es schon eine Transaktion?
3. Je nach Propagation: mitmachen oder neue starten.
4. Die echte Methode läuft. Die DB-Verbindung hängt am Thread.
5. Ende: Commit. Bei RuntimeException oder Error: Rollback.

**Self-Invocation:**
```java
@Service
class DeclarationService {
    public void importAll(List<Item> items) {
        items.forEach(this::importOne);   // this = kein Proxy → keine neue Transaktion!
    }
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void importOne(Item i) { ... }
}
```
Lösung: `importOne` in eine eigene Bean verschieben.

**Propagation (die wichtigsten):**
- `REQUIRED` (Standard): mitmachen, sonst neu starten.
- `REQUIRES_NEW`: äussere Transaktion pausieren, eine neue starten. Eigene DB-Verbindung.
- `NESTED`: Savepoint in derselben Transaktion.
- `MANDATORY`: Es muss schon eine geben, sonst Exception.

## 3min
**Rollback-Regeln:**
- Standard: Rollback bei `RuntimeException` und `Error`. Bei checked Exceptions: Commit!
- `@Transactional(rollbackFor = Exception.class)` ändert das.
- `noRollbackFor` für Ausnahmen, die keinen Rollback brauchen.

**Die gemeine Falle: UnexpectedRollbackException.** Eine innere Methode mit `REQUIRED` wirft. Die Transaktion wird "rollback-only" markiert. Die äussere Methode fängt die Exception und will committen. Spring wirft dann `UnexpectedRollbackException`. Lösung: die innere Arbeit mit `REQUIRES_NEW`, oder die Exception nicht fangen.

**Weitere Fallen:**
- `@Transactional` auf `private`-Methoden wirkt nicht.
- Lange Transaktionen mit REST-Aufrufen drin. Die DB-Verbindung bleibt lange blockiert. Der Pool läuft leer. Externe Aufrufe gehören vor oder nach die Transaktion.
- Kafka-Nachricht in der Transaktion senden. Rollback in der DB, aber die Nachricht ist schon weg. Lösung: Outbox Pattern oder `@TransactionalEventListener(phase = AFTER_COMMIT)`.
- `REQUIRES_NEW` in einer Schleife braucht pro Aufruf eine zweite Verbindung. Das kann den Pool erschöpfen.

**readOnly = true:** Ein Hinweis an Hibernate und den Treiber. Hibernate macht dann kein Dirty Checking beim Flush. Gut für Lese-Methoden.

## Follow-ups
- Warum wirkt @Transactional nicht bei einem internen Aufruf? → Weil der Aufruf über `this` geht, nicht über den Proxy. Der Proxy sieht ihn nicht.
- Was ist der Unterschied zwischen REQUIRES_NEW und NESTED? → REQUIRES_NEW ist eine eigene Transaktion mit eigenem Commit. NESTED ist ein Savepoint, der mit der äusseren Transaktion committed wird.
- Was macht der Default Isolation Level? → Spring nimmt den Standard der Datenbank. Bei PostgreSQL ist das Read Committed.
- Gehört @Transactional auf das Repository oder den Service? → Auf den Service. Dort ist die fachliche Einheit, die ganz oder gar nicht passieren muss.
- Wie testen Sie das? → Integrationstest mit echter DB, zum Beispiel Testcontainers. Ich prüfe, dass nach einer Exception nichts gespeichert ist.

## Don't say
- „@Transactional macht bei jeder Exception Rollback.“ Bei checked Exceptions nicht.
- „Ich setze @Transactional auf jede Methode.“ Das zeigt, dass man die Grenzen nicht kennt.

## Words
- **die Transaktion** = alles oder nichts in der Datenbank
- **zurückrollen** = to roll back
- **die Weitergabe (Propagation)** = wie sich Transaktionen verschachteln
- **der Savepoint** = Zwischenstand in einer Transaktion
- **erschöpfen** = to exhaust
