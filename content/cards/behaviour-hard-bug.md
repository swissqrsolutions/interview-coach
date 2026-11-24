---
id: behaviour-hard-bug
round: behaviour
tech: [spark, python, dotnet]
tier: 1
project: ElCom MATCH
q: Was war der schwierigste Bug, den Sie gelöst haben?
en: What was the hardest bug you have solved?
---
## 30s
Bei MATCH haben wir die Statistik von .NET nach PySpark portiert.
Die Ergebnisse waren am Anfang nicht gleich wie im alten System.
Es gab nicht einen Bug, sondern fünf verschiedene Extractor-Bugs.
Die Ursachen: .NET und Spark lesen Zahlen, Datumswerte, leere Felder und Zeitzonen anders.
Ich habe alle fünf gefunden und einen automatischen Parity-Job gebaut.
Am Ende hatten wir 100 % Parität. Das war die Bedingung für den Go-Live.

## 90s
**Die Ursachen:**
1. **Zahlen:** .NET parst kulturabhängig. Komma oder Punkt als Dezimaltrennzeichen.
2. **Datumswerte:** auch kulturabhängig formatiert und gelesen.
3. **null gegen leeren String:** Ein leeres Feld war in einem System null, im anderen "".
4. **Zeitzone von received_date:** Eine Meldung kann so in einen anderen Tag rutschen. Dann stimmt die Tagesstatistik nicht.

**Mein Vorgehen:**
- Gleiche Eingabe in beide Systeme.
- Ergebnisse Tabelle für Tabelle vergleichen.
- Jede Abweichung bis zum einzelnen Record verfolgen.
- Bug fixen, dann den Vergleich nochmal laufen lassen.
- Am Ende: der Job `validate_parity.py` als automatischer Test.

## 3min
**STAR-L:**
- **Situation:** Bei MATCH mussten sieben Statistik-Rechner von .NET nach PySpark. Die ersten Ergebnisse stimmten nicht.
- **Aufgabe:** 100 % Parität auf allen Charts, sonst kein Go-Live.
- **Aktion:** Ich habe die Abweichungen systematisch bis zum einzelnen Record verfolgt. Ich habe fünf Extractor-Bugs gefunden: Zahlen- und Datumsformat, null gegen leeren String, Zeitzone. Ich habe sie behoben. Dann habe ich einen automatischen Parity-Job gebaut, der SQL Server und Iceberg vergleicht.
- **Resultat:** 100 % Parität, Go-Live parallel zum alten System.
- **Lektion:** Nie Business-Logik portieren ohne einen maschinell prüfbaren Parity-Test.

**Warum es schwer war:**
- Mehrere Ursachen gleichzeitig. Ein Fix machte nicht alles grün. Man glaubt schnell, man hat es, und dann gibt es noch eine Abweichung.
- Die Fehler waren nicht im Rechner, sondern im Extractor, also beim Parsen. Man sucht zuerst an der falschen Stelle.
- Dazu die CumulativeSum: Der Chart rechnete eine Tagessumme, keine laufende Summe. Für die Parität musste ich das nachbauen.

## Follow-ups
- Wie haben Sie die Ursache eingegrenzt? → Abweichung finden, dann den einzelnen Record in beiden Systemen vergleichen. *(Ihr echtes Beispiel: ein konkreter Record oder Tag.)*
- Wie lange hat die Suche gedauert? → *(Ihr echtes Beispiel.)*
- Wie verhindern Sie solche Bugs in Spark? → Explizites Schema, feste Formate beim Parsen, eine feste Zeitzone (z. B. spark.sql.session.timeZone) und Tests mit Randfällen.
- Was war der schwierigste der fünf? → *(Ihr echtes Beispiel.)*
- Was würden Sie anders machen? → Den Parity-Test am ersten Tag bauen, nicht erst, wenn Abweichungen auftauchen.

## Don't say
- „Am Ende hat es irgendwie funktioniert.“
- Nicht nur „ein Datumsfehler“ sagen. Nennen Sie alle Ursachen und das System dahinter.

## Words
- **Abweichung** = difference, mismatch
- **Dezimaltrennzeichen** = decimal separator
- **rutschen** = slip (into another day)
- **verfolgen** = trace
- **maschinell prüfbar** = machine-checkable
