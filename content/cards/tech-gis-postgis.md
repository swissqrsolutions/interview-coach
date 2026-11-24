---
id: tech-gis-postgis
round: tech
tech: [geoserver]
tier: 4
project: BIT NABODAT
q: Wie arbeiten Sie mit Geodaten in PostGIS und Java?
en: How do you work with spatial data in PostGIS and Java?
---
## 30s
PostGIS ist eine Erweiterung für PostgreSQL. Sie speichert Geometrien wie Punkte, Linien und Flächen.
Man kann damit räumlich abfragen: Was liegt in diesem Kanton? Was ist 500 Meter entfernt?
Ein räumlicher Index mit GiST macht diese Abfragen schnell.
Bei NABODAT, dem Bodeninformationssystem des Bundes, habe ich mit PostGIS, Hibernate Spatial und GeoTools gearbeitet.
Wir haben Bodendaten für den Bund und die Kantone verarbeitet und angezeigt.
Soll ich eine typische Abfrage zeigen?

## 90s
**Tabelle und Index:**
```sql
CREATE TABLE soil_sample (
  id bigserial PRIMARY KEY,
  depth_cm int,
  geom geometry(Point, 2056)
);
CREATE INDEX soil_sample_geom_idx ON soil_sample USING GIST (geom);
```
- `2056` ist der SRID für das Schweizer Koordinatensystem LV95.

**Abfrage: Proben in einer Fläche:**
```sql
SELECT s.id, s.depth_cm
FROM soil_sample s
JOIN canton c ON ST_Intersects(s.geom, c.geom)
WHERE c.code = 'BE';
```

**Abfrage: Proben im Umkreis von 500 m:**
```sql
SELECT id FROM soil_sample
WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(2600000, 1200000), 2056), 500);
```

**In Java:** Hibernate Spatial mappt die Spalte auf eine JTS-`Geometry`. GeoTools hilft bei Formaten wie Shapefile und bei Transformationen.

## 3min
**geometry vs. geography:**
- `geometry`: flache Koordinaten, schnell. Gut für ein Land wie die Schweiz in LV95.
- `geography`: Kugel der Erde, in Metern. Gut für weltweite Daten, aber langsamer.

**Performance:**
- Funktionen wie `ST_Intersects` und `ST_DWithin` nutzen den Index. `ST_Distance(...) < 500` im WHERE nutzt ihn nicht.
- Große Polygone mit vielen Punkten sind langsam. `ST_Subdivide` teilt sie in kleine Stücke.
- Koordinaten nur einmal transformieren. `ST_Transform` in jeder Zeile einer Abfrage kostet viel.

**Typische Fehler:**
- Gemischte SRIDs. Dann gibt es Fehler oder falsche Ergebnisse.
- X und Y vertauscht (Längengrad und Breitengrad).
- Ungültige Polygone. Prüfen mit `ST_IsValid`, reparieren mit `ST_MakeValid`.

**GeoServer:** GeoServer veröffentlicht Geodaten als Standard-Dienste: WMS für Kartenbilder, WFS für Features. Mit GeoServer selbst habe ich nicht produktiv gearbeitet. Ich kenne das Prinzip von den GIS-Services bei NABODAT.
*(Prüfen: Welches SRID und welche Kartenanzeige hatte NABODAT?)*

## Follow-ups
- Was ist ein SRID? → Die ID des Koordinatensystems. Zum Beispiel 4326 für WGS84 und 2056 für LV95.
- Warum GiST und nicht B-Tree? → B-Tree sortiert eine Dimension. GiST indexiert Bounding Boxes in zwei Dimensionen.
- Was ist der Unterschied zwischen ST_Intersects und ST_Within? → Intersects: berühren oder überlappen. Within: komplett innerhalb.
- Wie zeigen Sie Geodaten im Browser? → Als GeoJSON oder als Kartenbild über WMS. Zum Beispiel mit OpenLayers oder Leaflet.
- Was sind WMS und WFS? → WMS liefert Bilder einer Karte. WFS liefert die Geometrien und Attribute selbst.

## Don't say
- „Ich habe GeoServer betrieben.“ Nicht wahr. PostGIS und GeoTools ja, GeoServer selbst nein.
- „Distanz in Grad ist Meter.“ In WGS84 sind es Grad. Für Meter braucht man ein metrisches System oder `geography`.

## Words
- **die Geometrie** = Punkt, Linie, Fläche
- **räumlich** = spatial
- **das Koordinatensystem** = coordinate reference system
- **der Umkreis** = radius around a point
- **der Kanton** = Swiss canton
