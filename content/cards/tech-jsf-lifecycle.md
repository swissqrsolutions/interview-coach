---
id: tech-jsf-lifecycle
round: tech
tech: [jsf]
tier: 3
project: BIT NABODAT
q: Erklären Sie den JSF-Lifecycle.
en: Explain the JSF lifecycle.
---
## 30s
JSF ist ein serverseitiges UI-Framework für Java.
Jeder Request geht durch sechs Phasen.
Zuerst baut JSF den Komponenten-Baum. Dann liest es die Werte, validiert sie und schreibt sie ins Model.
Danach ruft es die Action auf und rendert die Antwort.
Bei NABODAT, dem Bodeninformationssystem des Bundes, habe ich JSF-Komponenten refactored und von RichFaces auf PrimeFaces migriert.
Soll ich die Phasen einzeln erklären?

## 90s
1. **Restore View:** JSF baut den Komponenten-Baum oder lädt ihn aus dem State.
2. **Apply Request Values:** Jede Komponente liest ihren Wert aus dem Request. Noch als String.
3. **Process Validations:** Converter machen aus dem String einen Typ. Dann laufen die Validatoren.
4. **Update Model Values:** Die Werte gehen in die Bean, zum Beispiel `#{soilBean.depth}`.
5. **Invoke Application:** Die Action-Methode läuft, zum Beispiel `save()`.
6. **Render Response:** JSF rendert das HTML und speichert den View State.

**Fehler bei Validierung:** JSF springt direkt zu Phase 6. Das Model wird nicht geändert, die Action läuft nicht. Der User sieht die Fehlermeldung.

**Ajax:** Mit `<f:ajax execute="..." render="...">` oder in PrimeFaces `process` und `update` verarbeitet JSF nur einen Teil des Baums.

## 3min
**immediate="true":** Die Komponente wird schon in Phase 2 verarbeitet. Typisch für einen „Abbrechen“-Button, der keine Validierung braucht.

**Scopes:**
- `@RequestScoped`: pro Request.
- `@ViewScoped`: solange der User auf der gleichen Seite bleibt. Gut für Tabellen mit Ajax.
- `@SessionScoped`: pro User-Session. Vorsicht, das kostet Speicher.
- Heute CDI-Scopes aus `jakarta.*`, nicht mehr die alten `@ManagedBean`.

**Typische Probleme:**
- Getter mit Datenbank-Call. Getter laufen in mehreren Phasen und oft mehrfach. Daten in `@PostConstruct` oder beim Event laden.
- `process` zu groß. Dann validiert JSF Felder, die der User nicht sehen kann.
- `ViewExpiredException` nach Session-Timeout. Eigene Fehlerseite oder Redirect.
- Großer View State macht Requests langsam.

**Wie ich debugge:** Ein `PhaseListener` loggt jede Phase. Dann sieht man, wo ein Request stoppt.

**Wann JSF heute?** Für bestehende Fach-Apps im Bund ist es stabil. Für neue Apps mit viel Interaktion würde ich eher eine SPA mit Angular und eine REST-API wählen.

## Follow-ups
- Warum wird meine Action nicht aufgerufen? → Meist ein Validierungs- oder Konvertierungsfehler. JSF springt zu Render Response. Ein `<p:messages>` zeigt den Grund.
- Was ist ein Converter? → Er macht aus dem String im Request ein Objekt und zurück. Zum Beispiel für ein Datum oder eine Entity per ID.
- Was ist der Unterschied zwischen process und update? → `process` sagt, welche Komponenten verarbeitet werden. `update` sagt, welche neu gerendert werden.
- Was ist Jakarta Faces? → Der neue Name von JSF ab Jakarta EE. Namespace `jakarta.faces` statt `javax.faces`.

## Don't say
- „JSF ist tot.“ Es wird noch gepflegt und läuft in vielen Behörden-Apps.
- „Die Validierung passiert nach dem Model-Update.“ Falsch. Erst validieren, dann ins Model.

## Words
- **der Komponenten-Baum** = component tree
- **die Phase** = Schritt im Lifecycle
- **der Converter** = Umwandler String ↔ Objekt
- **rendern** = HTML erzeugen
- **der View State** = gespeicherter Zustand der Seite
