---
id: data-batch-vs-streaming
round: data
tech: [lakehouse, spark, kafka]
tier: 1
project: ElCom MATCH
q: Batch oder Streaming – wie entscheiden Sie?
en: Batch or streaming – how do you decide?
---
## 30s
Die wichtigste Frage ist: Wie schnell braucht das Business die Daten?
Sekunden: Streaming. Minuten oder Stunden: Batch reicht meistens.
Batch ist einfacher zu testen, zu wiederholen und idempotent zu machen.
Streaming ist schneller, aber teurer im Betrieb.
Bei MATCH haben wir bewusst Batch gewählt. Die Firmen schicken Dateien zu Fristen. Minuten reichen.
Soll ich die Kriterien genauer erklären?

## 90s
**Meine Fragen:**
1. **Latenz:** Wer schaut wann auf die Daten? Ein Bericht am Morgen braucht kein Streaming.
2. **Wie kommen die Daten?** Als Dateien oder als Events? Dateien passen zu Batch.
3. **Was kostet Verspätung?** Betrugserkennung: jede Sekunde zählt. Monatsstatistik: nicht.
4. **Team:** Kann das Team einen Streaming-Job 24/7 betreiben?

**Bei MATCH:**
- Die Daten kommen als passwortgeschützte ZIPs mit XML.
- Ein .NET-Worker startet einen Spark-Job nur, wenn Meldungen auf Pending stehen.
- Das nennen wir demand-driven Batch. Kein Cluster läuft leer.
- Ergebnis: einfach, idempotent und crash-sicher.

**Der Mittelweg:** Micro-Batch. Spark Structured Streaming verarbeitet zum Beispiel alle 30 Sekunden ein kleines Paket. Oder ein häufiger Batch alle 5 Minuten.

## 3min
**Trade-offs:**
| | Batch | Streaming |
|---|---|---|
| Latenz | Minuten bis Stunden | Sekunden |
| Wiederholen | einfach: Job nochmal starten | schwer: Offsets, State |
| Späte Daten | einfach: Tag neu rechnen | Watermarks nötig |
| Betrieb | Job läuft und endet | läuft immer, braucht Monitoring 24/7 |
| Kosten | Rechenzeit nur bei Bedarf | Cluster läuft immer |

**Wann ich Streaming wähle:** Betrugserkennung, Live-Dashboards, Alarme, Events, die sofort eine Aktion auslösen.

**Fehler bei Streaming:** State wird zu gross. Checkpoints gehen kaputt. Späte Events fallen aus dem Fenster. Man merkt das an wachsendem Consumer Lag oder an fehlenden Zahlen.

**Kappa vs. Lambda:** Lambda hat zwei Wege, Batch und Stream, mit doppelter Logik. Kappa hat nur Stream, Replay aus Kafka. Heute oft: ein Lakehouse-Table, in den Stream und Batch schreiben.

**Mein Rat:** Mit Batch anfangen, wenn die Latenz es erlaubt. Ein guter Batch-Job lässt sich später leichter auf Micro-Batch umstellen als umgekehrt.

**Was ich bei MATCH anders machen würde, falls Latenz wichtig wird:** *(Ihre echte Einschätzung.)*

## Follow-ups
- Haben Sie Streaming produktiv gemacht? → Mit Kafka bei DAZiT für Events zwischen Services, ja. Einen Spark-Streaming-Job habe ich nicht produktiv betrieben.
- Was ist Micro-Batch? → Streaming in kleinen Paketen, zum Beispiel alle paar Sekunden. Spark Structured Streaming arbeitet standardmässig so.
- Was ist exactly-once im Streaming? → Checkpoints plus ein idempotenter oder transaktionaler Sink. Iceberg und Delta können Commits idempotent machen.
- Warum ist Batch einfacher idempotent? → Ein Batch hat klare Grenzen, zum Beispiel ein Tag. Ich kann den Tag löschen und neu schreiben.
- Was, wenn das Business plötzlich Echtzeit will? → Ich frage nach dem echten Bedarf und den Kosten. Oft reicht ein Batch alle 5 Minuten.

## Don't say
- „Streaming ist immer besser, weil es moderner ist.“
- „Batch ist veraltet.“ Die meisten Berichte laufen weiter als Batch.

## Words
- **die Latenz** = Verzögerung
- **die Frist** = deadline
- **der Micro-Batch** = kleines Paket, oft wiederholt
- **das Wasserzeichen (Watermark)** = bis wann späte Events noch zählen
- **demand-driven** = nur starten, wenn Arbeit da ist
