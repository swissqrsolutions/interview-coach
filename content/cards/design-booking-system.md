---
id: design-booking-system
round: design
tech: [postgres, microservices]
tier: 1
proof: study
project: ElCom MATCH (atomic SQL claim)
q: Entwerfen Sie ein Buchungssystem. Wie verhindern Sie Doppelbuchungen?
en: Design a booking system. How do you prevent double bookings?
---
## 30s
Zuerst frage ich: Was wird gebucht? Hotelzimmer, Termine oder Sitzplätze? Wie viele Buchungen pro Sekunde?
Ich nehme an: Termine bei Ärzten, 2 Millionen Nutzer, etwa 50 Buchungen pro Sekunde.
Das Kernproblem: Zwei Personen buchen denselben Termin gleichzeitig.
Meine Lösung: Die Datenbank entscheidet. Ein Unique Constraint oder ein atomares UPDATE.
Nur eine Transaktion gewinnt. Die andere bekommt „schon vergeben“.
Bei MATCH nutzen wir dasselbe Prinzip: Ein atomares SQL-Update übernimmt eine Meldung. Zwei Worker nehmen nie dieselbe.
Soll ich die Locking-Varianten vergleichen?

## 90s
**Zahlen:** 50 Buchungen pro Sekunde, aber 2000 Suchanfragen pro Sekunde. Lesen ist 40-mal mehr. Spitze bei Öffnung neuer Termine.

**API:**
```
GET  /api/slots?doctorId=7&date=2026-12-01   → freie Termine
POST /api/bookings  { "slotId": 991, "idempotencyKey": "..." }
     → 201 Created   oder   409 Conflict
DELETE /api/bookings/{id}
```

**Tabellen:**
```
slots(id PK, doctor_id, starts_at, ends_at, status, version)
bookings(id PK, slot_id UNIQUE, user_id, created_at, idempotency_key UNIQUE)
```

**SQL laut gesagt — Variante 1, atomares UPDATE:**
```
UPDATE slots
SET status = 'BOOKED', version = version + 1
WHERE id = :slot AND status = 'FREE';
-- 1 Zeile geändert = gewonnen, 0 Zeilen = schon vergeben
```
„Ich ändere den Slot nur, wenn er noch frei ist. Die Datenbank sperrt die Zeile. Der Zweite sieht 0 Zeilen.“

**Variante 2, Unique Constraint:**
```
INSERT INTO bookings(id, slot_id, user_id, idempotency_key)
VALUES (:id, :slot, :user, :key);
-- zweiter INSERT für denselben slot_id → unique violation → 409
```
„Der Unique Index auf `slot_id` erlaubt nur eine Buchung pro Slot.“

**Ablauf:** Suche (aus Cache oder Replica) → Nutzer wählt → POST → Transaktion: Slot sperren + Buchung schreiben → Commit → Event „BookingCreated“ über Outbox → Bestätigungs-Mail.

## 3min
**Drei Arten von Locking:**
- **Pessimistisch:** `SELECT ... FOR UPDATE`. Die Zeile ist gesperrt, bis zum Commit. Sicher, aber andere warten. Gut bei vielen Konflikten auf wenigen Zeilen.
- **Optimistisch:** Spalte `version`. `UPDATE ... WHERE id = :id AND version = :v`. Bei 0 Zeilen: Konflikt, neu versuchen. Gut, wenn Konflikte selten sind.
- **Constraint:** Unique Index oder in PostgreSQL ein Exclusion Constraint für Zeiträume: `EXCLUDE USING gist (room_id WITH =, period WITH &&)`. Dafür braucht man die Extension `btree_gist`. Die Datenbank verbietet Überlappungen.
Ich mag Constraints: Sie schützen auch vor Bugs im Code.

**Hotel mit Zeiträumen:** Zimmer 12 vom 1. bis 3. Dezember. Eine zweite Buchung vom 2. bis 4. überlappt. Der Exclusion Constraint blockiert sie.

**Reservierung mit Ablaufzeit:** Bei Sitzplätzen mit Bezahlung halte ich den Platz 10 Minuten: Status HELD und `held_until`. Ein Job gibt abgelaufene Plätze frei. Oder die Abfrage prüft `held_until < now()`.

**Skalierung:** Die Suche geht auf Replicas und Cache. Der Cache darf kurz veraltet sein. Die Buchung selbst geht immer auf die Primary. Bei sehr viel Last: Sharding nach `doctor_id` oder Hotel. Eine Buchung bleibt so in einem Shard.

**Fehler:**
- Doppelklick auf „Buchen“: Idempotency-Key, gleiche Antwort beim zweiten Mal.
- Zahlung klappt, Buchung nicht: Saga mit Kompensation, also Geld zurück.
- Verteilte Locks mit Redis: nur wenn es keine gemeinsame Datenbank gibt. Sie sind schwer richtig zu machen.

**Sicherheit:** Nur der Besitzer darf stornieren. Rate Limit gegen Bots, die alle Termine blockieren.

**Kosten:** Klein. Eine PostgreSQL-Instanz schafft 50 Buchungen pro Sekunde leicht.

## Follow-ups
- Warum nicht im Code prüfen „ist der Slot frei?“ und dann schreiben? → Zwischen Prüfen und Schreiben kann ein anderer buchen. Das ist eine Race Condition. Die Prüfung muss in der Datenbank atomar sein.
- Welche Isolation Level brauchen Sie? → Read Committed reicht mit atomarem UPDATE oder Constraint. Serializable geht auch, dann muss der Code Retries machen.
- Was ist bei Ihnen in MATCH ähnlich? → Der Claim `UPDATE ... OUTPUT INSERTED.*` setzt Pending auf Processing. Nur ein Job bekommt die Meldung. Hängt ein Job, setzt die Stale-Job-Recovery sie nach einem Timeout zurück auf Pending.
- Was passiert bei Überbuchung wie bei Airlines? → Das ist eine Business-Entscheidung. Dann zähle ich mit einem Limit statt mit Unique: `WHERE booked < capacity`.
- Wie zeigen Sie freie Termine schnell? → Index auf `slots(doctor_id, starts_at)` mit Filter auf Status FREE, plus Cache für 30 Sekunden.

## Don't say
- „Ich nehme ein synchronized in Java.“ Das hilft nur in einer Instanz, nicht bei drei Pods.
- „Wir prüfen zuerst und schreiben dann.“ Das ist genau die Race Condition.

## Words
- **die Doppelbuchung** = double booking
- **sperren / die Sperre** = to lock / lock
- **die Race Condition** = zwei Abläufe stören sich gleichzeitig
- **überlappen** = to overlap
- **die Kompensation** = Rückgängig-Schritt in einer Saga
