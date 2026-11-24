---
id: assessment-customer-vs-tech
round: assessment
tech: [lakehouse, spark, federal]
tier: 1
project: ElCom MATCH (replace-the-result)
q: Erklären Sie eine Entscheidung aus Ihrem Projekt einmal für den Kunden und einmal technisch.
en: Explain one decision from your project once for the customer and once technically.
---
## 30s
**Für den Kunden (Business-Sprache):**
Bei MATCH rechnen wir die Statistik für einen Tag immer ganz neu.
Wir zählen nicht nur dazu.
Ein Beispiel: Am Montag gibt es 10 Meldungen. Dann kommen 3 dazu.
Richtig sind 13. Wenn ein Job zweimal läuft und wieder 3 dazuzählt, stehen 16 da.
Wenn wir neu rechnen, steht jedes Mal 13 da.
Darum sind die Zahlen immer korrekt, auch nach einem Fehler.

## 90s
**Für den Engineer (technisch):**
- Das Muster heisst replace-the-result. Der Gold-Job rechnet die Statistik pro Tag neu und überschreibt sie.
- Kein Inkrement, darum ist der Job idempotent. Retries sind sicher.
- Jede Nachricht hat zwei Pending-Status: Ingestion und Statistik. Die Statistik startet erst, wenn die Ingestion Completed ist.
- Das Schreiben in Iceberg ist merge-on-read: `DELETE WHERE message_id = X` und dann `APPEND`, in einer Iceberg-Transaktion.
- Die Tabellen sind nach `days(received_date)` und `schema_type` partitioniert. Darum liest die Neuberechnung nur die Partition für einen Tag.
- Vorher: ein .NET-Timer-Job mit einem „Bookmark“-Datum.

## 3min
**Die Struktur im Assessment (ZK16: richtige Sprache für das Publikum):**
1. **Business zuerst:** Was ist das Problem? Was ist der Nutzen? Ein Zahlenbeispiel, keine Fachwörter.
2. **Verständnis prüfen:** „Ist das so verständlich?“
3. **Dann technisch:** Muster, Mechanik, Trade-off.
4. **Zwei Fragen zurück:** „Soll ich die Partitionierung genauer erklären?“

**Der Trade-off (für den Engineer):**
- Neu rechnen kostet mehr Rechenzeit als nur dazuzählen.
- Aber: Dank Partition Pruning liest Spark nur einen Tag. Das ist günstig.
- Dafür: keine Doppelzählung, einfache Retries, einfache Korrekturen.

**Wann ich es nicht so machen würde:**
Bei sehr grossen Zeiträumen pro Neuberechnung, oder bei Echtzeit-Zahlen. Dann sind Inkremente mit eindeutigen Event-IDs besser.

**Woran man Fehler merkt:** Grafana zeigt den Rückstau an Pending-Nachrichten und die Job-Dauer.

**Das gleiche Beispiel habe ich im Sprint Review gezeigt:** 10 + 3 = 13, nicht 16.

## Follow-ups
- Was heisst idempotent, einfach gesagt? → Zweimal ausführen gibt dasselbe Ergebnis wie einmal.
- Warum nicht einfach den Fehler verhindern? → Fehler passieren immer: Pod-Neustart, Netzwerk. Das System muss sie aushalten.
- Kostet das nicht zu viel Rechenzeit? → Nur ein Tag wird neu gerechnet, dank Partitionierung nach Tag.
- Wie erklären Sie Partition Pruning dem Kunden? → „Die Daten liegen in Schubladen pro Tag. Wir öffnen nur die Schublade, die wir brauchen.“
- Was passiert mit einem Job, der hängen bleibt? → Nach einem Timeout geht die Nachricht von Processing zurück auf Pending.

## Don't say
- Dem Kunden „merge-on-read“ oder „idempotent“ ohne Erklärung sagen.
- Dem Engineer nur das Zahlenbeispiel geben, ohne Mechanik.

## Words
- **neu rechnen** = recompute
- **überschreiben** = to overwrite
- **die Doppelzählung** = double counting
- **der Rückstau** = backlog
- **die Schublade** = drawer (simple picture for a partition)
