---
id: project-match-ingestion
round: project
tech: [spark, iceberg, mssql, dotnet, lakehouse]
tier: 1
project: ElCom MATCH
q: Wie funktioniert die Datenaufnahme bei MATCH? Was passiert, wenn ein Job abstürzt?
en: How does ingestion work in MATCH? What happens when a job crashes?
---
## 30s
Die Firmen schicken ZIP-Dateien mit XML. Die ZIPs haben ein Passwort.
Ein .NET-Worker startet einen Spark-Job nur, wenn wirklich Arbeit da ist.
Spark übernimmt die Meldungen atomar mit SQL. So nehmen zwei Jobs nie dieselbe Meldung.
Hängt ein Job zu lange, setzen wir die Meldung zurück auf Pending.
Das Schreiben in Iceberg ist idempotent. Ein Neustart macht keine Duplikate.
Soll ich den Ablauf Schritt für Schritt zeigen?

## 90s
**Der Ablauf:**
1. Das ZIP landet in MinIO. In MSSQL entsteht eine Zeile mit `LakehouseStatus = Pending`.
2. Ein .NET BackgroundWorker fragt regelmässig: Gibt es Pending-Meldungen? Nur dann startet er einen Spark-Job über die Spark REST API.
3. Spark übernimmt die Meldungen atomar: Pending → Processing.
4. Spark lädt das ZIP, entschlüsselt es und parst das XML.
5. Spark schreibt in Iceberg: zuerst `DELETE WHERE message_id = X`, dann `APPEND`. Beides in einer Iceberg-Transaktion.
6. Am Ende: Status Completed oder Failed.

**Der atomare Claim (vereinfacht):**
```
UPDATE messages
SET LakehouseStatus = 'Processing'
OUTPUT INSERTED.*
WHERE LakehouseStatus = 'Pending';
```
Laut gesagt: „Ein Statement ändert den Status und gibt die Zeilen zurück. Ein zweiter Job sieht diese Zeilen nicht mehr als Pending.“

**Stale-Job-Recovery:** Bleibt eine Meldung länger als ein Timeout in Processing, setzen wir sie auf Pending zurück.

## 3min
**Warum so und nicht anders?**
- **Bedarfsgesteuert statt Timer:** Früher lief ein .NET-Timer-Job mit einem Bookmark-Datum. Jetzt startet Spark nur bei Arbeit. Das spart Ressourcen. Karpenter muss keine Nodes ohne Grund starten.
- **Batch statt Streaming:** Die Daten kommen als Dateien zu Fristen. Minuten reichen. Batch ist viel einfacher idempotent und absturzsicher zu machen.
- **Löschen + Anhängen statt Merge:** Pro message_id lösche ich alte Zeilen und schreibe neu. Mit Merge-on-Read schreibt Iceberg nur Delete-Dateien. Das ist schnell beim Schreiben.

**Drei Absturz-Fälle:**
1. Absturz vor dem Iceberg-Commit: Nichts ist sichtbar. Die Meldung bleibt in Processing. Nach dem Timeout wird sie wieder Pending.
2. Absturz nach dem Commit, vor dem Status-Update: Der nächste Lauf schreibt die Meldung nochmal. Das DELETE entfernt die alten Zeilen. Keine Duplikate.
3. Zwei Läufe gleichzeitig: Der atomare Claim verhindert, dass beide dieselbe Meldung nehmen.

**Trade-offs und Grenzen:**
- Der Timeout muss länger sein als der längste normale Job. Sonst nimmt ein zweiter Job eine Meldung, die noch läuft.
- Merge-on-Read macht das Lesen langsamer. Darum: regelmässige Compaction mit `rewrite_data_files` und `expire_snapshots`.
- Viele kleine Meldungen machen kleine Dateien. Darum übernehmen wir Meldungen im Batch.

**Wie wir Probleme merken:** Grafana zeigt den Rückstau an Pending-Meldungen und die Job-Dauer. Wächst der Rückstau, stimmt etwas nicht.

## Follow-ups
- Warum fragt der Worker die Datenbank ab, statt eine Queue zu nutzen? → Die Meldungen sind schon in MSSQL. Die Tabelle ist unsere Queue. Für die Menge reicht das und es gibt kein neues System. *(Prüfen: war eine Queue ein Thema?)*
- Wie verhindern Sie, dass zwei Worker gleichzeitig Spark starten? → Auch wenn zwei Jobs starten, nimmt jeder nur Zeilen, die noch Pending sind. Der Claim ist atomar.
- Was passiert mit einem kaputten ZIP? → Die Meldung bekommt Failed. Sie blockiert die anderen nicht. *(Prüfen: gibt es Retry oder Alarm bei Failed?)*
- Wie gross ist ein Batch? → *(Ihr echtes Beispiel: Anzahl Meldungen pro Claim.)*
- Warum kein MERGE INTO? → DELETE plus APPEND pro message_id ist einfacher und klar idempotent. Eine Meldung wird immer ganz ersetzt.
- Wie partitionieren Sie? → days(received_date) und schema_type, mit Hidden Partitioning. Die Abfragen filtern fast immer nach Datum und Typ.
- Wann startet die Statistik? → Jede Meldung hat zwei Status: Ingestion und Statistik. Die Statistik startet erst, wenn die Ingestion Completed ist.

## Don't say
- „Exactly-once gibt es bei uns automatisch.“ Wir erreichen das Ergebnis durch atomaren Claim plus idempotentes Schreiben.
- Nicht „Spark-Streaming wäre besser“ sagen, ohne die Fristen und Dateien zu erwähnen.

## Words
- **bedarfsgesteuert** = demand-driven, nur bei Arbeit
- **übernehmen (claim)** = eine Aufgabe für sich reservieren
- **absturzsicher** = crash-safe
- **Rückstau** = backlog
- **Zeitüberschreitung (Timeout)** = Zeit ist abgelaufen
