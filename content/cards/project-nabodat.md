---
id: project-nabodat
round: project
tech: [jsf, java, geoserver, soap, postgres]
tier: 2
project: BIT NABODAT
q: Erzählen Sie von NABODAT. Wie haben Sie von RichFaces auf PrimeFaces migriert?
en: Tell me about NABODAT. How did you migrate from RichFaces to PrimeFaces?
---
## 30s
NABODAT ist das nationale Bodeninformationssystem für Bund und Kantone.
Es ist eine Java-Enterprise-Webapplikation mit JSF, Spring und Hibernate.
Die Daten sind räumlich: PostgreSQL mit PostGIS, Hibernate Spatial und GeoTools.
Ich habe das Frontend von RichFaces auf PrimeFaces migriert, in Phasen.
Dazu kamen eigene Converter, PrimeFaces Extensions und Lazy Loading für grosse Tabellen.
Soll ich die Migrationsstrategie oder den GIS-Teil erklären?

## 90s
**Warum migrieren?** RichFaces wird seit Jahren nicht mehr weiterentwickelt. Keine Sicherheits-Updates, Probleme mit neuen Browsern und JSF-Versionen. *(Prüfen: War das der Grund im Projekt?)*

**Die Strategie in Phasen:**
1. Inventar: Welche RichFaces-Komponenten nutzen wir wo?
2. Für jede Komponente das PrimeFaces-Gegenstück wählen. Wo es keines gibt: PrimeFaces Extensions oder eigene Komponente.
3. Eigene Converter für Typen, die die alten Komponenten anders behandelt haben.
4. Seite für Seite umbauen und testen. Ajax Partial Rendering neu machen: `a4j:ajax render=` wird `p:ajax update=`.
5. Am Ende RichFaces ganz entfernen.

**Performance:** Lazy-Loading-Datentabellen. Die Tabelle lädt nur die sichtbare Seite aus der Datenbank, nicht alle Zeilen.

**GIS:** Geometrien in PostGIS. Hibernate Spatial bildet sie auf Java-Objekte ab. GeoTools verarbeitet die Geodaten für die Anzeige.

**Schnittstellen:** XML mit JAXB und XSD.

## 3min
**Warum in Phasen und nicht alles auf einmal?**
- Die Applikation ist in Produktion für Bund und Kantone. Ein Big Bang ist zu riskant.
- Kleine Schritte kann man testen und zurückrollen.
- Trade-off: In der Übergangszeit laufen zwei Bibliotheken. Das kann Konflikte bei JavaScript und CSS geben. *(Prüfen: Liefen RichFaces und PrimeFaces wirklich gleichzeitig?)*

**Typische Fallen bei so einer Migration:**
- IDs und Ajax-Updates verhalten sich anders. Ein falsches `update` lädt zu viel oder gar nichts neu.
- Converter: Ein Objekt in einem Dropdown braucht einen Converter, sonst kommt nur ein String zurück.
- Grosse Tabellen ohne Lazy Loading laden alles in den Speicher.

**Wann würde ich JSF heute nicht mehr wählen?**
Für eine neue Applikation mit viel Interaktion eher Angular plus REST. JSF passt gut zu einer bestehenden Java-Enterprise-Applikation mit vielen Formularen. Eine Migration auf PrimeFaces ist viel billiger als ein Neubau.

**Ergebnis:** *(Ihr echtes Beispiel: Anzahl migrierter Seiten, Ladezeit vorher/nachher.)*

## Follow-ups
- Was ist der Unterschied zwischen RichFaces und PrimeFaces? → Beide sind Komponenten-Bibliotheken für JSF. PrimeFaces wird aktiv gepflegt und hat mehr Komponenten.
- Wie funktioniert Lazy Loading in einer PrimeFaces DataTable? → Ein LazyDataModel lädt nur die aktuelle Seite. Es bekommt Offset, Seitengrösse, Sortierung und Filter.
- Was ist PostGIS? → Eine Erweiterung für PostgreSQL mit Geometrie-Typen, räumlichen Indizes (GiST) und Funktionen wie ST_Intersects.
- Wie finden Sie alle Bodenproben in einem Kanton? → Mit ST_Intersects oder ST_Within zwischen Proben-Punkt und Kantons-Polygon. Ein GiST-Index macht das schnell.
- Was macht JAXB? → JAXB bildet XML auf Java-Objekte ab und zurück. Aus dem XSD kann man die Klassen generieren.
- Wie haben Sie getestet? → JUnit, SonarQube und Jenkins. *(Ihr echtes Beispiel: wie die UI nach der Migration getestet wurde.)*
- Wie lange hat die Migration gedauert? → *(Ihr echtes Beispiel: Dauer.)*

## Don't say
- „JSF ist tot.“ Viele Bundesapplikationen laufen damit. Sagen Sie, wann es passt.
- Nicht nur „Ich habe die Tags ausgetauscht“. Erklären Sie Strategie, Risiko und Tests.

## Words
- **Bodeninformationssystem** = soil information system
- **räumlich** = spatial
- **Gegenstück** = equivalent
- **Big Bang** = alles auf einmal umstellen
- **Kanton** = Swiss state
