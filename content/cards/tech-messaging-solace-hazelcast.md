---
id: tech-messaging-solace-hazelcast
round: tech
tech: [messaging2]
tier: 4
proof: study
project: Kafka (DAZiT) als Vergleich
q: Kennen Sie Solace und Hazelcast? Wofür setzt man sie ein?
en: Do you know Solace and Hazelcast? What are they used for?
---
## 30s
Solace PubSub+ ist ein Event Broker. Er verteilt Nachrichten über hierarchische Topics.
Er spricht viele Protokolle: JMS, MQTT, AMQP und REST. Darum ist er bei Banken und in der Industrie beliebt.
Hazelcast ist ein In-Memory Data Grid. Daten liegen verteilt im Arbeitsspeicher von mehreren Knoten.
Man nutzt es als schnellen, verteilten Cache oder für geteilten Zustand.
Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich von Kafka bei DAZiT: Topics, Consumer, Partitionen und Replikation.

## 90s
**Solace – Topics mit Hierarchie:**
```
tax/declaration/created/BE
tax/declaration/*/BE      (* = ein Level)
tax/declaration/>         (> = alle Levels darunter)
```
- **Direct Messaging:** schnell, ohne Speicherung. Nachrichten können verloren gehen.
- **Guaranteed Messaging:** Nachrichten werden in Queues gespeichert. Eine Queue abonniert Topics.

**Hazelcast – verteilte Map:**
```java
HazelcastInstance hz = HazelcastClient.newHazelcastClient();
IMap<String, Customer> customers = hz.getMap("customers");
customers.put("42", customer);
```
- Die Daten sind in Partitionen geteilt (271 als Standard) und auf Knoten verteilt.
- Jede Partition hat Backups auf anderen Knoten.
- Embedded (im Java-Prozess) oder Client-Server.

## 3min
**Solace vs. Kafka:**
| | Solace | Kafka |
|---|---|---|
| Modell | Broker, Nachricht wird nach Ack gelöscht | Log, Nachrichten bleiben eine Zeit |
| Routing | feine Topic-Hierarchie mit Wildcards | Topic + Partition |
| Replay | begrenzt | stark |
| Protokolle | viele Standards | eigenes Protokoll |

**Hazelcast – wann sinnvoll:**
- Sehr schneller Zugriff auf oft gelesene Daten.
- Verteilte Sessions oder Locks zwischen mehreren Instanzen.
- Near Cache: lokale Kopie im Client für noch schnelleres Lesen.

**Fallen bei einem Cache:**
- Veraltete Daten. Man braucht eine klare Regel: TTL oder Invalidierung bei Änderung.
- Split-Brain bei Netzwerkfehlern. Zwei Teile des Clusters denken, sie sind allein.
- Der Cache ist nicht die Quelle der Wahrheit. Nach einem Neustart muss die App ohne ihn funktionieren.

**Was ich mitbringe:** Event-Design mit Kafka aus DAZiT. Idempotenz und Crash-Sicherheit aus MATCH. Das hilft bei jedem Broker.

## Follow-ups
- Was ist JMS? → Eine Java-API für Messaging mit Queues und Topics. Solace und ActiveMQ unterstützen sie.
- Solace oder Kafka? → Solace für feines Routing und viele Protokolle. Kafka für hohe Last und Replay.
- Was ist ein Data Grid? → Verteilter Speicher im RAM mit Rechenfunktionen nahe an den Daten.
- Wie vermeiden Sie veraltete Daten im Cache? → Kurze TTL oder ein Event bei Änderung, das den Eintrag löscht.
- Was ist RabbitMQ? → Ein klassischer Message Broker mit Exchanges und Queues. Gut für Aufgaben-Queues.

## Don't say
- „Solace ist wie Kafka.“ Das Modell ist anders: Broker mit Queues, nicht ein Log.
- „Ein Cache macht alles schneller.“ Er bringt auch Komplexität und veraltete Daten.

## Words
- **der Event Broker** = Vermittler für Nachrichten
- **abonnieren** = to subscribe
- **der Arbeitsspeicher** = RAM
- **das Backup** = Kopie für den Ausfall
- **veraltet** = stale, nicht mehr aktuell
