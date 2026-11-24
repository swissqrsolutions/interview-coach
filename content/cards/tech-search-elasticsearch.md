---
id: tech-search-elasticsearch
round: tech
tech: [search]
tier: 2
proof: study
project: Kafka (DAZiT), PostgreSQL-Indexe als Vergleich
q: Wie funktioniert Elasticsearch? Was sind Inverted Index, Shards und Analyzer?
en: How does Elasticsearch work? What are inverted index, shards and analyzers?
---
## 30s
Elasticsearch ist eine verteilte Suchmaschine auf Basis von Lucene.
Der Kern ist ein Inverted Index: Für jedes Wort steht, in welchen Dokumenten es vorkommt.
Darum ist Volltextsuche sehr schnell.
Ein Index ist in Shards geteilt. So verteilt sich die Last auf mehrere Knoten.
Ein Analyzer zerlegt den Text in Wörter, bevor er in den Index geht.
Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich von Kafka bei DAZiT: Partitionen und Replikas verteilen die Last ähnlich wie Shards.

## 90s
**Inverted Index:**
| Term | Dokumente |
|---|---|
| boden | 1, 4, 7 |
| probe | 1, 2 |
Die Suche nach „Bodenprobe“ schaut nur in diese Listen. Sie liest nicht alle Dokumente.

**Analyzer:** drei Schritte.
1. Character Filter: zum Beispiel HTML entfernen.
2. Tokenizer: Text in Wörter teilen.
3. Token Filter: kleinschreiben, Stoppwörter, Stemming („Proben“ → „probe“).
Wichtig: Beim Suchen läuft der gleiche Analyzer. Sonst finden sich die Wörter nicht.

**Mapping:** `text` wird analysiert, für Volltext. `keyword` bleibt exakt, für Filter, Sortierung und Aggregationen.

**Shards:** Primary Shards teilen die Daten. Replica Shards sind Kopien für Ausfall und mehr Lese-Leistung.

## 3min
**Ranking:** Standard ist BM25. Seltene Wörter zählen mehr. Treffer in kurzen Feldern zählen mehr.

**Near real-time:** Ein neues Dokument ist erst nach dem Refresh sichtbar, Standard etwa 1 Sekunde.

**Trade-offs:**
- Die Zahl der Primary Shards kann man nicht einfach ändern. Nur mit Reindex, Split oder Shrink. Zu viele kleine Shards kosten Speicher auf dem Cluster.
- Elasticsearch ist nicht die Quelle der Wahrheit. Die Daten liegen in der Datenbank. Der Index wird daraus gebaut und kann neu gebaut werden.
- Synchronisierung DB → Index: zum Beispiel mit Events über Kafka oder mit dem Outbox Pattern. Hier hilft meine Kafka-Erfahrung von DAZiT.

**Wann nicht:** Für einfache Suche in kleinen Daten reicht PostgreSQL mit Full-Text-Search (`tsvector`) oder `pg_trgm`.

**Vektor-Suche:** Elasticsearch und OpenSearch können auch Embeddings speichern und ähnliche Vektoren finden (kNN). Oft kombiniert mit BM25 als Hybrid-Suche.

## Follow-ups
- Was ist der Unterschied zwischen match und term Query? → `match` analysiert den Suchtext. `term` sucht exakt, gut für `keyword`-Felder.
- Was passiert, wenn ein Knoten ausfällt? → Ein Replica wird zum Primary. Der Cluster wird gelb, bis neue Replikas da sind.
- Wie viele Shards? → Abhängig von der Datenmenge. Eine Faustregel ist ein paar zehn GB pro Shard.
- Elasticsearch oder OpenSearch? → OpenSearch ist ein Fork von Elasticsearch, getrieben von AWS. Die APIs sind sehr ähnlich.
- Wie bringen Sie Daten in den Index? → Bulk API, aus Events oder aus einem Batch-Job. Mit Alias kann man einen neuen Index bauen und dann umschalten.

## Don't say
- „Elasticsearch ist meine Hauptdatenbank.“ Es ist ein Such-Index, nicht die Quelle der Wahrheit.
- „Ich habe Elasticsearch produktiv betrieben.“ Nicht wahr. Ehrlich bleiben.

## Words
- **der Inverted Index** = Wort → Liste von Dokumenten
- **der Shard** = Teil eines Index
- **die Replica** = Kopie
- **zerlegen** = in Teile teilen
- **die Volltextsuche** = full-text search
