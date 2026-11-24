---
id: data-quality
round: data
tech: [lakehouse, spark, python]
tier: 2
project: ElCom MATCH (parity job)
q: Wie sichern Sie die Datenqualität in einer Pipeline?
en: How do you ensure data quality in a pipeline?
---
## 30s
Ich prüfe die Qualität an jeder Schicht, nicht erst am Ende.
Die wichtigsten Checks: Schema, Pflichtfelder, Duplikate, Wertebereiche, Aktualität und Menge.
Schlechte Zeilen kommen in eine Quarantäne-Tabelle. Sie stoppen nicht die ganze Pipeline.
Der stärkste Test bei MATCH war die Parität: Ein Job vergleicht SQL Server und Iceberg Tabelle für Tabelle.
Go-Live gab es erst bei 100 % Parität auf allen Charts.
Soll ich zeigen, wie so ein Check aussieht?

## 90s
**Die Arten von Checks:**
1. **Schema:** Spalten und Typen wie erwartet?
2. **Vollständigkeit:** Pflichtfelder nicht null?
3. **Eindeutigkeit:** keine doppelten fachlichen Schlüssel?
4. **Gültigkeit:** Werte im erlaubten Bereich? Preis ≥ 0, Datum nicht in der Zukunft.
5. **Konsistenz:** Fremdschlüssel vorhanden? Summen passen?
6. **Aktualität:** Sind heute Daten gekommen?
7. **Menge:** Plötzlich 90 % weniger Zeilen als gestern?

**Check in SQL, laut gesagt:**
```
SELECT message_id, contract_id, count(*) AS n
FROM silver.contracts
GROUP BY message_id, contract_id
HAVING count(*) > 1;
```
„Ich suche doppelte Verträge pro Meldung. Das Ergebnis muss leer sein.“ *(Prüfen: echter fachlicher Schlüssel der Tabelle.)*

**Parity bei MATCH:** `validate_parity.py` vergleicht die Ergebnisse des alten Systems (SQL Server) mit Iceberg, Tabelle für Tabelle. Das war das Abnahmekriterium für den Go-Live.

## 3min
**Was die Parität gefunden hat:** Am Anfang passten die Ergebnisse nicht. Ursachen: .NET und Spark parsen Zahlen und Datumswerte kulturabhängig unterschiedlich. null gegen leeren String. Und die Zeitzone von `received_date`. Ich habe fünf Extractor-Bugs behoben. Lektion: Business-Logik nie ohne einen maschinell prüfbaren Vergleich portieren.

**Noch ein Fund:** Der Chart „CumulativeSum“ rechnete in Wirklichkeit eine Tagessumme, keine laufende Summe. Für die Parität haben wir das Verhalten nachgebaut. Die fachliche Korrektur ist eine eigene, sichtbare Entscheidung.

**Wo die Checks laufen:**
- Bronze → Silver: Schema, Pflichtfelder, Typen. Fehler → Quarantäne.
- Silver: Duplikate, Fremdschlüssel.
- Gold: Summen-Abgleich, Parität, Plausibilität.
- In der CI: Bei MATCH sind die Python-Tests in die .NET-Komponententests integriert. Ein CI-Gate für alles.

**Blockieren oder warnen?**
- Kritisch (Schema kaputt, Parität falsch): Pipeline stoppen.
- Weich (einzelne kaputte Zeilen): Quarantäne und Alarm, Rest läuft weiter.

**Werkzeuge:** Great Expectations, Soda, dbt-Tests. Bei MATCH haben wir eigene Python-Jobs genutzt. *(Prüfen: ob es weitere Checks gab.)*

**Was ich heute früher machen würde:** *(Vorschlag, durch Ihre echte Antwort ersetzen.)* Qualitätsregeln von Anfang an als Code, nicht erst bei der Parität.

## Follow-ups
- Was machen Sie mit fehlerhaften Zeilen? → In eine Quarantäne-Tabelle, mit Grund und Meldungs-ID. Nach der Korrektur kann ich sie neu laden.
- Wie messen Sie Datenqualität über die Zeit? → Kennzahlen pro Lauf in Prometheus: Anzahl Zeilen, Anteil Fehler. Grafana zeigt Trends und alarmiert.
- Wer ist für die Qualität verantwortlich? → Die Quelle für den Inhalt, das Daten-Team für die Prüfung. Ein Data Contract hilft.
- Wie haben Sie die Parität technisch gebaut? → Gleiche Eingabe, dann die Ergebnisse beider Systeme Tabelle für Tabelle verglichen. Automatisch, als Job.
- Was ist Data Observability? → Automatisch Aktualität, Menge, Schema und Verteilungen überwachen und bei Abweichungen alarmieren.

## Don't say
- „Wir prüfen die Daten am Ende im Bericht.“ Dann ist es zu spät.
- „Die Quelle liefert immer saubere Daten.“

## Words
- **die Datenqualität** = data quality
- **die Quarantäne-Tabelle** = Tabelle für fehlerhafte Zeilen
- **die Parität** = gleiche Ergebnisse wie das alte System
- **das Abnahmekriterium** = acceptance criterion
- **kulturabhängig** = abhängig von Sprache und Land (Komma, Datumsformat)
