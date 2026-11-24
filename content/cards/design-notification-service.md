---
id: design-notification-service
round: design
tech: [microservices, kafka, postgres]
tier: 1
proof: study
project: BIT DAZiT (Kafka), DigiSanté (Event Hub)
q: Entwerfen Sie ein Benachrichtigungssystem für E-Mail, SMS und Push.
en: Design a notification service for email, SMS and push.
---
## 30s
Zuerst frage ich: Welche Kanäle? Wie viele Nachrichten? Wie wichtig ist jede Nachricht?
Ich nehme an: 10 Millionen Nutzer, 50 Millionen Nachrichten pro Tag.
Mein Plan: Andere Services schicken ein Event. Der Notification-Service prüft die Einstellungen des Nutzers.
Dann kommt die Nachricht in eine Queue pro Kanal. Worker schicken sie an den Anbieter.
Jede Nachricht hat eine ID. So schicken wir sie nie doppelt.
Bei DAZiT haben wir Services mit Kafka verbunden. Bei DigiSanté kam das Scan-Ergebnis über Event Hub zu einer eigenen Function.
Soll ich die Tabellen oder die Fehlerfälle zeigen?

## 90s
**Zahlen:** 50 Millionen pro Tag = etwa 600 pro Sekunde. Spitze (zum Beispiel eine Kampagne) etwa 5000 pro Sekunde.

**API:**
```
POST /api/notifications
{ "idempotencyKey": "order-4711-shipped", "userId": 42,
  "template": "ORDER_SHIPPED", "data": { "orderId": 4711 },
  "priority": "HIGH" }
→ 202 Accepted { "id": "..." }
GET /api/notifications/{id}   → Status pro Kanal
PUT /api/users/{id}/preferences
```

**Tabellen:**
```
notifications(id PK, idempotency_key UNIQUE, user_id, template, payload, created_at)
deliveries(id PK, notification_id, channel, status, attempts, provider_msg_id, updated_at)
preferences(user_id, channel, enabled, quiet_from, quiet_to)  -- PK (user_id, channel)
templates(name, channel, language, body)
```

**SQL laut gesagt:**
```
INSERT INTO notifications(id, idempotency_key, user_id, template, payload)
VALUES (:id, :key, :user, :tpl, :payload)
ON CONFLICT (idempotency_key) DO NOTHING;
```
„Kommt dieselbe Anfrage zweimal, gibt es keine zweite Zeile.“

```
SELECT channel FROM preferences
WHERE user_id = :user AND enabled = true;
```
„Ich hole die Kanäle, die der Nutzer erlaubt hat.“

**Ablauf:** Event → Service speichert und prüft Einstellungen → eine Queue pro Kanal (E-Mail, SMS, Push) → Worker rendert das Template → Anbieter (SMTP, SMS-Gateway, APNs/FCM) → Status in `deliveries`.

## 3min
**Warum eine Queue pro Kanal?** SMS ist langsam und teuer. E-Mail ist schnell. Wenn der SMS-Anbieter hängt, darf E-Mail nicht warten. Jede Queue skaliert eigene Worker.

**Prioritäten:** Ein Login-Code ist dringend. Ein Newsletter nicht. Darum zwei Queues: high und low. Die Worker lesen zuerst high.

**Fehler:**
- Anbieter antwortet nicht: Retry mit exponential Backoff. Nach 5 Versuchen in eine Dead-Letter-Queue.
- Worker stürzt nach dem Senden ab: Die Nachricht kommt nochmal. Darum prüft der Worker den Status in `deliveries` vor dem Senden. Ganz ausschliessen kann man Duplikate beim Anbieter nicht. At-least-once ist die Realität.
- Event geht zwischen Datenbank und Queue verloren: Outbox Pattern. Die Nachricht wird in derselben Transaktion in eine Outbox-Tabelle geschrieben.

**Skalierung:** Worker sind zustandslos. Kafka-Partitionen nach `user_id`. So bleibt die Reihenfolge pro Nutzer gleich. Rate Limits der Anbieter beachten.

**Sicherheit:** Telefonnummern und E-Mails sind Personendaten. Verschlüsselt speichern. Logs ohne Inhalt der Nachricht. Unsubscribe-Link in jeder Marketing-Mail.

**Kosten:** SMS kostet pro Nachricht. Darum: Push zuerst, SMS nur wenn nötig. Doppelte SMS kosten echtes Geld.

**In der Bundesverwaltung:** Für Behörden gibt es Sedex als Kanal. Bei DigiSanté lief der Sedex-Client als Sidecar-Container.

## Follow-ups
- Wie verhindern Sie Spam an einen Nutzer? → Ein Limit pro Nutzer und Tag. Und Ruhezeiten aus den Einstellungen, zum Beispiel keine Push nachts.
- Wie bauen Sie „Nachricht gelesen“? → Push und E-Mail melden das über einen Callback oder ein Tracking-Pixel. Das schreibt den Status in `deliveries`.
- Kafka oder eine einfache Queue? → Bei 600 pro Sekunde reicht auch eine Queue wie RabbitMQ oder Azure Service Bus. Kafka lohnt sich bei Replay und vielen Consumern.
- Wie testen Sie Templates in vielen Sprachen? → Templates pro Sprache in der Datenbank, mit Snapshot-Tests. Fallback auf Deutsch.
- Was passiert bei einer Kampagne an 10 Millionen Nutzer? → In die low-Queue, in Paketen. So blockiert sie keine dringenden Nachrichten.

## Don't say
- „Exactly-once ist garantiert.“ Bei externen Anbietern gibt es nur at-least-once plus Idempotenz.
- Nicht alles synchron im Request senden. Der Aufrufer wartet sonst auf den SMS-Anbieter.

## Words
- **der Kanal** = channel (E-Mail, SMS, Push)
- **die Einstellungen** = preferences
- **exponential Backoff** = Wartezeit wird bei jedem Retry länger
- **die Dead-Letter-Queue** = Ablage für Nachrichten, die immer scheitern
- **der Anbieter** = provider
