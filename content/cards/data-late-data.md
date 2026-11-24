---
id: data-late-data
round: data
tech: [lakehouse, spark]
tier: 2
project: ElCom MATCH
q: Wie gehen Sie mit verspäteten Daten um?
en: How do you handle late-arriving data?
---
## 30s
Verspätete Daten gehören zu einem alten Zeitraum, kommen aber erst später an.
Zuerst trenne ich zwei Zeiten: Wann ist es passiert? Und wann ist es angekommen?
Im Batch rechne ich den betroffenen Zeitraum einfach neu.
Im Streaming nutze ich ein Watermark: Bis zu dieser Verspätung zählt das Event noch.
Bei MATCH rechnet der Statistik-Job immer einen ganzen Tag neu und überschreibt ihn. Kommt eine Meldung später, wird der Tag neu gerechnet.
Soll ich den Streaming-Fall genauer zeigen?

## 90s
**Zwei Zeiten:**
- **Event Time:** Wann ist der Handel passiert?
- **Processing / Arrival Time:** Wann ist die Meldung bei uns?

**Batch-Lösung (wie bei MATCH):**
1. Neue Meldungen kommen an.
2. Ich finde die betroffenen Tage.
3. Ich rechne nur diese Tage neu und ersetze sie.
```
SELECT DISTINCT trade_date
FROM silver.trades
WHERE message_id IN (:neue_meldungen);
-- danach: jeden dieser Tage komplett neu rechnen und überschreiben
```
Laut gesagt: „Ich suche alle Tage, die von neuen Meldungen betroffen sind. Nur diese rechne ich neu.“ *(Prüfen: Bei MATCH partitionieren wir nach received_date. Nach welchem Datum rechnet die Statistik genau?)*

**Streaming-Lösung (Spark Structured Streaming):**
```
events.withWatermark("event_time", "2 hours") \
      .groupBy(window("event_time", "1 hour"), "product") \
      .count()
```
„Events bis 2 Stunden zu spät zählen noch. Danach schliesst Spark das Fenster und vergisst den State.“

## 3min
**Trade-offs beim Watermark:**
- Kurz: wenig State, schnelle Ergebnisse, aber mehr verlorene späte Events.
- Lang: genauer, aber mehr Speicher und spätere Ergebnisse.
- Was nach dem Watermark kommt, wird verworfen. Ich zähle diese Events in einer Metrik.

**Was mache ich mit sehr späten Daten?**
- In eine eigene Tabelle schreiben.
- Ein Batch-Job korrigiert später den Zeitraum. So arbeiten Stream und Batch zusammen.

**Für Berichte wichtig:** Wann ist eine Zahl „final“? Mit dem Business klären: zum Beispiel „Tageswerte sind nach 3 Tagen final“. Vorher steht im Bericht „vorläufig“.

**Zeitzonen:** Ein klassischer Fehler. Bei MATCH war die Zeitzone von `received_date` eine der Ursachen für Unterschiede in der Parität. Darum: intern immer UTC speichern, erst in der Anzeige umrechnen.

**Wie merke ich das Problem?** Eine Metrik „Anteil später Events pro Tag“. Und ein Vergleich: Zahl am Tag 1 gegen Zahl am Tag 7.

## Follow-ups
- Was ist der Unterschied zwischen Event Time und Processing Time? → Event Time ist, wann es passiert ist. Processing Time ist, wann wir es verarbeiten. Berichte sollten nach Event Time rechnen.
- Was passiert in Spark mit Events nach dem Watermark? → Bei Aggregationen werden sie ignoriert. Der State für alte Fenster wird gelöscht.
- Warum nicht einfach den Wert addieren, wenn ein spätes Event kommt? → Bei einem Retry zählt es doppelt. Neu rechnen ist idempotent.
- Wie teuer ist das Neu-Rechnen? → Nur die betroffenen Partitionen. Mit Partitionierung nach Tag liest Spark nur diese Tage.
- Wie informieren Sie die Nutzer? → Ein Status pro Zeitraum: vorläufig oder final. Und ein Zeitstempel der letzten Aktualisierung.

## Don't say
- „Späte Daten ignorieren wir.“ Ohne Absprache mit dem Business ist das falsch.
- Nicht Event Time und Processing Time verwechseln.

## Words
- **verspätet** = late
- **betroffen** = affected
- **vorläufig / final** = preliminary / final
- **das Fenster** = time window
- **verwerfen** = to drop
