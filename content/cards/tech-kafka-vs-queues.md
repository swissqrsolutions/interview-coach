---
id: tech-kafka-vs-queues
round: tech
tech: [kafka, messaging2]
tier: 2
project: BIT DAZiT (Kafka), DigiSanté (Event Hub)
q: Kafka, RabbitMQ oder Event Hub – wann nehmen Sie was?
en: Kafka, RabbitMQ or Event Hub – when do you use which?
---
## 30s
Kafka ist ein verteiltes Log. Nachrichten bleiben nach dem Lesen da. Man kann sie neu lesen.
RabbitMQ ist ein klassischer Message Broker. Er verteilt Nachrichten flexibel und löscht sie nach der Bestätigung.
Event Hub ist der verwaltete Azure-Dienst für Streams. Er spricht auch das Kafka-Protokoll.
Kafka habe ich bei DAZiT eingesetzt, Event Hub bei DigiSanté.
Produktiv habe ich RabbitMQ noch nicht eingesetzt. Das Prinzip kenne ich von der Nachrichten-Queue bei MATCH: Status Pending, atomarer Claim, dann Completed.
Soll ich die Unterschiede an einem Beispiel zeigen?

## 90s
**Der Vergleich:**
| | Kafka | RabbitMQ | Event Hub |
|---|---|---|---|
| Modell | Log mit Partitionen | Queues mit Exchanges | Log mit Partitionen |
| Nach dem Lesen | bleibt (Retention) | gelöscht nach Ack | bleibt (Retention) |
| Replay | ja | nein (außer Streams) | ja |
| Routing | über Topics und Keys | sehr flexibel (direct, topic, fanout) | einfach |
| Reihenfolge | pro Partition | pro Queue, mit einem Consumer | pro Partition |
| Betrieb | selbst oder Confluent | selbst oder Cloud | voll verwaltet |

**Wann was?**
- **Kafka:** viele Events, mehrere unabhängige Leser, Replay, Event-Streaming zwischen Systemen.
- **RabbitMQ:** Aufgaben-Queues, komplexes Routing, Nachricht pro Nachricht bestätigen, wenig Last.
- **Event Hub:** wie Kafka, aber auf Azure ohne eigenen Betrieb.
- **Service Bus:** Geschäftsnachrichten auf Azure mit Dead-Letter, Sessions und Transaktionen.

Laut gesagt: „Die Frage ist: Will ich ein Log, das mehrere Systeme lesen? Oder eine Arbeitsliste, die erledigt wird?“

## 3min
**Der Kern-Unterschied:**
- Bei Kafka merkt sich der **Consumer** die Position (Offset). Neue Consumer-Gruppen können alles von vorne lesen.
- Bei RabbitMQ merkt sich der **Broker** den Zustand jeder Nachricht. Nach dem Ack ist sie weg.

**Skalierung:**
- Kafka: Parallelität = Anzahl Partitionen. Mehr Consumer als Partitionen bringen nichts.
- RabbitMQ: Mehr Consumer an einer Queue teilen sich die Arbeit. Dafür ist die Reihenfolge dann nicht garantiert.

**Event Hub als Kafka-Ersatz:**
- Vorteil: kein Cluster, keine Broker, Integration mit Entra ID und Private Endpoints.
- Grenzen: Retention und Anzahl Partitionen hängen vom Tier ab. Nicht alle Kafka-Funktionen sind gleich verfügbar. Vor einem Wechsel prüfe ich die benötigten Funktionen einzeln.

**Bei DigiSanté** verarbeitet eine Event-Hub-Function das Scan-Ergebnis von Microsoft Defender. Für dieses Ereignis-Muster reicht ein verwalteter Dienst, ohne eigenen Kafka-Betrieb.

**Bei DAZiT** hat Kafka mehrere Fachsysteme für die Steuererklärung verbunden. *(Prüfen: Warum fiel die Wahl auf Kafka? Echte Gründe nennen.)*

**Gemeinsam für alle:** Zustellung mindestens einmal. Der Consumer muss idempotent sein. Fehlerhafte Nachrichten brauchen eine Dead-Letter-Lösung.

**Wann keins davon?** Bei wenigen Aufgaben und einer vorhandenen PostgreSQL-DB reicht oft eine Tabelle als Queue mit `FOR UPDATE SKIP LOCKED`. Weniger Systeme, weniger Betrieb.

## Follow-ups
- Kann RabbitMQ auch Replay? → Mit RabbitMQ Streams gibt es ein Log-Modell. Klassische Queues können es nicht.
- Was sind Exchanges? → Der Producer schreibt in einen Exchange. Der Exchange verteilt nach Regeln an Queues: direct, topic, fanout, headers.
- Was ist eine Consumer Group? → Mehrere Consumer teilen sich die Partitionen eines Topics. Jede Gruppe liest unabhängig.
- Was nehmen Sie für ein Benachrichtigungssystem mit 1000 Nachrichten pro Tag? → Eine einfache Queue, zum Beispiel Service Bus. Kafka wäre hier zu viel Betrieb.

## Don't say
- „Kafka ist immer besser, weil es schneller ist.“ Es kommt auf das Muster an.
- „RabbitMQ habe ich auch oft benutzt.“ Nur sagen, was stimmt.

## Words
- **Bestätigung (Ack)** = acknowledgement
- **Arbeitsliste** = work queue
- **verwaltet** = managed
- **Ersatz** = replacement
- **Betrieb** = operations
