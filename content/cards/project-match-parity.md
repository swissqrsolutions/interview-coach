---
id: project-match-parity
round: project
tech: [spark, python, dotnet, lakehouse]
tier: 1
project: ElCom MATCH
q: Wie haben Sie die Statistik von .NET nach PySpark portiert und bewiesen, dass sie gleich rechnet?
en: How did you port the statistics from .NET to PySpark and prove they compute the same?
---
## 30s
Die alte Statistik lief in .NET, Zeile für Zeile auf SQL Server.
Ich habe sieben Rechner nach PySpark portiert, in die Gold-Schicht.
Die Bedingung für den Go-Live war: 100 % gleiche Ergebnisse.
Dafür habe ich einen eigenen Parity-Job gebaut. Er vergleicht SQL Server und Iceberg Tabelle für Tabelle.
Am Anfang war nicht alles gleich. Ich habe fünf Extractor-Bugs gefunden und behoben.
Soll ich ein Beispiel für so einen Bug geben?

## 90s
**Das Vorgehen:**
1. Gleiche Eingabedaten in beide Systeme.
2. Der Job `validate_parity.py` liest die Ergebnisse aus SQL Server und aus Iceberg.
3. Er vergleicht Tabelle für Tabelle und zeigt jede Abweichung.
4. Go-Live erst bei 100 % Parität auf allen Charts.

**Die Ursachen der Abweichungen:**
- Zahlen und Datumswerte: .NET parst kulturabhängig, Spark nicht.
- Leere Felder: .NET machte einen leeren String, Spark ein null, oder umgekehrt.
- Zeitzone von received_date: Ein Tag kann sich verschieben. Dann landet eine Meldung im falschen Tag.

**Die Statistik selbst:** Ein Job rechnet einen ganzen Tag neu und überschreibt ihn. Ein Retry gibt immer dasselbe Ergebnis.

**Beispiel aus dem Sprint Review:** Montag hat 10 Records. 3 neue kommen. Richtig ist 13. Addiert ein Retry die 3 nochmal, steht 16 da. Neu rechnen gibt immer 13.

## 3min
**Die CumulativeSum-Eigenart:**
Ein Chart hiess „CumulativeSum“. Aber er rechnete eine Tagessumme, keine laufende Summe.
Ich musste entscheiden: richtig rechnen oder gleich rechnen?
Ich habe das alte Verhalten nachgebaut. Sonst wäre die Parität nie 100 % gewesen.
Die Korrektur ist eine eigene, sichtbare Entscheidung für später. Das Fachteam soll sie bewusst treffen.

**Warum ein Test-Harness so wichtig ist:**
- Bei einer Portierung sieht man Unterschiede nicht von Auge. Ein Komma oder eine Zeitzone reicht.
- Ein automatischer Vergleich läuft bei jeder Änderung. So kommt kein alter Fehler zurück.
- Er gibt dem Fachteam einen klaren Beweis. Nicht „wir glauben“, sondern „0 Abweichungen“.

**Trade-offs:**
- Fehler nachbauen fühlt sich falsch an. Aber zuerst das Verhalten migrieren, dann die Bedeutung korrigieren. Zwei Änderungen gleichzeitig kann niemand prüfen.
- Ganzen Tag neu rechnen kostet mehr Rechenzeit als nur addieren. Dafür sind Retries sicher.
- Der Parity-Job vergleicht nur gegen das alte System. Ist das alte System falsch, ist der neue Wert auch falsch. Das muss man offen sagen.

**Was ich heute anders machen würde:** Den Parity-Harness am ersten Tag bauen, nicht erst nach den ersten Abweichungen. *(Prüfen: Wann haben Sie ihn wirklich gebaut?)*

## Follow-ups
- Wie vergleichen Sie Kommazahlen? → *(Prüfen: exakt oder mit Toleranz? Welche Rundung?)* Ich muss die Rundung beider Systeme gleich machen, sonst gibt es falsche Alarme.
- Wie haben Sie die Zeitzonen-Bugs gefunden? → Der Parity-Vergleich zeigt jede Abweichung. Dann habe ich die betroffenen Records einzeln geprüft. *(Ihr echtes Beispiel: Wie haben Sie die Zeitzone als Ursache erkannt?)*
- Warum nicht gleich die CumulativeSum korrigieren? → Dann hätte ich keine 100 % Parität. Und niemand könnte prüfen, ob ein Unterschied ein Bug oder eine Korrektur ist.
- Wie viele Rechner, wie viele Tabellen? → Sieben Rechner in der Gold-Schicht. *(Ihr echtes Beispiel: Anzahl Tabellen und Charts.)*
- Wie lange hat die Portierung gedauert? → *(Ihr echtes Beispiel: Dauer.)*
- Läuft der Parity-Job noch? → *(Prüfen: Läuft er noch bei jedem Release oder nur bis zum Go-Live?)*
- Was ist Medallion? → Bronze ist das rohe XML. Silver sind typisierte, geprüfte Tabellen ohne Duplikate. Gold ist die Statistik pro Tag.

## Don't say
- „Die Zahlen sahen gleich aus.“ Sagen Sie: automatisch verglichen, 100 % Parität.
- Nicht über das alte Team lästern. Die CumulativeSum war eine Eigenart, kein Skandal.

## Words
- **Parität** = gleiche Ergebnisse
- **Eigenart** = quirk
- **kulturabhängig** = depends on language settings (Komma oder Punkt)
- **laufende Summe** = running total
- **nachbauen** = replicate
