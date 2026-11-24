---
id: tech-azure-events
round: tech
tech: [azure]
tier: 1
project: DigiSanté (Upload-Quarantäne mit Event Grid und Event Hub)
q: Event Grid, Event Hub oder Service Bus – wann nehmen Sie was?
en: Event Grid, Event Hub or Service Bus – when do you use which?
---
## 30s
Event Grid meldet einzelne Ereignisse: „Etwas ist passiert.“ Es schickt sie per Push an Abonnenten.
Event Hub ist für Streams mit vielen Events. Er hat Partitionen und speichert eine Zeit lang, ähnlich wie Kafka.
Service Bus ist für wichtige Geschäfts-Nachrichten: Queues, Topics, Sessions, Dead-Letter.
Bei DigiSanté nutzen wir Event Grid und Event Hub in der Upload-Pipeline.
Das Scan-Ergebnis von Microsoft Defender verarbeitet eine eigene Event-Hub-Function.
Soll ich die Pipeline zeigen?

## 90s
**Faustregel:**
| | Event Grid | Event Hub | Service Bus |
|---|---|---|---|
| Typ | Ereignis-Verteilung | Event-Streaming | Message Broker |
| Modell | Push | Pull, Partitionen, Offsets | Pull, Queue / Topic |
| Speichern | nein, nur Retry | ja, Retention | bis zur Verarbeitung |
| Gut für | „Blob erstellt“, Reaktionen | Telemetrie, Logs, viele Events | Aufträge, Zahlungen, Workflows |
| Reihenfolge | nein | pro Partition | mit Sessions |

**DigiSanté: Upload mit Quarantäne:**
1. Die Upload-Function schreibt die Datei in den Blob Storage und antwortet sofort.
2. Microsoft Defender scannt die Datei.
3. Das Scan-Ergebnis verarbeitet eine eigene Function über Event Hub.
4. Ergebnis sauber → Datei freigeben. Ergebnis gefährlich → Datei löschen.
*(Prüfen: die genaue Kette Defender → Event Grid → Event Hub.)*

Laut gesagt: „Der Upload wartet nicht auf den Scan. Der Nutzer bekommt sofort eine Antwort. Der Rest läuft eventgesteuert.“

## 3min
**Netzwerk bei DigiSanté:**
Functions, Storage, Key Vault und Event Hub sind nur über Private Endpoints erreichbar. Für Event Grid gibt es eine bewusste Ausnahme mit öffentlichem Zugang. Defender for Cloud läuft in einer Netzwerk-Grenze, die Microsoft verwaltet.
*(Prüfen: der genaue Grund für die Event-Grid-Ausnahme.)*

**Details, die Interviewer fragen:**
- **Event Grid:** At-least-once. Retry mit Backoff bis 24 Stunden. Danach Dead-Letter in einen Blob-Container, wenn konfiguriert. Filter nach Event-Typ und Pfad.
- **Event Hub:** Partitionen bestimmen die Parallelität. Consumer Groups lesen unabhängig. Checkpoints merken sich den Offset. Er spricht auch das Kafka-Protokoll.
- **Service Bus:** Peek-Lock: Die Nachricht ist gesperrt, bis der Consumer sie abschließt. Dead-Letter-Queue nach zu vielen Versuchen. Duplikat-Erkennung, Sessions für Reihenfolge, Transaktionen.

**Gemeinsam für alle:** Zustellung mindestens einmal. Darum muss der Empfänger idempotent sein. Ein Scan-Ergebnis zweimal verarbeiten darf nichts kaputt machen.

**Trade-offs:**
- Event Grid ist billig und einfach, aber kein Speicher und keine Reihenfolge.
- Event Hub ist stark bei Durchsatz, aber kein Broker mit Per-Message-Ack.
- Service Bus ist zuverlässig und reich an Funktionen, aber weniger Durchsatz als Event Hub.

## Follow-ups
- Was passiert, wenn der Empfänger von Event Grid nicht erreichbar ist? → Event Grid versucht es wieder, mit Backoff. Am Ende geht das Event in den Dead-Letter-Speicher, wenn er konfiguriert ist.
- Kann ich Event Hub statt Kafka nehmen? → Oft ja. Event Hub hat einen Kafka-Endpunkt. Es gibt aber Grenzen, zum Beispiel bei der Retention je nach Tier.
- Wie erreichen Sie Reihenfolge in Service Bus? → Mit Sessions. Alle Nachrichten mit derselben Session-ID gehen in Reihenfolge an einen Empfänger.
- Warum antwortet der Upload sofort? → Der Scan dauert. Der Nutzer soll nicht warten, und die Datei ist bis zur Freigabe in Quarantäne.

## Don't say
- „Event Grid und Event Hub sind dasselbe.“ Das eine verteilt Ereignisse, das andere ist ein Stream.
- „Service Bus garantiert genau einmal.“ Es ist mindestens einmal, mit Hilfen gegen Duplikate.

## Words
- **Abonnent** = subscriber
- **Ereignis** = event
- **Quarantäne** = quarantine, gesperrter Bereich
- **freigeben** = to release
- **Durchsatz** = throughput
