---
id: tech-kafka-basics
round: tech
tech: [kafka, microservices]
tier: 1
project: BIT DAZiT
q: Was ist Kafka und wie skaliert es?
en: What is Kafka and how does it scale?
---
## 30s
Kafka ist ein verteiltes Log für Events.
Producer schreiben Events in ein Topic. Consumer lesen sie.
Kafka speichert die Events eine Zeit lang, auch nach dem Lesen.
So sind die Services entkoppelt.
Bei DAZiT haben wir damit Fachsysteme für die Steuer verbunden.
Soll ich erklären, wie Partitionen und Consumer Groups skalieren?

## 90s
**Partitionen:** Ein Topic hat mehrere Partitionen. Jede Partition ist eine Liste in fester Reihenfolge.

**Skalierung:** Mehr Partitionen = mehr Parallelität. In einer Consumer Group liest jede Partition genau ein Consumer. 6 Partitionen = maximal 6 aktive Consumer.

**Reihenfolge:** Nur innerhalb einer Partition. Darum wählen wir einen Key, zum Beispiel die Fall-ID. Gleicher Key = gleiche Partition = richtige Reihenfolge.

**Offsets:** Der Consumer merkt sich, bis wohin er gelesen hat. Nach einem Absturz liest er ab dem letzten Commit weiter.

## 3min
**Liefergarantien:**
- **At-most-once:** Commit vor der Verarbeitung. Nachrichten können verloren gehen.
- **At-least-once:** Commit nach der Verarbeitung. Nachrichten können doppelt kommen. Das ist der Standard. Darum muss der Consumer idempotent sein.
- **Exactly-once:** mit idempotentem Producer und Transaktionen. Gilt nur innerhalb von Kafka, nicht für eine externe Datenbank.

**Fehler:**
- Eine kaputte Nachricht blockiert die Partition. → Ein paar Retries, dann in ein Dead-Letter-Topic.
- Consumer Lag wächst. → Mehr Consumer, aber nur bis zur Anzahl Partitionen. Lag immer messen und alarmieren.

**Trade-offs:** Kafka ist stark für hohe Last und Replay. Für eine einfache Aufgaben-Queue mit wenig Last ist es oft zu viel. Dann reicht RabbitMQ oder eine Azure Queue.

**Was ich anders machen würde:** *(Vorschlag, prüfen Sie, ob er zu DAZiT passt.)* Von Anfang an eine Schema Registry (Avro), damit Producer und Consumer nicht auseinander laufen.

## Follow-ups
- Was passiert, wenn ich später Partitionen hinzufüge? → Die Zuordnung Key → Partition ändert sich. Die Reihenfolge für alte Keys ist nicht mehr garantiert.
- Was ist ein Rebalance? → Ein Consumer kommt oder geht. Kafka verteilt die Partitionen neu. Während dieser Zeit liest niemand.
- Wie vermeiden Sie doppelte Verarbeitung? → Idempotenter Consumer: eine eindeutige Event-ID speichern und Duplikate ignorieren.
- Kafka oder Event Hub? → Event Hub ist der Azure-Dienst, er spricht sogar das Kafka-Protokoll. Weniger Betrieb, aber weniger Kontrolle.
- Was ist das Outbox Pattern? → Die Nachricht wird in derselben DB-Transaktion in eine Outbox-Tabelle geschrieben. Ein zweiter Prozess schickt sie an Kafka. So geht nichts verloren.

## Don't say
- „Kafka ist eine Queue.“ Besser: ein Log. Nachrichten bleiben nach dem Lesen da.
- „Kafka garantiert die Reihenfolge.“ Nur pro Partition.

## Words
- **entkoppeln** = to decouple
- **Liefergarantie** = delivery guarantee
- **Consumer Lag** = wie weit der Consumer hinten ist
