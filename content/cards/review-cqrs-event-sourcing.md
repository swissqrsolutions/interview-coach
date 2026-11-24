---
id: review-cqrs-event-sourcing
round: review
tech: [patterns, microservices, kafka]
tier: 2
proof: study
q: Was sehen Sie in diesem Code? Ist das CQRS, Event Sourcing oder beides?
en: What do you see in this code? Is it CQRS, event sourcing, or both?
---
## 30s
```java
// Schreibseite
class AccountCommandHandler {
    void handle(Deposit cmd) {
        List<Event> history = eventStore.load(cmd.accountId());
        Account acc = Account.replay(history);
        Event e = acc.deposit(cmd.amount());   // MoneyDeposited
        eventStore.append(cmd.accountId(), e);
        bus.publish(e);
    }
}
// Leseseite
class BalanceProjection {
    void on(MoneyDeposited e) {
        jdbc.update("UPDATE balance_view SET balance = balance + ? WHERE id = ?",
                    e.amount(), e.accountId());
    }
}
```
Das ist beides.
CQRS: Schreiben und Lesen sind getrennt. Lesen geht über eine eigene Tabelle `balance_view`.
Event Sourcing: Der Zustand ist nicht gespeichert. Er wird aus allen Events neu gebaut.
Ich sehe aber drei Probleme: kein Versions-Check, `append` und `publish` sind nicht atomar, die Projektion ist nicht idempotent.
Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich von Event-Design mit Kafka bei DAZiT.

## 90s
**Die Probleme und Fixes:**
1. **Kein optimistischer Check.** Zwei Einzahlungen gleichzeitig lesen dieselbe Historie. Fix: `append(id, expectedVersion, e)`. Der Event Store lehnt ab, wenn die Version nicht passt. Dann Retry.
2. **`append` und `publish` nicht atomar.** Stirbt der Prozess dazwischen, fehlt das Event auf dem Bus. Fix: Der Event Store ist die Quelle. Die Projektion liest aus dem Store oder über eine Outbox.
3. **Projektion nicht idempotent.** Kommt das Event doppelt, ist der Saldo falsch. Fix: die letzte Event-Nummer pro Konto speichern und alte Events ignorieren.
```sql
UPDATE balance_view
SET balance = balance + :amount, last_seq = :seq
WHERE id = :id AND last_seq < :seq;
```
**Laut gesagt:** „Die Projektion merkt sich, welches Event sie zuletzt gesehen hat. Ein Duplikat ändert nichts.“

**Unterschied klar sagen:**
- **CQRS** = getrennte Modelle für Schreiben und Lesen. Geht auch ohne Events, zum Beispiel mit einer zweiten Tabelle.
- **Event Sourcing** = Events sind die Wahrheit. Der Zustand ist abgeleitet.

## 3min
**Wann lohnt es sich?**
- CQRS: Lesen und Schreiben sind sehr verschieden, zum Beispiel viele komplexe Abfragen und einfache Updates. Oder Lesen muss viel stärker skalieren.
- Event Sourcing: Die Historie ist fachlich wichtig. Audit, „Wie war der Stand am 1. März?“, Buchhaltung.

**Wann nicht?** Bei normalem CRUD. Die Kosten sind hoch:
- Eventual Consistency: Nach dem Schreiben ist die Leseseite kurz veraltet. Die UI muss damit umgehen.
- Schema-Änderungen von Events: Alte Events bleiben für immer. Man braucht Versionen und Upcaster.
- Lange Historien: Replay wird langsam. Lösung: Snapshots alle n Events.
- DSGVO / DSG: Löschen ist schwer, weil Events unveränderlich sind. Lösung zum Beispiel: Personendaten verschlüsselt, Schlüssel löschen (Crypto Shredding).

**Kafka als Event Store?** Kafka ist gut zum Verteilen von Events. Als Event Store pro Aggregat ist es schwach: kein Laden nach ID, kein Versions-Check. Oft nimmt man eine Datenbanktabelle oder einen eigenen Event Store.

**Verwandte Idee aus meiner Praxis:** Bei MATCH lesen die neue WebUI und die Charts über Dremio aus dem Lakehouse. Geschrieben wird über Spark-Jobs. Das ist kein CQRS im engen Sinn, aber eine Trennung von Schreib- und Lesepfad.

## Follow-ups
- Ist CQRS ohne Event Sourcing möglich? → Ja. Zum Beispiel schreibt der Service in normale Tabellen und füllt eine Lese-Tabelle oder einen Suchindex.
- Wie bauen Sie eine neue Projektion? → Alle Events von Anfang an abspielen. Das ist ein grosser Vorteil von Event Sourcing.
- Was ist ein Snapshot? → Ein gespeicherter Zustand nach Event n. Beim Laden starte ich vom Snapshot und spiele nur neuere Events ab.
- Wie gehen Sie mit veralteten Lesedaten in der UI um? → Die Antwort des Commands enthält die neue Version. Die UI zeigt sie direkt oder wartet, bis die Projektion sie hat.

## Don't say
- „CQRS heisst immer Event Sourcing.“
- „Event Sourcing ist für jedes Projekt gut.“ Die Komplexität ist hoch.

## Words
- **Command / Query** = write request / read request
- **Projektion** = read model built from events
- **Event Store** = append-only store of events
- **Eventual Consistency** = consistent after a short delay
- **abspielen (Replay)** = to replay events
