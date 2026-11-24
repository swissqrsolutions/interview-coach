---
id: design-image-search
round: design
tech: [search, postgres, azure, microservices]
tier: 1
proof: study
project: DigiSanté (upload + scan pipeline)
q: Entwerfen Sie ein System für Bild-Upload, Bilderkennung und Suche.
en: Design a system for image upload, image recognition and search.
---
## 30s
Zuerst frage ich: Wie viele Bilder? Wer sucht? Wie schnell muss es sein?
Dann mein Plan in fünf Schritten.
1. Der Upload geht direkt in einen Object Storage, zum Beispiel Azure Blob.
2. Ein Event startet die Prüfung: Virenscan und Dateityp.
3. Ein Worker macht die Bilderkennung und speichert Tags.
4. Die Tags kommen in die Datenbank und in einen Suchindex.
5. Die Suche fragt den Index. Die Datenbank bleibt die Wahrheit.
Einen ähnlichen Upload habe ich bei DigiSanté gebaut: Blob, Defender-Scan, Event Hub.
Soll ich die Datenbank oder die Suche genauer erklären?

## 90s
**Der Ablauf:**
1. Der Client holt eine kurze Upload-URL (SAS-Token). So geht die Datei nicht durch unseren Server.
2. Die Datei liegt zuerst in einer Quarantäne. Ein Scan prüft sie.
3. Ein Event (Event Grid) meldet: neue Datei, sauber.
4. Ein Worker ruft den Erkennungs-Service auf (z. B. Azure AI Vision). Er bekommt Tags mit einer Sicherheit, zum Beispiel "Hund 0.94".
5. Der Worker schreibt die Tags in PostgreSQL. Dann schickt er sie an den Suchindex.
6. Der Status wechselt von PENDING zu READY. Erst dann sieht der Nutzer das Bild in der Suche.

**Die Tabellen:**
```
images(id, tenant_id, object_key, status, created_at)
image_tags(image_id, tag, confidence)   -- unique (image_id, tag)
```

**Die Suche mit SQL** (reicht für den Anfang):
```
SELECT i.id, i.object_key
FROM images i
JOIN image_tags t ON t.image_id = i.id
WHERE i.tenant_id = :tenant
  AND i.status = 'READY'
  AND t.tag = :tag
ORDER BY i.created_at DESC
LIMIT 20;
```
Dafür brauche ich einen Index auf `image_tags(tag, image_id)` und auf `images(tenant_id, status, created_at)`.

Laut gesagt: „Ich filtere nach Mandant, Status und Tag. Ich sortiere nach Datum. Ich gebe 20 Treffer zurück.“

## 3min
**Wie funktioniert die Suche wirklich?**
- **Inverted Index** (Elasticsearch, OpenSearch): Für jedes Wort gibt es eine Liste mit Dokumenten. "hund" → Bild 7, Bild 12, Bild 40. Darum ist die Suche schnell, auch bei Millionen Bildern. Der Index kann auch Tippfehler und Synonyme.
- **Vektorsuche** für "ähnliche Bilder": Das Modell macht aus jedem Bild einen Vektor (Embedding). Ähnliche Bilder haben nahe Vektoren. In PostgreSQL geht das mit `pgvector`, sonst mit OpenSearch oder Azure AI Search.

**Trade-offs:**
- Nur PostgreSQL ist einfach und billig. Bei vielen Millionen Tags und Freitext wird es langsam. Dann kommt ein Suchindex dazu.
- Ein Suchindex ist schnell, aber er ist eine Kopie. Er kann kurz veraltet sein. Die Datenbank bleibt die Quelle der Wahrheit.

**Was kann schiefgehen?**
- Die Erkennung klappt, aber der Index-Update fällt aus. → Retry mit einer Outbox-Tabelle und einer Dead-Letter-Queue.
- Ein Event kommt doppelt. → Der Worker ist idempotent: `INSERT ... ON CONFLICT DO NOTHING`.
- Der Nutzer löscht das Bild während der Verarbeitung. → Der Worker prüft den Status vor dem Schreiben.

**Sicherheit:** Jede Abfrage filtert nach `tenant_id`. Der Storage ist privat. Private Endpoints, Managed Identity, keine Schlüssel im Code. So war es bei DigiSanté.

**Kosten:** Die Erkennung kostet pro Bild. Darum nur einmal erkennen und das Ergebnis speichern.

## Follow-ups
- Wie suchen Sie nach "Hund am Strand"? → Zwei Tags mit `GROUP BY image_id HAVING COUNT(*) = 2`, oder ein Suchindex mit einer AND-Abfrage.
- Warum nicht nur Elasticsearch? → Er ist keine gute Quelle der Wahrheit: keine echten Transaktionen. Ich halte die Daten in PostgreSQL und den Index als Kopie.
- Wie skalieren Sie bei 10 Millionen Uploads am Tag? → Upload direkt in den Storage, Worker über die Queue horizontal skalieren, Index in Shards.
- Was sieht der Nutzer, solange das Bild verarbeitet wird? → Den Status "in Bearbeitung". Erst bei READY erscheint es in der Suche.
- Wie finden Sie ähnliche Bilder? → Embedding pro Bild, dann eine Vektorsuche (k nächste Nachbarn), z. B. mit pgvector.

## Don't say
- „Ich würde einfach eine Datenbank nehmen.“ Ohne Tabellen, Index und Abfrage wirkt das junior.
- Nicht sofort Kafka, Kubernetes und zehn Services zeichnen. Erst die Fragen stellen, dann einfach anfangen.

## Words
- **Inverted Index** = Wort → Liste von Dokumenten
- **Embedding** = ein Bild als Zahlenvektor
- **Quelle der Wahrheit** = source of truth
- **Mandant** = tenant (customer)
- **idempotent** = zweimal ausführen gibt dasselbe Ergebnis
