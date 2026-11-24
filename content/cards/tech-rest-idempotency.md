---
id: tech-rest-idempotency
round: tech
tech: [rest]
tier: 1
project: ElCom MATCH
q: Was bedeutet Idempotenz bei REST? Wie machen Sie einen POST sicher gegen doppelte Requests?
en: What does idempotency mean in REST? How do you make a POST safe against duplicate requests?
---
## 30s
Idempotent heisst: Ein Request zweimal hat dieselbe Wirkung wie einmal.
GET, PUT und DELETE sind idempotent. POST ist es nicht.
Das ist wichtig, weil Clients bei Timeouts einen Retry machen.
Für POST nutze ich einen Idempotency Key. Der Server merkt sich Key und Antwort.
Kommt der Key noch einmal, gibt er dieselbe Antwort zurück, ohne neue Bestellung.
Bei MATCH war Idempotenz das Kernprinzip: keine Duplikate bei Neustarts, Retries sind sicher.
Soll ich zeigen, wie der Server das umsetzt?

## 90s
**Ablauf mit Idempotency Key:**
1. Der Client erzeugt eine UUID und sendet sie im Header `Idempotency-Key`.
2. Der Server versucht, den Key in eine Tabelle zu schreiben. Unique Constraint auf dem Key.
3. Neu → Arbeit machen, Antwort mit dem Key speichern, alles in einer Transaktion.
4. Schon da und fertig → gespeicherte Antwort zurückgeben.
5. Schon da, aber noch in Arbeit → `409 Conflict`, der Client versucht es später.

```sql
CREATE TABLE idempotency_keys (
  key          text PRIMARY KEY,
  request_hash text NOT NULL,
  status_code  int,
  response     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
INSERT INTO idempotency_keys(key, request_hash) VALUES (:key, :hash)
ON CONFLICT (key) DO NOTHING;   -- 0 Zeilen = Key gab es schon
```

**Alternative ohne Header:** Ein fachlicher Schlüssel ist eindeutig, zum Beispiel `(tenant_id, external_ref)`. Ein zweites Insert schlägt fehl. Der Server gibt die vorhandene Ressource zurück.

## 3min
**Feinheiten:**
- Gleicher Key, aber anderer Body → das ist ein Client-Fehler. Ich vergleiche einen Hash vom Body und antworte mit `422`.
- Keys laufen ab, zum Beispiel nach 24 Stunden. Ein Job räumt alte Keys auf.
- Die Prüfung und die Arbeit müssen atomar sein. Sonst kommen zwei parallele Requests beide durch.

**Was ich bei MATCH gemacht habe (gleiche Idee, andere Schicht):**
- Nachrichten werden atomar geclaimt: `UPDATE ... OUTPUT INSERTED.*`, Pending → Processing. Zwei Läufe bekommen nie dieselbe Nachricht.
- Schreiben pro Nachricht: DELETE WHERE message_id = X, dann APPEND, in einer Iceberg-Transaktion. Ein zweiter Lauf ersetzt, statt zu duplizieren.
- Statistik: "replace, nicht add". Beispiel aus dem Sprint Review: Montag hat 10 Datensätze, 3 kommen dazu, richtig sind 13. Addiere ich bei einem Retry noch einmal 3, kommen 16 heraus. Rechne ich den Tag neu, kommt immer 13 heraus.

**Bei Messaging:** Kafka liefert at-least-once. Darum muss auch ein Consumer idempotent sein, zum Beispiel mit einer Tabelle der verarbeiteten Event-IDs.

**Trade-off:** Idempotenz kostet eine Tabelle und einen Lookup pro Request. Für Zahlungen, Bestellungen und Einreichungen lohnt sich das immer.

## Follow-ups
- Ist PATCH idempotent? → Nicht garantiert. `{"name": "X"}` ist idempotent, aber "erhöhe um 1" nicht.
- Ist DELETE idempotent, wenn das zweite Mal 404 kommt? → Ja. Der Zustand auf dem Server ist gleich. Nur die Antwort ist anders.
- Was ist der Unterschied zwischen safe und idempotent? → Safe heisst: keine Änderung, zum Beispiel GET. Idempotent heisst: Wiederholen ändert nichts mehr. PUT ist idempotent, aber nicht safe.
- Wer erzeugt den Key? → Der Client, einmal pro fachlicher Aktion. Bei einem Retry schickt er denselben Key.
- Was passiert bei zwei gleichzeitigen Requests mit demselben Key? → Der Unique Constraint lässt nur einen durch. Der andere bekommt `409` oder wartet.

## Don't say
- „POST ist idempotent, wenn man aufpasst.“ Von Natur aus nicht. Man muss es bauen.
- „Wir prüfen erst mit SELECT, ob es den Key gibt.“ Ohne Constraint oder Lock ist das eine Race Condition.

## Words
- **die Wirkung** = effect
- **der Wiederholungsversuch (Retry)** = retry
- **der Eindeutigkeits-Constraint** = unique constraint
- **atomar** = alles oder nichts
- **die Race Condition** = zwei parallele Abläufe stören sich
