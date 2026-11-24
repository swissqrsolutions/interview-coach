---
id: tech-micro-saga
round: tech
tech: [microservices]
tier: 1
project: BIT DAZiT
q: Was ist das Saga Pattern? Choreografie oder Orchestrierung?
en: What is the saga pattern? Choreography or orchestration?
---
## 30s
In Microservices gibt es keine Datenbank-Transaktion über mehrere Services.
Eine Saga ist eine Folge von lokalen Transaktionen.
Jeder Service macht seinen Schritt und meldet das Ergebnis.
Wenn ein Schritt fehlschlägt, machen Kompensationen die früheren Schritte rückgängig.
Es gibt zwei Arten: Choreografie mit Events, oder Orchestrierung mit einem zentralen Koordinator.
Bei DAZiT haben wir Fachsysteme über Kafka-Events verbunden. *(Ihr echtes Beispiel: Gab es dort einen Ablauf über mehrere Services mit Kompensation?)*
Soll ich ein Beispiel durchgehen?

## 90s
**Beispiel: Bestellung**
1. Order-Service: Bestellung anlegen, Status PENDING.
2. Payment-Service: Geld reservieren.
3. Stock-Service: Ware reservieren. → schlägt fehl, nicht genug Ware.
4. Kompensation: Payment gibt das Geld frei. Order setzt Status CANCELLED.

**Choreografie:**
- Jeder Service hört auf Events und schickt neue Events.
- `OrderCreated` → Payment → `PaymentReserved` → Stock → `StockFailed` → Payment kompensiert.
- Kein zentraler Punkt. Lose gekoppelt.

**Orchestrierung:**
- Ein Orchestrator kennt den ganzen Ablauf. Er schickt Befehle und wartet auf Antworten.
- Den Zustand der Saga speichert er in einer Tabelle.
- Tools: eigener Service mit State Machine, oder eine Workflow-Engine wie Camunda oder Temporal.

## 3min
**Wann was?**
- Choreografie für kurze Abläufe mit 2–3 Schritten. Einfach, keine zentrale Komponente.
- Orchestrierung für lange Abläufe mit vielen Schritten. Der Ablauf ist an einer Stelle sichtbar und testbar. Mit Choreografie versteht bei 6 Services niemand mehr den Ablauf.

**Wichtige Regeln:**
- **Jeder Schritt ist idempotent.** Events kommen at-least-once, also manchmal doppelt.
- **Kompensation ist fachlich, nicht technisch.** Man kann eine verschickte E-Mail nicht löschen. Man schickt eine Korrektur.
- **Events zuverlässig senden:** mit dem Outbox Pattern. Sonst ist die DB geändert, aber das Event fehlt.
- **Timeouts:** Wenn eine Antwort nie kommt, muss die Saga das merken und kompensieren.
- **Keine Isolation:** Andere sehen Zwischenzustände. Darum Status wie PENDING sichtbar machen. Der Nutzer sieht "in Bearbeitung".

**Fehlerfälle und wie man sie bemerkt:** Sagas, die lange in PENDING hängen. Das messe ich und alarmiere. Ähnlich wie bei MATCH: Dort setzt eine Stale-Job-Recovery hängende Nachrichten nach einem Timeout zurück auf Pending.

**Warum nicht 2-Phase-Commit?** 2PC blockiert alle Teilnehmer, bis alle zustimmen. Kafka und viele Cloud-Datenbanken unterstützen es nicht. Ein Ausfall des Koordinators blockiert alles.

## Follow-ups
- Was ist eine Kompensation? → Eine fachliche Gegen-Aktion, zum Beispiel Geld zurückbuchen. Kein technisches Rollback.
- Was, wenn die Kompensation fehlschlägt? → Retry, weil sie idempotent ist. Nach mehreren Versuchen: Alarm und manuelle Bearbeitung.
- Wie testen Sie eine Saga? → Jeden Schritt einzeln. Dann den ganzen Ablauf mit Testcontainers für Kafka und DB, inklusive Fehlerfälle.
- Was ist eine Pivot-Transaktion? → Der Schritt, nach dem die Saga nicht mehr zurück kann. Danach muss sie vorwärts zum Ende laufen.
- Wie sieht der Nutzer den Zustand? → Über einen Status, zum Beispiel PENDING, CONFIRMED, CANCELLED.

## Don't say
- „Eine Saga ist eine verteilte Transaktion mit Rollback.“ Es gibt kein Rollback, nur Kompensation.
- Kein DAZiT-Saga-Beispiel erfinden, wenn es keins gab.

## Words
- **die Kompensation** = compensating action
- **rückgängig machen** = to undo
- **der Ablauf** = flow, process
- **der Zwischenzustand** = intermediate state
- **lose gekoppelt** = loosely coupled
