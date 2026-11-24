---
id: tech-spring-batch
round: tech
tech: [spring]
tier: 3
proof: study
project: ElCom MATCH (gleiche Prinzipien, ohne Spring Batch)
q: Kennen Sie Spring Batch? Wie funktioniert ein Chunk-basierter Job?
en: Do you know Spring Batch? How does a chunk-based job work?
---
## 30s
Spring Batch ist ein Framework für grosse Batch-Jobs in Java.
Ein Job hat Steps. Ein Step liest, verarbeitet und schreibt Daten in Chunks.
Pro Chunk gibt es eine Transaktion.
Spring Batch speichert den Fortschritt in einem Job Repository in der Datenbank.
So kann ein Job nach einem Absturz dort weitermachen, wo er aufgehört hat.
Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich von MATCH: Dort habe ich idempotente, absturzsichere Batch-Pipelines mit PySpark gebaut.
Soll ich erklären, wie ein Chunk-Step abläuft?

## 90s
**Die Bausteine:**
- `Job` → besteht aus `Step`s.
- Chunk-Step: `ItemReader` → `ItemProcessor` → `ItemWriter`.
- Tasklet-Step: eine einfache Aufgabe, zum Beispiel eine Datei löschen.
- `JobRepository`: Metadaten-Tabellen (`BATCH_JOB_EXECUTION`, `BATCH_STEP_EXECUTION` …).

**Ablauf eines Chunks (Grösse 100):**
1. Der Reader liest 100 Items, eins nach dem anderen.
2. Der Processor transformiert oder filtert jedes Item.
3. Der Writer schreibt alle 100 zusammen.
4. Commit. Der Fortschritt wird im JobRepository gespeichert.

**Spring Batch 5 (Spring Boot 3):**
```java
@Bean
Step importStep(JobRepository repo, PlatformTransactionManager tx) {
    return new StepBuilder("importStep", repo)
        .<RawRecord, Trade>chunk(100, tx)
        .reader(reader()).processor(processor()).writer(writer())
        .faultTolerant().skip(ParseException.class).skipLimit(10)
        .build();
}
```
Die alten `JobBuilderFactory` und `StepBuilderFactory` gibt es nicht mehr.

## 3min
**Neustart und Idempotenz:** Eine `JobInstance` ist Job + identifizierende JobParameters, zum Beispiel das Datum. Ein fehlgeschlagener Job mit denselben Parametern kann neu starten. Er beginnt beim letzten committeten Chunk. Der Writer muss trotzdem idempotent sein. Ein Chunk kann nach einem Absturz noch einmal geschrieben werden.

**Was ich von MATCH übertragen kann:**
- Dort: Nachrichten atomar claimen (Pending → Processing). Daten pro Nachricht mit DELETE + APPEND in einer Iceberg-Transaktion schreiben. Keine Duplikate bei einem Neustart.
- Stale-Job-Recovery: Nachrichten, die zu lange in Processing hängen, gehen zurück auf Pending.
- Statistiken: ganzen Tag neu berechnen und überschreiben, statt zu addieren. Retries sind dann sicher.
- In Spring Batch würde ich dieselben Ideen nutzen: Job-Parameter pro Tag, idempotenter Writer, Restart über das JobRepository.

**Skalierung:** Multi-threaded Step, Partitioning (zum Beispiel ein Worker pro Tag oder Region), Remote Chunking.

**Wann nicht Spring Batch?** Für sehr grosse Datenmengen mit Analytik ist Spark oft besser. Für Events in Echtzeit ist Kafka besser. Spring Batch passt gut für klassische Java-Batch-Jobs mit Datenbanken und Dateien.

## Follow-ups
- Was passiert, wenn ein Item fehlschlägt? → Mit `faultTolerant()` kann ich Retry und Skip konfigurieren. Übersprungene Items logge ich oder schreibe sie in eine Fehler-Tabelle.
- Was ist der Unterschied zwischen Chunk und Tasklet? → Chunk: lesen, verarbeiten, schreiben in Gruppen. Tasklet: eine einzelne Aufgabe in einer Transaktion.
- Wie starte ich einen Job zweimal mit gleichen Parametern? → Ein erfolgreicher Job mit gleichen Parametern startet nicht erneut. Ich brauche neue Parameter oder einen `RunIdIncrementer`.
- Wie würden Sie Ihren MATCH-Ingest in Spring Batch bauen? → Reader für die Pending-Nachrichten, Processor für Entschlüsseln und Parsen, idempotenter Writer. Ein Job pro Lauf, Neustart über das JobRepository.

## Don't say
- Nicht so tun, als hätten Sie Spring Batch produktiv benutzt.
- „Ein Neustart verhindert Duplikate automatisch.“ Der Writer muss trotzdem idempotent sein.

## Words
- **der Chunk** = Gruppe von Items in einer Transaktion
- **neu starten** = to restart
- **überspringen** = to skip
- **absturzsicher** = crash-safe
- **der Fortschritt** = progress
