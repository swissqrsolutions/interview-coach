---
id: sql-jsonb
round: sql
tech: [postgres]
tier: 2
project: DigiSanté, CARIAD (PostgreSQL)
q: Wann nutzen Sie JSONB in PostgreSQL, und wie machen Sie Abfragen darauf schnell?
en: When do you use JSONB in PostgreSQL, and how do you make queries on it fast?
---
## 30s
JSONB speichert JSON binär und schon geparst.
Ich kann darin suchen und es mit einem GIN-Index beschleunigen.
Ich nutze es für flexible Zusatzdaten, zum Beispiel Metadaten oder Event-Payloads.
Felder, nach denen ich oft filtere oder joine, gehören in echte Spalten.
*(Ihr echtes Beispiel: wo Sie JSONB in einem Projekt genutzt haben, z. B. bei DigiSanté oder CARIAD. Sonst: „Produktiv habe ich vor allem relationale Spalten genutzt.“)*
Soll ich die Operatoren und den Index zeigen?

## 90s
**Tabelle:**
```
CREATE TABLE events (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  payload    jsonb NOT NULL
);
```
**Die wichtigsten Operatoren:**
```
payload -> 'customer'            -- gibt JSONB zurück
payload ->> 'type'               -- gibt Text zurück
payload #>> '{customer,city}'    -- Pfad, als Text
payload @> '{"type":"ORDER"}'    -- enthält dieses Stück JSON
payload ? 'refund'               -- Schlüssel existiert
```
**Abfrage:**
```
SELECT id, payload ->> 'orderId' AS order_id
FROM events
WHERE payload @> '{"type":"ORDER","status":"PAID"}';
```
**Index:**
```
CREATE INDEX ix_events_payload
  ON events USING GIN (payload jsonb_path_ops);
```
Laut gesagt: „Mit `@>` und einem GIN-Index findet die DB die Zeilen schnell, auch bei Millionen Events.“

**Ein Feld oft gebraucht?** Dann ein Expression Index:
```
CREATE INDEX ix_events_order ON events ((payload ->> 'orderId'));
```

## 3min
**JSON oder JSONB?**
- `json` speichert den Text genau so, wie er kommt. Schnell beim Schreiben, langsam beim Suchen.
- `jsonb` parst einmal. Reihenfolge der Schlüssel und doppelte Schlüssel gehen verloren. Fast immer die bessere Wahl.

**GIN-Varianten:**
- `jsonb_ops` (Standard): kann `@>`, `?`, `?|`, `?&`. Größer.
- `jsonb_path_ops`: nur `@>` und JSON-Path-Abfragen. Kleiner und schneller.

**Neuere SQL/JSON-Funktionen:**
- `jsonb_path_query` und `@?` mit JSON Path, schon länger da.
- PostgreSQL 16: `IS JSON` als Prüfung.
- PostgreSQL 17: `JSON_TABLE`, `JSON_VALUE`, `JSON_QUERY`, `JSON_EXISTS` aus dem SQL-Standard.

**Wann NICHT JSONB:**
- Kernfelder mit Regeln: Pflichtfeld, Fremdschlüssel, Unique. Das kann JSONB nicht gut.
- Häufige kleine Updates auf ein Feld: PostgreSQL schreibt das ganze Dokument neu.
- Statistik: Der Planner kennt die Werte im JSON schlecht. Schätzungen sind oft falsch.

**Guter Mittelweg:** Wichtige Felder als Spalten, Rest als JSONB. Oder eine Generated Column:
```
ALTER TABLE events
  ADD COLUMN event_type text
  GENERATED ALWAYS AS (payload ->> 'type') STORED;
```

## Follow-ups
- Ist PostgreSQL mit JSONB eine Dokument-Datenbank? → Für viele Fälle ja. Dazu kommen Transaktionen und Joins, die eine Dokument-DB oft nicht hat.
- Wie validieren Sie das JSON? → In der Anwendung mit einem Schema. In der DB mit `CHECK`-Constraints auf wichtige Felder.
- Warum nutzt meine Abfrage `payload->>'type' = 'ORDER'` den GIN-Index nicht? → GIN hilft bei `@>`, nicht bei `->>` mit `=`. Dafür brauche ich einen Expression Index.
- Wie ändern Sie ein Feld? → `jsonb_set(payload, '{status}', '"DONE"')` oder `payload || '{"status":"DONE"}'`.

## Don't say
- „Mit JSONB brauche ich kein Datenmodell mehr.“ Das rächt sich bei Abfragen und Qualität.
- „Der GIN-Index hilft bei jeder JSON-Abfrage.“ Nur bei bestimmten Operatoren.

## Words
- **geparst** = parsed
- **Zusatzdaten** = extra data
- **Expression Index** = Index auf einen berechneten Ausdruck
- **Pflichtfeld** = required field
