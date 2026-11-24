---
id: tech-camunda-bpmn
round: tech
tech: [camunda]
tier: 3
proof: study
project: MATCH (Status-Maschine) als Vergleich
q: Was ist Camunda und wie funktioniert eine BPMN-Prozess-Engine?
en: What is Camunda and how does a BPMN process engine work?
---
## 30s
Camunda ist eine Workflow-Engine. Sie führt Prozesse aus, die in BPMN modelliert sind.
BPMN ist eine grafische Sprache. Fachleute und Entwickler verstehen das gleiche Diagramm.
Die Engine speichert den Zustand jeder Prozess-Instanz. Sie kann warten, Timer starten und Fehler behandeln.
Typisch für Behörden: lange Abläufe mit Menschen und Systemen, zum Beispiel ein Antrag.
Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich von MATCH: Dort haben wir eine eigene Status-Maschine gebaut, mit Pending, Processing, Completed und Stale-Job-Recovery.

## 90s
**BPMN-Elemente:**
- **Start- und End-Event:** Anfang und Ende.
- **Service Task:** Ein System macht etwas, zum Beispiel eine REST-API aufrufen.
- **User Task:** Ein Mensch macht etwas, zum Beispiel einen Antrag prüfen.
- **Gateway:** Verzweigung. Exklusiv (XOR) = ein Weg. Parallel (AND) = alle Wege.
- **Timer Event:** Warten, zum Beispiel 14 Tage Frist.
- **Message Event:** Warten auf eine Nachricht von außen.

**Ablauf in der Engine:**
1. Prozess-Instanz startet mit Variablen.
2. Die Engine läuft bis zum nächsten Wartepunkt.
3. Sie speichert den Zustand in der Datenbank.
4. Ein Event, ein Timer oder ein Worker setzt den Prozess fort.

**External Task Pattern:** Ein Worker holt Aufgaben bei der Engine ab (fetch and lock). Er macht die Arbeit und meldet „complete“ oder „failure“. Die Engine bleibt vom Code getrennt.

## 3min
**Versionen:**
- Camunda 7: Engine in Java, oft eingebettet in Spring Boot, mit relationaler DB. Die Community Edition ist seit Oktober 2025 end of life.
- CIB seven: ein Open-Source-Fork von Camunda 7. Wird weiter gepflegt.
- Camunda 8: neue Engine Zeebe, verteilt, ohne relationale DB, nur mit externen Workern.

**Wann eine Engine sinnvoll ist:**
- Lange Prozesse über Tage oder Wochen.
- Menschliche Schritte, Fristen, Eskalationen.
- Fachbereich will den Ablauf sehen und mitreden.
- Audit: Wer hat wann was gemacht?

**Wann nicht:**
- Kurze technische Abläufe in Millisekunden. Dann reicht Code oder ein Event-Flow.
- Wenn nur eine einfache Status-Spalte nötig ist, wie bei MATCH. Eine Engine wäre dort zu schwer.

**Fallen:**
- Zu viel Logik im Diagramm. Das Diagramm zeigt den Ablauf. Die Fachlogik gehört in Services.
- Große Prozess-Variablen. Die Datenbank wird langsam. Nur IDs speichern.
- Neue Prozess-Version, aber alte Instanzen laufen noch. Man braucht einen Plan für die Migration.

**Mein Bezug:** Bei MATCH lösen wir Teilprobleme einer Engine selbst: atomares Claimen, Retry, Timeout und Recovery. Darum verstehe ich, was eine Engine abnimmt.

## Follow-ups
- Was ist ein Incident? → Ein Fehler nach allen Retries. Ein Mensch muss ihn im Cockpit (Camunda 7) oder Operate (Camunda 8) lösen.
- Was ist eine Kompensation? → Rückgängig machen in einem langen Prozess, ähnlich wie im Saga Pattern.
- Was ist DMN? → Entscheidungstabellen. Fachregeln in einer Tabelle statt im Code.
- Wie testen Sie einen Prozess? → Unit Tests pro Pfad, mit den Test-Libraries von Camunda. Jeder Gateway-Weg wird getestet.
- Camunda 7 oder 8 für ein neues Projekt? → Hängt vom Betrieb ab. Camunda 8 für neue, verteilte Systeme. Für bestehende Camunda-7-Apps ist CIB seven ein Weg.

## Don't say
- „BPMN ist nur ein Bild.“ Die Engine führt das Modell wirklich aus.
- „Ich habe schon Camunda-Prozesse gebaut.“ Nicht wahr. Ehrlich bleiben.

## Words
- **die Prozess-Instanz** = ein laufender Fall
- **das Gateway** = Verzweigung
- **die Frist** = deadline
- **fortsetzen** = to continue
- **der Antrag** = application form, request
