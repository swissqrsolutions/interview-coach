---
id: behaviour-initiative
round: behaviour
tech: [spark, dotnet, mssql]
tier: 1
project: ElCom MATCH
q: Erzählen Sie von einer Situation, in der Sie Eigeninitiative gezeigt haben.
en: Tell me about a time you showed initiative.
---
## 30s
Bei MATCH lief die alte Verarbeitung als .NET-Timer-Job mit einem Bookmark-Datum.
Für das Lakehouse habe ich eine bedarfsgesteuerte Ingestion entworfen.
Ein Worker startet einen Spark-Job nur, wenn wirklich Arbeit da ist.
Die Meldungen werden atomar übernommen. Hängende Jobs werden automatisch zurückgesetzt.
So gibt es keine Duplikate bei einem Neustart.
*(Prüfen: Sagen Sie klar, dass die Idee von Ihnen kam, nur wenn es stimmt.)*

## 90s
**Was vorher war:** Ein Timer-Job lief regelmässig. Er merkte sich mit einem Bookmark-Datum, wo er stand.

**Was ich gebaut habe:**
1. Jede Meldung hat einen Status in MSSQL: Pending, Processing, Completed oder Failed.
2. Ein .NET BackgroundWorker prüft: Gibt es Pending? Nur dann startet er Spark über die REST API.
3. Spark übernimmt Meldungen atomar mit `UPDATE ... OUTPUT INSERTED.*`.
4. Iceberg-Schreiben ist idempotent: DELETE für die message_id und APPEND in einer Transaktion.
5. Stale-Job-Recovery: Meldungen, die zu lange in Processing hängen, gehen zurück auf Pending.
6. Zwei getrennte Pending-Status: Ingestion und Statistik. Die Statistik startet erst nach Completed.

## 3min
**STAR-L:**
- **Situation:** Bei MATCH sollte ein Lakehouse neben dem alten .NET-System laufen. Der alte Ablauf war ein Timer-Job mit einem Bookmark-Datum.
- **Aufgabe:** Spark-Jobs zuverlässig starten, ohne Duplikate, auch bei Abstürzen. *(Prüfen: War das Ihre Aufgabe, oder haben Sie das Problem selbst gesehen?)*
- **Aktion:** Ich habe einen Status pro Meldung eingeführt statt eines einzigen Bookmarks. Ich habe den atomaren Claim mit SQL gebaut. Ich habe die Stale-Job-Recovery und das idempotente Schreiben in Iceberg gebaut. Ich habe die Statistik auf „ganzen Tag neu rechnen“ umgestellt.
- **Resultat:** Keine Duplikate bei Neustarts. Spark läuft nur bei Arbeit. In Produktion mit über 250 Millionen Zeilen.
- **Lektion:** Ein Status pro Arbeitseinheit ist robuster als ein globales Bookmark. Ein Fehler betrifft dann nur eine Meldung.

**Warum das Initiative zeigt:**
Ich habe nicht einfach den alten Timer kopiert. Ich habe gefragt: Was passiert bei einem Absturz? Bei einem doppelten Lauf? Und dann ein Design gebaut, das diese Fälle löst.

**Im Sprint Review erklärt:** Montag hat 10 Records, 3 neue kommen. Richtig ist 13. Ein Retry, der addiert, gibt 16. Neu rechnen gibt immer 13. So hat das Fachteam die Idee sofort verstanden.

## Follow-ups
- Was war das Problem mit dem Bookmark? → Ein einziges Datum für alles. Wenn eine Meldung fehlschlägt, ist unklar, was schon verarbeitet ist. *(Prüfen: Gab es konkrete Vorfälle?)*
- Wie haben Sie das Team überzeugt? → Mit dem Beispiel 10 + 3 = 13 im Sprint Review. *(Ihr echtes Beispiel: weitere Argumente.)*
- Wie lange hat es gedauert? → *(Ihr echtes Beispiel.)*
- Gab es noch andere Initiativen? → Bei CARIAD habe ich Scrum eingeführt und den Release-Prozess automatisiert. Im Zeugnis steht Eigeninitiative.

## Don't say
- „Ich habe einfach gemacht, ohne zu fragen.“ Initiative heisst auch: das Team mitnehmen.
- Nicht nur die Technik erklären. Sagen Sie, welches Risiko Sie gesehen haben.

## Words
- **Eigeninitiative** = initiative
- **bedarfsgesteuert** = demand-driven
- **Arbeitseinheit** = unit of work
- **überzeugen** = convince
- **mitnehmen** = bring (people) along
