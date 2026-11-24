---
id: behaviour-ai
round: behaviour
tech: [ai]
tier: 1
project: ElCom MATCH
q: Wie nutzen Sie KI bei der Entwicklung?
en: How do you use AI in software development?
---
## 30s
Ich nutze KI wie einen schnellen Junior-Entwickler.
Die KI schreibt Entwürfe. Das Design, die Tests und das Review mache ich.
Ich übernehme keinen Code ohne Prüfung.
Bei MATCH galt: Der neue PySpark-Code musste 100 % gleiche Ergebnisse liefern wie das alte System.
Das hat ein automatischer Test geprüft, nicht die KI.

## 90s
**Meine fünf Regeln:**
1. **Ich entscheide das Design.** Die KI arbeitet in meiner Struktur.
2. **Tests zuerst oder immer.** Ohne Test geht nichts in den Main-Branch.
3. **Ich prüfe jede Zeile** wie einen Merge Request von einem Kollegen. Kleine Änderungen, SonarQube ohne neue Fehler.
4. **Ich prüfe gegen die Doku**, nicht gegen die Sicherheit der KI. Typische KI-Fehler sind falsche APIs und erfundene Optionen.
5. **Keine Geheimnisse und keine Kundendaten im Prompt.** Das ist im Bundesumfeld wichtig, wegen dem Datenschutz.

## 3min
**STAR-Geschichte:**
- **Situation:** Bei MATCH mussten sieben Statistik-Rechner von .NET nach PySpark.
- **Aufgabe:** Gleiche Ergebnisse, sonst kein Go-Live.
- **Aktion:** Ich habe die KI für den ersten Entwurf genutzt. Dann habe ich einen Vergleichstest gebaut: gleiche Eingabe, beide Systeme, Ergebnis Zeile für Zeile. Der Test hat Unterschiede gefunden. Ich habe jeden Unterschied selbst analysiert und korrigiert. *(Hier Ihr echtes Beispiel einsetzen: welcher Unterschied, welche Ursache.)*
- **Resultat:** 100 % Parität, dann Go-Live.
- **Lektion:** KI macht mich schneller. Aber die Verantwortung bleibt bei mir. Ein guter Test ist wichtiger als ein guter Prompt.

## Follow-ups
- Können Sie auch ohne KI programmieren? → Ja. Ich zeige es gern live.
- Welche Risiken sehen Sie? → Falscher Code, der richtig aussieht. Sicherheitslücken. Datenschutz bei Prompts.
- Wie sollte ein Team KI einführen? → Klare Regeln, Review-Pflicht, keine Kundendaten, und Tests als Qualitäts-Gate.

## Don't say
- Nicht verstecken, dass Sie KI nutzen. Zeigen Sie Kontrolle.
- Nicht „Die KI schreibt alles für mich.“

## Words
- **Entwurf** = draft
- **Verantwortung** = responsibility
- **Qualitäts-Gate** = quality gate
