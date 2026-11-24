---
id: tech-micro-data
round: tech
tech: [microservices]
tier: 1
project: BIT DAZiT, DigiSanté (DB pro Mandant)
q: Wie verwalten Microservices ihre Daten? Database per Service, Shared Database, Konsistenz?
en: How do microservices manage their data? Database per service, shared database, consistency?
---
## 30s
Jeder Service besitzt seine eigenen Daten. Andere Services greifen nur über seine API oder Events zu.
Das heisst "Database per Service". Es kann auch ein eigenes Schema auf demselben Server sein.
Eine gemeinsame Datenbank für viele Services ist ein Anti-Pattern. Sie koppelt alle Services.
Der Preis: keine Transaktion über Services. Ich brauche Eventual Consistency, Sagas und Outbox.
Bei DigiSanté hatte der Person-Service sogar eine eigene PostgreSQL-Datenbank pro Mandant, mit Flyway-Migrationen pro Mandant.
Soll ich erklären, wie man Daten aus mehreren Services abfragt?

## 90s
**Warum keine geteilte Datenbank?**
- Service A ändert eine Spalte. Service B bricht. Man muss zusammen deployen.
- Niemand weiss, wem die Daten gehören.
- Ein Service mit schweren Abfragen bremst alle anderen.

**Daten aus mehreren Services lesen:**
1. **API Composition:** Ein Service oder BFF ruft mehrere APIs und kombiniert. Einfach, aber langsamer.
2. **Lokale Kopie über Events:** Service B hört auf Events von A und speichert nur die Felder, die er braucht. Schnell, aber eventual consistent.
3. **CQRS Read Model:** Ein eigenes Lese-Modell, aus Events gebaut, optimiert für Abfragen.

**Konsistenz:**
- Innerhalb eines Services: normale ACID-Transaktionen.
- Über Services: Saga für Abläufe, Outbox für zuverlässige Events, idempotente Consumer.

**Bei DigiSanté (Mandanten):** Datenbank pro Mandant, zur Laufzeit erstellt. Flyway läuft automatisch pro Mandant. Volle Schema-Isolation. Das ist Isolation pro Mandant, nicht pro Service, aber dieselbe Idee: klare Grenzen und keine geteilten Tabellen.

## 3min
**Trade-offs:**
- Eigene DBs kosten mehr Betrieb: Backups, Migrationen, Monitoring pro DB.
- Reports über alle Daten werden schwer. Lösung: Daten in ein Analytics-System spiegeln, zum Beispiel einen Lakehouse. Das ist auch eine Lehre aus MATCH: Analytik auf der operativen Datenbank hat dort nicht mehr skaliert.
- Doppelte Daten (lokale Kopien) müssen aktuell bleiben. Events müssen zuverlässig sein.

**Wann ist eine geteilte DB ok?** Während einer Migration vom Monolithen, für kurze Zeit. Oder für wenige Services eines Teams, wenn jeder nur seine eigenen Tabellen schreibt. Das muss eine bewusste Entscheidung sein.

**Fehler und wie man sie bemerkt:**
- Lokale Kopie ist veraltet, weil ein Consumer hängt. → Consumer Lag messen und alarmieren.
- Ein Event fehlt, weil der Service nach dem DB-Commit abgestürzt ist. → Outbox Pattern.
- Zwei Services schreiben dieselben Daten. → Klare Ownership: genau ein Service schreibt.

**Migrationen pro Service:** Jeder Service hat seine eigenen Flyway-Skripte im Repo. Sie laufen beim Start oder als eigener Job. Bei DigiSanté liefen sie automatisch für jeden Mandanten.

## Follow-ups
- Wie machen Sie einen Join über zwei Services? → Gar nicht in der DB. API Composition, oder eine lokale Kopie der nötigen Daten über Events.
- Was ist CQRS? → Getrennte Modelle zum Schreiben und Lesen. Das Lese-Modell ist für Abfragen optimiert und wird aus Events gebaut.
- Muss jeder Service einen eigenen DB-Server haben? → Nein. Ein eigenes Schema mit eigenen Rechten reicht oft. Wichtig ist: keine Zugriffe auf fremde Tabellen.
- Wie migrieren Sie das Schema ohne Downtime? → Expand and Contract: zuerst neue Spalte hinzufügen, beide schreiben, dann alte Spalte entfernen.
- Warum eine DB pro Mandant bei DigiSanté? → Volle Isolation der Personendaten pro Mandant. *(Prüfen: Welche Gründe gab es genau? Nur echte Gründe nennen.)*

## Don't say
- „Wir hatten eine grosse Datenbank für alle Services, das war einfacher.“ Nur sagen, wenn es wahr ist, und dann mit Trade-off.
- „Eventual Consistency heisst, die Daten sind manchmal falsch.“ Besser: kurz veraltet, dann korrekt.

## Words
- **besitzen** = to own
- **die Isolation** = Trennung
- **der Mandant** = tenant
- **veraltet** = stale
- **spiegeln** = to replicate
