---
id: design-url-shortener
round: design
tech: [postgres, rest]
tier: 1
proof: study
q: Entwerfen Sie einen URL-Shortener wie bit.ly.
en: Design a URL shortener like bit.ly.
---
## 30s
Zuerst frage ich: Wie viele neue Links pro Tag? Wie viele Klicks? Laufen Links ab?
Ich nehme an: 1 Million neue Links pro Tag, 100 Klicks pro Link.
Das System liest also viel mehr, als es schreibt.
Mein Plan: Ein kurzer Code zeigt auf die lange URL. Der Code ist der Primärschlüssel.
Für die Klicks nutze ich einen Cache vor der Datenbank.
Einen URL-Shortener habe ich nicht produktiv gebaut. Die Muster kenne ich aber: Schlüssel, Cache, Idempotenz.
Soll ich mit der API oder mit den Zahlen anfangen?

## 90s
**Zahlen:**
- 1 Million neue Links pro Tag = etwa 12 Schreibzugriffe pro Sekunde.
- 100 Millionen Klicks pro Tag = etwa 1200 pro Sekunde, Spitze etwa 5000.
- Pro Link etwa 500 Bytes. 365 Millionen Links pro Jahr = etwa 200 GB. Das passt in PostgreSQL.

**API:**
```
POST /api/links        { "url": "https://...", "expiresAt": "..." }  → 201 { "code": "aZ3k9Qx" }
GET  /{code}           → 302 Location: https://...
GET  /api/links/{code}/stats  → { "clicks": 1234 }
```

**Der Code:** Base62 (a–z, A–Z, 0–9). 7 Zeichen = 62 hoch 7 = etwa 3,5 Billionen Codes. Das reicht für Jahre.

**Tabellen:**
```
links(code PK, long_url, owner_id, created_at, expires_at)
clicks_daily(code, day, clicks)   -- PK (code, day)
```

**SQL laut gesagt:**
```
SELECT long_url FROM links
WHERE code = :code
  AND (expires_at IS NULL OR expires_at > now());
```
„Ich suche über den Primärschlüssel. Das ist ein Index-Zugriff, sehr schnell.“

```
INSERT INTO clicks_daily(code, day, clicks)
VALUES (:code, current_date, :n)
ON CONFLICT (code, day) DO UPDATE SET clicks = clicks_daily.clicks + :n;
```
„Ich zähle Klicks pro Tag. Gibt es die Zeile schon, erhöhe ich den Zähler.“

**Ablauf beim Klick:** Cache fragen → bei Miss die Datenbank → Antwort 302 → Klick-Event asynchron in eine Queue.

## 3min
**Wie erzeuge ich den Code?**
- **Zähler + Base62:** Jede Instanz holt einen Block von IDs, zum Beispiel 10 000 auf einmal. Keine Kollisionen. Aber die Codes sind ratbar.
- **Zufall + Prüfung:** 7 zufällige Zeichen, dann `INSERT`. Bei Konflikt auf dem Primärschlüssel einfach neu würfeln. Nicht ratbar.
- **Hash der URL:** gleiche URL = gleicher Code. Aber Kollisionen müssen trotzdem behandelt werden.
Ich nehme Zufall + Prüfung. Der Primärschlüssel schützt vor Duplikaten.

**301 oder 302?** 301 wird im Browser gecacht. Dann sehen wir keine Klicks mehr. Für Statistik nehme ich 302.

**Speicher und Cache:** PostgreSQL ist die Quelle der Wahrheit. Davor ein Redis-Cache. Die meisten Klicks gehen auf wenige Links. Darum ist die Trefferquote hoch.

**Skalierung:** Der Redirect-Service ist zustandslos. Er skaliert horizontal. Read Replicas für die Datenbank. Erst bei viel mehr Links: Sharding nach Code.

**Fehler:**
- Cache fällt aus: Die Datenbank trägt die Last, aber langsamer. Darum Replicas.
- Klick-Events gehen verloren: Für Statistik ist das ok, wenn es wenige sind. Für Abrechnung nicht.
- Doppelter POST: Mit einem Idempotency-Key gibt der Server denselben Code zurück.

**Sicherheit:** Missbrauch ist das grösste Risiko. URLs gegen Malware-Listen prüfen. Rate Limit pro Nutzer. Keine offenen Redirects auf interne Adressen.

**Kosten:** Billig. Der Hauptteil sind Cache und Datenbank. Der Redirect-Service braucht wenig CPU.

## Follow-ups
- Wie verhindern Sie, dass jemand alle Codes durchprobiert? → Zufällige Codes statt Zähler, Rate Limit pro IP, und private Links mit Login.
- Was passiert mit abgelaufenen Links? → Ein Job löscht sie nachts. Der Redirect prüft `expires_at` sowieso.
- Wie zählen Sie Klicks bei 5000 pro Sekunde? → Nicht jede Zeile einzeln schreiben. Events in eine Queue, dann pro Minute summieren und einmal schreiben.
- Darf ein Nutzer einen eigenen Code wählen? → Ja. Dann einfach `INSERT`. Der Primärschlüssel meldet, wenn der Code schon belegt ist.
- Warum nicht NoSQL? → Ein Key-Value-Store passt auch gut. Aber 200 GB pro Jahr schafft PostgreSQL. Ich wähle das Einfache.

## Don't say
- „Ich nehme MD5 und die ersten 7 Zeichen.“ Ohne Kollisionsbehandlung ist das falsch.
- Nicht 301 nehmen und dann Klicks zählen wollen.

## Words
- **die Kollision** = zwei URLs bekommen denselben Code
- **ratbar** = guessable
- **die Trefferquote** = cache hit rate
- **zustandslos** = stateless
- **der Primärschlüssel** = primary key
