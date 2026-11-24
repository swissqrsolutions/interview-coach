---
id: design-chat
round: design
tech: [microservices, kafka, postgres]
tier: 2
proof: study
q: Entwerfen Sie eine Chat-Anwendung wie WhatsApp oder Slack.
en: Design a chat application like WhatsApp or Slack.
---
## 30s
Zuerst frage ich: Nur 1:1 oder auch Gruppen? Wie gross sind Gruppen? Brauchen wir Lesebestätigungen?
Ich nehme an: 1 Million aktive Nutzer pro Tag, je 50 Nachrichten. Gruppen bis 100 Personen.
Mein Plan: Die Clients halten eine WebSocket-Verbindung zu einem Gateway.
Eine Nachricht wird zuerst gespeichert, dann an die Empfänger verteilt.
Jede Unterhaltung hat eine fortlaufende Nummer. So bleibt die Reihenfolge richtig.
Wer offline ist, bekommt eine Push-Nachricht und holt die Nachrichten später.
Soll ich mit dem Datenmodell anfangen?

## 90s
**Zahlen:**
- 50 Millionen Nachrichten pro Tag = etwa 600 pro Sekunde, Spitze etwa 3000.
- Pro Nachricht etwa 1 KB = 50 GB pro Tag, etwa 18 TB pro Jahr.
- 1 Million gleichzeitige WebSocket-Verbindungen im schlimmsten Fall.

**API:**
```
WebSocket  /ws          send: { "clientMsgId": "...", "conversationId": 7, "text": "Hallo" }
                        receive: { "conversationId": 7, "seq": 1043, "from": 42, "text": "Hallo" }
GET  /api/conversations/{id}/messages?beforeSeq=1043&limit=50
POST /api/conversations/{id}/read   { "seq": 1043 }
```

**Tabellen:**
```
conversations(id PK, type, created_at)
members(conversation_id, user_id, last_read_seq)       -- PK (conversation_id, user_id)
messages(conversation_id, seq, sender_id, client_msg_id, body, created_at)
         -- PK (conversation_id, seq), UNIQUE (conversation_id, client_msg_id)
```

**SQL laut gesagt:**
```
SELECT seq, sender_id, body, created_at
FROM messages
WHERE conversation_id = :conv AND seq < :beforeSeq
ORDER BY seq DESC
LIMIT 50;
```
„Ich lade die letzten 50 Nachrichten vor einer Nummer. Der Primärschlüssel ist genau der Index dafür.“

```
SELECT m.conversation_id, count(*) AS unread
FROM members mb JOIN messages m
  ON m.conversation_id = mb.conversation_id AND m.seq > mb.last_read_seq
WHERE mb.user_id = :user
GROUP BY m.conversation_id;
```
„Ich zähle ungelesene Nachrichten pro Unterhaltung.“

**Ablauf:** Client → Gateway → Chat-Service vergibt `seq` und speichert → Event auf ein Topic (Key = conversation_id) → Fan-out-Service schaut nach: Auf welchem Gateway ist der Empfänger? → schickt es dorthin → sonst Push-Nachricht.

## 3min
**Reihenfolge:** Die Uhrzeit der Clients ist unzuverlässig. Darum vergibt der Server pro Unterhaltung eine `seq`. Kafka mit Key = conversation_id hält die Reihenfolge pro Partition.

**Doppelte Nachrichten:** Das Handy sendet bei schlechtem Netz nochmal. Die `client_msg_id` ist unique. Der zweite INSERT macht nichts.

**Presence (online/offline):** Heartbeat alle 30 Sekunden in Redis mit TTL. Das muss nicht exakt sein.

**Speicher:** 18 TB pro Jahr. Am Anfang PostgreSQL, partitioniert nach Zeit. Später eine Wide-Column-Datenbank wie Cassandra, Partition Key = conversation_id. Alte Nachrichten in günstigeren Speicher.

**Skalierung:**
- Gateways halten die Verbindungen. Ein Gateway schafft viele zehntausend Verbindungen. Wir brauchen also einige Dutzend.
- Eine Tabelle in Redis: user_id → Gateway.
- Grosse Gruppen: Fan-out beim Schreiben wird teuer. Bei sehr grossen Kanälen besser beim Lesen holen.

**Fehler:**
- Gateway stürzt ab: Clients verbinden neu und holen alles ab `last_seq`. Keine Nachricht geht verloren, weil wir zuerst speichern.
- Kafka-Consumer hängt: Lag messen und alarmieren.

**Sicherheit:** TLS für alles. Login mit Token beim WebSocket-Aufbau. Nur Mitglieder dürfen lesen: Jede Abfrage prüft `members`. Ende-zu-Ende-Verschlüsselung ist möglich, dann sieht der Server keinen Text. Aber dann gibt es keine Server-Suche.

**Kosten:** Speicher und offene Verbindungen sind die grössten Posten.

**Mein Bezug:** Kafka mit Keys für die Reihenfolge habe ich bei DAZiT genutzt. Einen Chat habe ich nicht gebaut.

## Follow-ups
- Warum WebSocket und nicht Polling? → Polling erzeugt viele leere Anfragen. WebSocket hält eine Verbindung offen und der Server kann sofort senden.
- Wie bauen Sie Lesebestätigungen? → Der Client meldet die höchste gelesene `seq`. Wir speichern sie in `members.last_read_seq` und schicken ein Event an den Sender.
- Wie suchen Sie in Nachrichten? → Asynchron in einen Suchindex wie OpenSearch. Bei Ende-zu-Ende-Verschlüsselung nur lokal auf dem Gerät.
- Was passiert, wenn ein Nutzer zwei Geräte hat? → Jedes Gerät hat eine eigene Verbindung. Der Fan-out schickt an alle Geräte des Nutzers.
- Wie löschen Sie Nachrichten? → Soft Delete mit einem Flag. Ein Event sagt allen Clients, dass sie die Nachricht ausblenden.

## Don't say
- „Die Reihenfolge nach Client-Zeitstempel.“ Die Uhren der Handys sind falsch.
- Nicht vergessen: Offline-Nutzer und Neuverbindung sind der schwierige Teil.

## Words
- **die Unterhaltung** = conversation
- **die Lesebestätigung** = read receipt
- **der Fan-out** = eine Nachricht an viele Empfänger verteilen
- **der Heartbeat** = kleines Signal „ich lebe noch“
- **Ende-zu-Ende-Verschlüsselung** = nur Sender und Empfänger können lesen
