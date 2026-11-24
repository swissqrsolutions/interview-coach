---
id: tech-jsf-primefaces-migration
round: tech
tech: [jsf]
tier: 3
project: BIT NABODAT
q: Wie haben Sie die Migration von RichFaces auf PrimeFaces gemacht?
en: How did you migrate from RichFaces to PrimeFaces?
---
## 30s
Bei NABODAT, dem nationalen Bodeninformationssystem, habe ich RichFaces durch PrimeFaces ersetzt.
RichFaces ist seit 2016 End of Life. Es gibt keine Updates mehr.
*(Prüfen: Ihr echter Grund für die Migration bei NABODAT.)*
Wir haben in Phasen migriert, nicht alles auf einmal.
Dabei habe ich JSF-Komponenten und Ajax-Partial-Rendering refactored.
Wir haben eigene Converter geschrieben und PrimeFaces Extensions benutzt.
Für die Performance haben wir Lazy-Loading-Tabellen eingeführt.
Soll ich ein Beispiel für eine Komponente zeigen?

## 90s
**Mapping der Komponenten:**
| RichFaces | PrimeFaces |
|---|---|
| `a4j:commandButton` | `p:commandButton` |
| `rich:dataTable` | `p:dataTable` |
| `render` / `reRender` | `update` |
| `execute` | `process` |
| `rich:popupPanel` | `p:dialog` |

**Lazy-Loading-Tabelle:**
```java
public class SoilSampleLazyModel extends LazyDataModel<SoilSample> {
  @Override
  public int count(Map<String, FilterMeta> filters) {
    return service.count(filters);
  }
  @Override
  public List<SoilSample> load(int first, int pageSize,
      Map<String, SortMeta> sort, Map<String, FilterMeta> filters) {
    return service.find(first, pageSize, sort, filters);
  }
}
```
Die Datenbank liefert nur eine Seite. Nicht alle Datensätze.

**Converter:** Für Entities in Dropdowns. Der Converter macht aus der ID ein Objekt und zurück.

## 3min
**Phasen:** *(Ihr echtes Vorgehen: Welche Seiten zuerst? Wie lange lief alt und neu parallel?)*
Ein typischer Plan: zuerst gemeinsame Templates und Layout, dann einfache Seiten, dann komplexe Seiten mit Ajax.

**Schwierigkeiten bei so einer Migration:**
- Ajax-Verhalten ist anders. PrimeFaces hat andere Defaults für `process` als RichFaces für `execute`. Jede Seite testen.
- CSS und Layout ändern sich. Eigene Styles müssen neu angepasst werden.
- Beide Libraries bringen eigenes JavaScript. Zusammen auf einer Seite kann das Konflikte geben.

**Was gut funktioniert:**
- Lazy Loading in Tabellen: Die Seite lädt schneller, und der Speicher auf dem Server bleibt klein.
- Eine Liste aller Komponenten und ihres Status. So sieht man den Fortschritt.

**Was ich anders machen würde:** Mehr automatisierte UI-Tests vor der Migration. Dann sieht man Regressionen sofort.
*(Prüfen: Gab es bei NABODAT UI-Tests? Welche Zahl passt: Anzahl Seiten oder Komponenten?)*

## Follow-ups
- Warum PrimeFaces und nicht eine SPA? → *(Ihr echter Grund.)* Allgemein: weniger Risiko, gleiche Architektur, das Team kennt JSF.
- Was ist der Default von process in PrimeFaces? → Bei `p:commandButton` ist es `@form`. Bei Ajax-Events meist `@this`.
- Wie testen Sie JSF-Seiten? → Mit UI-Tests im Browser, zum Beispiel Playwright. Und Unit Tests für Beans und Converter.
- Was sind PrimeFaces Extensions? → Zusätzliche Komponenten und Helfer, die PrimeFaces selbst nicht hat.
- Was bringt Lazy Loading in der Tabelle? → Nur eine Seite kommt aus der Datenbank. Das spart Zeit und Speicher.

## Don't say
- „Das war nur Suchen und Ersetzen.“ Ajax, Layout und Verhalten ändern sich.
- Keine Zahlen erfinden, zum Beispiel „200 Seiten migriert“, wenn Sie es nicht genau wissen.

## Words
- **gepflegt** = maintained
- **das Partial Rendering** = nur einen Teil der Seite neu laden
- **die Regression** = alter Fehler kommt zurück, oder etwas geht kaputt
- **der Datensatz** = record
- **parallel** = gleichzeitig
