---
id: project-flaconi
round: project
tech: [spring, angular, soap, go, observability]
tier: 3
project: Flaconi
q: Was haben Sie bei Flaconi gemacht?
en: What did you do at Flaconi?
---
## 30s
Flaconi ist der grösste reine Online-Shop für Beauty in Deutschland.
Es gibt über 45 000 Produkte von über 720 Marken.
Ich habe ein Backend mit Spring Boot und eine Single-Page-App mit Angular 2 gebaut.
Alte Backend-Systeme habe ich über SOAP mit JAX-WS angebunden.
Dazu habe ich ein Bulk-Upload-Tool für Produkte gebaut.
Und einen SQL-Exporter in Go für Betriebs-Metriken, mit Prometheus und Grafana.
Soll ich ein Tool genauer erklären?

## 90s
**Die Teile:**
1. **Backend:** MVC mit J2EE und Spring Boot. REST-Services mit Swagger.
2. **Legacy-Anbindung:** SOAP-Consumer mit JAX-WS. Aus der WSDL werden Java-Klassen generiert.
3. **Bulk-Upload-Tool:** Angular 2, Java und REST. Viele Produkte auf einmal hochladen, statt jedes einzeln.
4. **Metriken:** Ein kleiner Service in Go. Er führt SQL-Abfragen aus und gibt die Ergebnisse als Prometheus-Metriken aus. Grafana zeigt sie als Dashboard.
5. **Build:** Jenkins und Docker.

**Wie ein SQL-Exporter funktioniert:**
- Prometheus ruft regelmässig `/metrics` auf (Pull).
- Der Exporter führt die Abfrage aus und gibt Zahlen im Prometheus-Format zurück.
- Beispiel: `orders_open_total 42`.

## 3min
**Warum Go für den Exporter?**
Ein Exporter ist klein, ein einzelnes Binary, wenig Speicher. Die Prometheus-Bibliotheken für Go sind sehr gut. *(Prüfen: War das der Grund im Projekt?)*

**Bulk-Upload: worauf muss man achten?**
- Validierung vor dem Speichern. Fehler pro Zeile zeigen, nicht den ganzen Upload abbrechen.
- Grosse Dateien nicht ganz in den Speicher laden.
- Idempotent: Derselbe Upload zweimal darf keine doppelten Produkte machen, zum Beispiel über eine eindeutige Artikelnummer.
*(Ihr echtes Beispiel: Wie viele Produkte pro Upload? Was hat das Tool gespart?)*

**SOAP heute:**
SOAP ist streng typisiert und hat einen klaren Vertrag (WSDL). Für neue Schnittstellen nehme ich eher REST mit OpenAPI. Aber alte Systeme bindet man mit SOAP sauber an.

**Trade-off beim Exporter:** Teure SQL-Abfragen bei jedem Scrape belasten die Datenbank. Darum kurze Abfragen, ein Scrape-Intervall mit Bedacht oder Caching.

## Follow-ups
- Was ist der Unterschied zwischen Pull und Push bei Prometheus? → Prometheus holt die Metriken selbst ab (Pull). Für kurze Jobs gibt es das Pushgateway.
- Wie generieren Sie den SOAP-Client? → Aus der WSDL mit wsimport oder einem Maven-Plugin. Dann ruft man die generierten Klassen auf.
- Was war schwierig bei Angular 2? → *(Ihr echtes Beispiel.)* Angular 2 war damals ganz neu, viele Libraries waren noch nicht fertig.
- Welche Metriken haben Sie exportiert? → *(Ihr echtes Beispiel: z. B. Bestellungen, Lagerbestand.)*
- Warum sind Sie zu CARIAD gewechselt? → *(Ihr echtes Beispiel: positiver Grund.)*

## Don't say
- „Das war nur ein Online-Shop.“ Nennen Sie die Grösse: 45 000+ Produkte, 720+ Marken.
- „SOAP ist veraltet und schlecht.“ Sagen Sie, wann es passt.

## Words
- **Bulk-Upload** = viele Datensätze auf einmal hochladen
- **Exporter** = Programm, das Metriken für Prometheus bereitstellt
- **Scrape** = Prometheus holt Metriken ab
- **Legacy-System** = altes System
