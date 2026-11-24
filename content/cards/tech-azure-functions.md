---
id: tech-azure-functions
round: tech
tech: [azure]
tier: 2
project: DigiSanté (Upload-Function, Event-Hub-Function)
q: Wann setzen Sie Azure Functions ein, und worauf achten Sie dabei?
en: When do you use Azure Functions, and what do you watch out for?
---
## 30s
Azure Functions ist Serverless: kleiner Code, der auf ein Ereignis reagiert.
Ein Trigger startet die Function, zum Beispiel HTTP, ein Blob oder ein Event Hub.
Azure skaliert die Instanzen automatisch.
Bei DigiSanté nutzen wir Functions im Upload-Dienst.
Die Upload-Function antwortet direkt nach dem Schreiben in den Blob.
Eine eigene Event-Hub-Function verarbeitet das Scan-Ergebnis von Defender.
Soll ich sagen, worauf man achten muss?

## 90s
**Trigger und Bindings:**
- **Trigger:** was die Function startet. HTTP, Timer, Blob, Queue, Service Bus, Event Hub, Event Grid.
- **Bindings:** Ein- und Ausgaben ohne eigenen Client-Code, zum Beispiel „schreibe in diesen Blob“.

**Die Event-Hub-Function (Prinzip):**
1. Sie bekommt einen Batch von Events aus einer Partition.
2. Pro Event: Scan-Ergebnis lesen → Datei freigeben oder löschen.
3. Danach setzt die Runtime einen Checkpoint.
4. Bei einem Fehler kann derselbe Batch noch einmal kommen. Darum muss die Verarbeitung idempotent sein.

Laut gesagt: „Freigeben oder Löschen zweimal ausführen gibt dasselbe Ergebnis. Darum ist ein doppeltes Event kein Problem.“

**Hosting-Pläne (heute):**
- **Flex Consumption:** zahlen pro Nutzung, VNet-Integration, schnelle Skalierung. Der empfohlene Plan für neue Serverless-Apps.
- **Premium:** vorgewärmte Instanzen, kein Cold Start, VNet.
- **Dedicated (App Service Plan):** feste VMs.
- Der alte Consumption-Plan hat keine VNet-Integration.
*(Prüfen: welcher Plan bei DigiSanté genutzt wird.)*

## 3min
**Worauf ich achte:**
- **Cold Start:** Nach Pause braucht die erste Anfrage länger. Bei Java spürbar. → Premium oder Always-Ready-Instanzen in Flex Consumption.
- **Timeouts:** Functions sind für kurze Aufgaben. Lange Arbeit → Durable Functions oder ein eigener Worker.
- **Idempotenz:** Alle Trigger mit Events oder Queues liefern mindestens einmal.
- **Fehler:** Event Hub hat keine Dead-Letter-Queue. Ein Fehler darf die Partition nicht blockieren. → Retry-Policy, dann den Fehler selbst wegschreiben und weitermachen.
- **Netzwerk:** Bei DigiSanté sind Functions, Storage, Key Vault und Event Hub nur über Private Endpoints erreichbar.
- **Identität:** Managed Identity statt Connection Strings mit Schlüssel.

**Sicherheit bei DigiSanté (Upload):**
- JWT mit RS256 wird gegen den öffentlichen Schlüssel aus Key Vault geprüft, bevor das erste Byte gespeichert wird.
- Apache Tika prüft den echten Dateityp an den Bytes. So hilft keine falsche Dateiendung.

**Wann keine Function?**
- Lange Prozesse, viel Zustand, viele Abhängigkeiten zwischen Services.
- Sehr gleichmäßige hohe Last: Dann ist ein Container (Container Apps, AKS) oft billiger und einfacher.

## Follow-ups
- Wie testen Sie Functions? → Die Logik in normale Klassen auslagern und mit Unit-Tests prüfen. Die Function ist nur eine dünne Hülle.
- Was ist Durable Functions? → Eine Erweiterung für Workflows mit Zustand: Orchestrator, Activities, Warten auf Events.
- Function oder Container App? → Kurze, ereignisgesteuerte Aufgaben → Function. Langlaufende Services mit eigener Runtime → Container App.
- Wie skaliert eine Event-Hub-Function? → Höchstens so parallel wie die Anzahl Partitionen.

## Don't say
- „Serverless heißt, es gibt keine Server und keine Limits.“ Es gibt Timeouts, Cold Starts und Kosten.
- „Ein Event kommt genau einmal.“

## Words
- **Trigger** = Auslöser
- **vorgewärmt** = pre-warmed
- **Hülle** = wrapper, shell
- **auslagern** = to move out (into another class)
- **gleichmäßig** = steady
