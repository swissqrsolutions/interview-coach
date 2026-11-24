---
id: design-rate-limiter
round: design
tech: [microservices, rest]
tier: 1
proof: study
q: Entwerfen Sie ein Rate Limiting für eine öffentliche API.
en: Design rate limiting for a public API.
---
## 30s
Zuerst frage ich: Wen limitieren wir? Pro Nutzer, pro API-Key oder pro IP? Wie viele Anfragen?
Ich nehme an: 100 000 API-Keys, insgesamt 10 000 Anfragen pro Sekunde.
Mein Plan: ein Token Bucket pro Key. Die Zähler liegen in Redis, weil alle Instanzen sie teilen.
Der Check läuft im API-Gateway, vor den Services.
Bei zu vielen Anfragen gibt es HTTP 429 mit einem Retry-After-Header.
Einen Rate Limiter habe ich nicht selbst gebaut. Das Prinzip kenne ich aus API-Gateways und Cloud-Diensten.
Soll ich die Algorithmen vergleichen?

## 90s
**Die Algorithmen:**
- **Fixed Window:** Zähler pro Minute. Einfach. Problem: 100 Anfragen um 12:00:59 und 100 um 12:01:00 = 200 in zwei Sekunden.
- **Sliding Window Log:** Jeder Zeitstempel wird gespeichert. Genau, aber braucht viel Speicher.
- **Sliding Window Counter:** aktuelles Fenster plus gewichteter Teil des letzten Fensters. Guter Kompromiss.
- **Token Bucket:** Der Eimer hat zum Beispiel 100 Tokens. Pro Sekunde kommen 10 dazu. Jede Anfrage nimmt ein Token. Erlaubt kurze Spitzen. Das nehme ich.

**API (Antwort an den Client):**
```
HTTP 429 Too Many Requests
Retry-After: 3
RateLimit-Limit: 100     (Header-Namen: IETF-Entwurf, je nach Gateway)
RateLimit-Remaining: 0
```

**Datenmodell:**
In Redis pro Key: `rl:{apiKey}` → tokens, last_refill. Mit einem Lua-Skript lesen und schreiben, damit es atomar ist.

Die Regeln liegen in einer Tabelle:
```
plans(plan PK, capacity, refill_per_sec)
api_keys(key_hash PK, customer_id, plan, active)
```

**SQL laut gesagt:**
```
SELECT p.capacity, p.refill_per_sec
FROM api_keys k JOIN plans p ON p.plan = k.plan
WHERE k.key_hash = :hash AND k.active = true;
```
„Ich hole das Limit für diesen Key. Das Ergebnis cache ich im Gateway für eine Minute.“

Ohne Redis, nur mit PostgreSQL (Fixed Window):
```
INSERT INTO rl_counter(key_hash, window_start, n) VALUES (:hash, :minute, 1)
ON CONFLICT (key_hash, window_start) DO UPDATE SET n = rl_counter.n + 1
RETURNING n;
```
„Ich zähle atomar hoch und bekomme den neuen Wert zurück. Ist er über dem Limit, kommt 429.“

## 3min
**Wo läuft der Check?** Im API-Gateway oder Ingress. So schützt er alle Services. Zusätzlich ein grobes Limit pro IP am Rand, gegen Angriffe.

**Skalierung:** 10 000 Anfragen pro Sekunde sind für Redis wenig. Ein Redis-Knoten schafft viel mehr. Bei mehr Last: Redis Cluster, verteilt nach Key.

**Lokal oder zentral?**
- Zentral in Redis: genau, aber ein Netzwerk-Aufruf pro Anfrage (unter 1 ms im selben Rechenzentrum).
- Lokal pro Instanz: sehr schnell, aber ungenau. Bei 10 Instanzen ist das echte Limit bis zu 10-mal höher.
- Kompromiss: lokal zählen und alle 100 ms mit Redis abgleichen.

**Fehler:**
- Redis fällt aus: Fail open oder fail closed? Für eine normale API: fail open, also durchlassen und alarmieren. Für Login-Versuche: fail closed.
- Uhren auf verschiedenen Servern laufen anders: Die Zeit vom Redis-Server nehmen, nicht vom Pod.
- Race Condition zwischen Lesen und Schreiben: darum das Lua-Skript, es läuft atomar.

**Sicherheit:** API-Keys nur als Hash speichern. Login-Endpunkte streng limitieren, gegen Brute Force. Limits nicht nur pro IP: Angreifer haben viele IPs.

**Kosten:** Ein kleiner Redis reicht. Das Limit spart Kosten, weil es die Backends schützt.

## Follow-ups
- Was ist der Unterschied zwischen Rate Limiting und Throttling? → Rate Limiting lehnt ab (429). Throttling verlangsamt oder stellt in eine Warteschlange.
- Wie limitieren Sie teure Endpunkte stärker? → Kosten pro Endpunkt: Eine Suche kostet 5 Tokens, ein GET kostet 1.
- Wie merkt der Kunde, dass er bald am Limit ist? → Über die Header `RateLimit-Remaining` und `Retry-After`.
- Was macht ein guter Client bei 429? → Er wartet die Zeit aus `Retry-After` und nutzt exponential Backoff mit Jitter.
- Warum nicht in jedem Service selbst? → Dann ist die Logik zehnmal kopiert. Das Gateway ist ein zentraler Ort.

## Don't say
- „Ich zähle in einer HashMap im Service.“ Bei mehreren Pods ist das falsch.
- Nicht vergessen zu sagen, was bei einem Redis-Ausfall passiert.

## Words
- **der Eimer** = bucket
- **atomar** = ganz oder gar nicht, ohne Unterbrechung
- **fail open / fail closed** = bei Fehler durchlassen / blockieren
- **der Jitter** = kleine zufällige Wartezeit
- **Brute Force** = viele Passwörter ausprobieren
