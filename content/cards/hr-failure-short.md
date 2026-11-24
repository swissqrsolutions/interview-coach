---
id: hr-failure-short
round: hr
tech: [lakehouse, spark]
tier: 1
project: ElCom MATCH (parity hunt)
q: Erzählen Sie kurz von einem Misserfolg.
en: Briefly tell me about a failure.
---
## 30s
Bei MATCH haben wir die Statistik von .NET nach PySpark portiert.
Am Anfang stimmten die Ergebnisse nicht mit dem alten System überein.
Ich habe die Ursachen gesucht und fünf Fehler in den Extraktoren gefunden.
Danach habe ich einen automatischen Paritäts-Job gebaut.
Am Ende hatten wir 100 % Parität, und das war die Bedingung für den Go-live.
Meine Lektion: Geschäftslogik nie ohne automatischen Vergleich portieren.

## 90s
**Die Ursachen (konkret):**
- .NET und Spark lesen Zahlen und Daten verschieden, je nach Kultur-Einstellung.
- Null und leerer String wurden verschieden behandelt.
- Die Zeitzone von `received_date` war nicht gleich.

**Was ich gemacht habe:**
1. Die Abweichungen Tabelle für Tabelle gesucht.
2. Fünf verschiedene Fehler in den Extraktoren behoben.
3. Den Job `validate_parity.py` gebaut. Er vergleicht SQL Server und Iceberg, Tabelle für Tabelle.
4. Go-live nur bei 100 % Parität auf allen Charts.

## 3min
**STAR-L:**
- **Situation:** Migration der Statistik von .NET nach PySpark bei der ElCom.
- **Aufgabe:** Gleiche Ergebnisse wie das alte System, als Abnahmekriterium.
- **Aktion:** Ich habe die Abweichungen analysiert, fünf Extraktor-Fehler behoben und einen automatischen Paritäts-Job gebaut.
- **Resultat:** 100 % Parität über sieben Rechner. Go-live parallel zum alten System.
- **Lektion:** Ohne einen maschinellen Vergleich findet man solche Fehler zu spät.

**Was ich heute anders machen würde:**
Den Paritäts-Job am ersten Tag bauen, nicht nach den ersten Fehlern.

**Zweite kurze Geschichte, falls gewünscht:**
Nessie lief auf einer eingebetteten RocksDB. Bei einem Pod-Neustart konnte der Zustand verloren gehen. Wir haben Nessie auf ein Postgres-Backend umgestellt. Lektion: Der Katalog ist der wertvollste Teil eines Lakehouse.

## Follow-ups
- War das Ihr Fehler? → *(Prüfen: Wer hat die erste Version gebaut?)* Wichtig ist: Ich habe die Ursache gefunden und den Prozess verbessert.
- Wie lange hat das gedauert? → *(Ihr echtes Beispiel: Dauer.)*
- Wie haben Sie das dem Kunden erklärt? → Mit Zahlen: welche Tabelle, wie viel Abweichung, welcher Fix.
- Gab es einen Fehler, den Sie bewusst nicht korrigiert haben? → Ja. Der Chart „CumulativeSum“ rechnete eine Tagessumme, keine laufende Summe. Für die Parität haben wir das nachgebaut. Die Korrektur ist ein eigener, sichtbarer Entscheid.

## Don't say
- „Ich habe nie Misserfolge.“
- Eine Geschichte, in der nur andere schuld sind.
- Eine Geschichte ohne Lektion.

## Words
- **der Misserfolg** = failure
- **die Abweichung** = difference / deviation
- **die Ursache** = root cause
- **beheben** = to fix
- **das Abnahmekriterium** = acceptance criterion
