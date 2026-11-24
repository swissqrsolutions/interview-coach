---
id: design-search-autocomplete
round: design
tech: [search]
tier: 2
proof: study
q: Entwerfen Sie eine Autovervollständigung für ein Suchfeld.
en: Design search autocomplete (typeahead).
---
## 30s
Zuerst frage ich: Was wird vorgeschlagen? Produkte, Orte oder frühere Suchen? Wie schnell muss es sein?
Ich nehme an: 10 Millionen Nutzer, 20 000 Anfragen pro Sekunde in der Spitze, Antwort unter 100 ms.
Mein Plan: Ich berechne die besten Vorschläge pro Präfix im Voraus.
Die Abfrage ist dann nur noch ein Lookup, aus Cache oder Suchindex.
Ein Batch-Job baut die Vorschläge aus den Suchlogs neu, zum Beispiel jede Stunde.
Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich von Index-Design in PostgreSQL und von Batch-Jobs bei MATCH.
Soll ich zeigen, wie der Index funktioniert?

## 90s
**Zahlen:** Jeder Tastendruck ist eine Anfrage. Mit Debounce (200 ms warten) etwa 3 Anfragen pro Suche. 5 Millionen Suchen pro Tag = 15 Millionen Anfragen, Spitze etwa 20 000 pro Sekunde. 1 Million verschiedene Begriffe = wenige hundert MB. Das passt in den Speicher.

**API:**
```
GET /api/suggest?q=ber&lang=de&limit=10
→ ["Bern", "Bern Bahnhof", "Berner Oberland", ...]
```

**Tabellen:**
```
search_log(ts, user_id, lang, query)                -- roh, gross
terms(lang, term, popularity)                  -- PK (lang, term), vom Batch-Job berechnet
```

**SQL laut gesagt — einfache Version in PostgreSQL:**
```
SELECT term FROM terms
WHERE lang = :lang AND term LIKE :prefix || '%'
ORDER BY popularity DESC
LIMIT 10;
-- Index: terms(lang, term text_pattern_ops)
```
„Ich suche alle Begriffe, die mit dem Präfix beginnen. Der Index mit `text_pattern_ops` unterstützt LIKE mit Präfix.“

**Batch-Job, laut gesagt:**
```
INSERT INTO terms(lang, term, popularity)
SELECT :lang, lower(query), count(*)
FROM search_log
WHERE lang = :lang AND ts >= now() - interval '30 days'
GROUP BY lower(query)
ON CONFLICT (lang, term) DO UPDATE SET popularity = EXCLUDED.popularity;
```
„Ich zähle die Suchen der letzten 30 Tage. Ich ersetze den Wert, ich addiere nicht. So ist ein Retry sicher.“

## 3min
**Drei Wege für den Index:**
- **Trie:** Baum aus Buchstaben. In jedem Knoten speichere ich die Top 10. Die Abfrage ist ein Weg im Baum, sehr schnell. Gut im Speicher eines Services.
- **Edge N-Grams im Suchindex** (Elasticsearch, OpenSearch): „bern“ wird zu b, be, ber, bern indexiert. Dazu Tippfehler-Toleranz (fuzzy).
- **Completion Suggester** in Elasticsearch: eine spezielle In-Memory-Struktur, sehr schnell, aber weniger flexibel.

**Cache:** Die häufigsten Präfixe (1–3 Buchstaben) sind immer gleich. Sie kommen aus Redis oder einem CDN-Cache. Der Client cacht auch.

**Ranking:** Popularität, plus Aktualität, plus Personalisierung. Personalisierung macht den Cache schwerer. Darum: globale Liste aus dem Cache, persönliche Treffer separat mischen.

**Skalierung:** Die Daten sind klein. Ich kopiere sie auf viele Knoten (Replikation), statt sie zu verteilen. Lesen skaliert so linear.

**Fehler:**
- Suchdienst langsam: Timeout 100 ms, dann keine Vorschläge. Die normale Suche funktioniert weiter.
- Batch-Job fällt aus: Die alten Vorschläge bleiben. Alarm, wenn sie älter als ein Tag sind.

**Sicherheit:** Keine Personendaten aus Logs als Vorschlag. Anstössige Begriffe mit einer Blockliste filtern. Begriffe erst ab einer Mindestzahl von Nutzern vorschlagen.

**Kosten:** Wenig Speicher, viele kleine Anfragen. Debounce im Client spart am meisten.

## Follow-ups
- Was ist Debounce? → Der Client wartet kurz, bis der Nutzer aufhört zu tippen. Erst dann schickt er die Anfrage. In Angular geht das mit RxJS `debounceTime`.
- Wie behandeln Sie Tippfehler? → Fuzzy-Suche mit Edit-Distanz im Suchindex, zum Beispiel „Brn“ findet „Bern“.
- Wie kommen neue Trends schnell rein? → Ein zweiter, kleiner Stream zählt die letzte Stunde. Er wird zur Batch-Liste gemischt.
- Warum nicht `LIKE '%ber%'`? → Ein Wildcard am Anfang kann den B-Tree-Index nicht nutzen. Dafür braucht man Trigramme (`pg_trgm`) oder einen Suchindex.
- Wie gehen Sie mit Umlauten um? → Normalisieren: klein schreiben und Umlaute einheitlich speichern, zum Beispiel „zürich“ und „zuerich“.

## Don't say
- „Bei jedem Tastendruck mache ich eine Volltextsuche in der Datenbank.“ Das ist zu langsam und zu teuer.
- Nicht behaupten, Sie hätten Elasticsearch produktiv betrieben.

## Words
- **das Präfix** = Anfang eines Wortes
- **der Trie** = Präfix-Baum
- **Debounce** = warten, bis der Nutzer aufhört zu tippen
- **Edge N-Gram** = alle Anfänge eines Wortes
- **anstössig** = offensive
