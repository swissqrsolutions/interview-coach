---
id: behaviour-legacy
round: behaviour
tech: [jsf, lakehouse]
tier: 2
project: BIT NABODAT, ElCom MATCH
q: Wie gehen Sie mit altem Code (Legacy) um?
en: How do you deal with legacy code?
---
## 30s
Legacy-Code hat einen Wert: Er läuft und er enthält Fachwissen.
Darum ändere ich ihn in kleinen, sicheren Schritten.
Zuerst sichere ich das Verhalten mit Tests. Dann ändere ich.
Bei NABODAT habe ich RichFaces auf PrimeFaces migriert, in Phasen.
Bei MATCH habe ich sogar eine Eigenart vom alten System nachgebaut, damit die Ergebnisse 100 % gleich sind.
Erst das Verhalten migrieren, dann die Bedeutung korrigieren.

## 90s
**Meine Regeln für Legacy:**
1. **Verstehen vor Ändern:** Was macht der Code wirklich? Nicht was die Doku sagt.
2. **Verhalten sichern:** Tests oder ein Vergleich alt gegen neu.
3. **Kleine Schritte:** Jede Phase kann man testen und zurückrollen.
4. **Parallel laufen lassen:** Neues System neben dem alten, mit einem Feature-Switch. So war es bei MATCH.
5. **Eine Änderung pro Schritt:** Migration und Korrektur nie gleichzeitig.

**Die CumulativeSum-Eigenart:**
Ein Chart hiess „CumulativeSum“. Er rechnete aber eine Tagessumme, keine laufende Summe. Ich habe das alte Verhalten nachgebaut. Die Korrektur ist eine eigene, sichtbare Entscheidung.

## 3min
**STAR-L (MATCH):**
- **Situation:** Die Statistik von MATCH lief in .NET auf SQL Server. Bei 250 Millionen Zeilen skalierte das nicht mehr.
- **Aufgabe:** Sieben Rechner nach PySpark portieren. 100 % Parität war die Bedingung für den Go-Live.
- **Aktion:** Ich habe einen Parity-Job gebaut. Er vergleicht SQL Server und Iceberg Tabelle für Tabelle. Ich habe fünf Extractor-Bugs gefunden. Bei der CumulativeSum habe ich die Eigenart bewusst nachgebaut und sichtbar dokumentiert.
- **Resultat:** 100 % Parität, Go-Live parallel zum alten System mit Feature-Switch.
- **Lektion:** Zuerst das Verhalten migrieren, dann die Bedeutung korrigieren, als eigene, sichtbare Entscheidung.

**Zweite Geschichte (NABODAT), kurz:**
RichFaces auf PrimeFaces, Phase für Phase. Eigene Converter und PrimeFaces Extensions, wo es kein direktes Gegenstück gab. Lazy-Loading-Tabellen für bessere Performance. *(Ihr echtes Beispiel: Zahl, z. B. Seiten oder Ladezeit.)*

**Senior-Sicht:**
- Ein Neubau ist verlockend, aber teuer und riskant. Oft ist Schritt-für-Schritt besser (Strangler Pattern).
- Legacy-Code nicht schlecht reden. Er hat Jahre lang Geld verdient.

## Follow-ups
- Wann ist ein kompletter Neubau richtig? → Wenn die Technik keine Updates mehr bekommt und die Fachlogik klein oder gut verstanden ist.
- Was ist das Strangler Pattern? → Neue Teile wachsen neben dem alten System. Stück für Stück übernimmt das Neue. Am Ende schaltet man das Alte ab.
- Wie testen Sie Code ohne Tests? → Zuerst Characterization Tests: Sie halten das aktuelle Verhalten fest, auch wenn es seltsam ist.
- Haben Sie die CumulativeSum später korrigiert? → *(Prüfen: aktueller Stand.)*

## Don't say
- „Der alte Code war Müll.“
- „Ich habe alles neu geschrieben.“ ohne Plan und Tests.

## Words
- **Eigenart** = quirk
- **zurückrollen** = roll back
- **verlockend** = tempting
- **Characterization Test** = Test, der das aktuelle Verhalten festhält
