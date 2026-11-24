---
id: critique-shared-database
round: critique
tech: [microservices, postgres, hibernate]
tier: 2
project: DigiSanté (database per tenant), DAZiT (shared services)
q: Wir haben acht Microservices. Alle nutzen dieselbe Datenbank. Was sagen Sie dazu?
en: We have eight microservices. All use the same database. What do you say?
---
## 30s
**Die Architektur (als Text):**
```
Customer-Svc ─┐
Order-Svc ────┤
Billing-Svc ──┼──> 1 Datenbank, 1 Schema, alle Tabellen für alle lesbar und schreibbar
Report-Svc ───┤
... (8 Services)
```
Das ist ein verteilter Monolith. Die Services sind nur auf dem Papier getrennt.
Ändert ein Team eine Spalte, brechen andere Services.
Deployen geht nicht unabhängig. Ein Fehler in der DB trifft alle acht.
Fix: Jeder Service besitzt seine Daten. Andere fragen über eine API oder bekommen Events.
Das muss nicht sofort sein. Ein erster Schritt sind eigene Schemas und eigene DB-User.

## 90s
**Meine Liste mit Fix und Trade-off:**
1. **Verfügbarkeit:** Eine DB für alle. Eine lange Migration oder ein Lock stoppt alle Services. → Getrennte Schemas, später getrennte Datenbanken. *Trade-off:* mehr Betrieb.
2. **Sicherheit:** Jeder Service kann alle Daten lesen, auch Personendaten. → Ein DB-User pro Service, nur Rechte auf das eigene Schema. Need-to-know ist im Datenschutz wichtig.
3. **Konsistenz:** Heute einfach, weil alles in einer Transaktion geht. Nach der Trennung nicht mehr. → Saga und Outbox für Abläufe über Services. *Trade-off:* Eventual Consistency.
4. **Kopplung:** Das grösste Problem. Das Schema ist ein geheimer Vertrag zwischen allen Teams. → Klare Besitzer pro Tabelle. Zugriff von aussen über eine API, Events oder eine stabile View.
5. **Skalierung:** Alle Services teilen CPU, Verbindungen und Locks. → Getrennte Datenbanken können getrennt skalieren.
6. **Monitoring:** Wer macht die langsame Query? → Pro Service ein eigener DB-User und `application_name`. Dann sieht man es in `pg_stat_statements` und `pg_stat_activity`.
7. **Kosten:** Eine DB ist billiger. Acht Datenbanken kosten mehr. Mittelweg: ein DB-Server, aber getrennte Datenbanken oder Schemas.

## 3min
**Migrationsweg in Schritten (Strangler):**
1. Besitz festlegen: Welche Tabelle gehört welchem Service?
2. Ein Schema und ein DB-User pro Service. Fremde Zugriffe werden sichtbar, weil sie scheitern.
3. Fremde Zugriffe ersetzen durch API-Aufrufe oder durch eine lokale Kopie über Events.
4. Erst dann bei Bedarf eigene Datenbank-Instanzen.

**Wann ist eine geteilte DB okay?** Bei einem kleinen Team mit wenigen Services. Dann ist ein modularer Monolith oft die bessere Wahl als Microservices. Das sage ich offen.

**Joins über Services:** Ein Report braucht Daten aus drei Services. Lösung: ein eigenes Lese-Modell oder ein Data Warehouse, gefüllt über Events oder CDC (Change Data Capture). Nicht direkt in die Tabellen der anderen greifen.

**Aus meiner Praxis:** Bei DigiSanté hat der Person-Service eine eigene PostgreSQL-Datenbank pro Mandant. Sie wird zur Laufzeit angelegt. Flyway-Migrationen laufen automatisch pro Mandant. Das gibt volle Schema-Isolation. Das ist strenger als „ein Schema pro Service“, aber die Idee ist dieselbe: klare Datengrenzen.

**Trade-off ehrlich:** Getrennte Daten machen Reports und Transaktionen schwerer. Der Gewinn ist unabhängiges Deployen und klare Verantwortung.

## Follow-ups
- Wie machen Sie einen Report über mehrere Services? → Ein Lese-Modell oder Warehouse, gefüllt über Events oder CDC. Nicht über fremde Tabellen.
- Was ist CDC? → Change Data Capture: Änderungen werden aus dem Datenbank-Log gelesen, zum Beispiel mit Debezium, und als Events verteilt.
- Ist ein Schema pro Service genug? → Für den Anfang ja, wenn die Rechte getrennt sind. Ressourcen wie CPU teilen sie sich aber noch.
- Wie migrieren Sie, ohne dass alles stillsteht? → In kleinen Schritten. Neue Zugriffe nur über die API. Alte Zugriffe einen nach dem anderen umbauen.

## Don't say
- „Microservices müssen immer eigene Datenbank-Server haben.“ Eigene Daten ja, eigener Server nicht unbedingt.
- Nicht die Migration als Big Bang vorschlagen.

## Words
- **verteilter Monolith** = distributed monolith
- **Besitzer** = owner
- **Schema-Isolation** = separate schema per service or tenant
- **Lese-Modell** = read model
- **Mandant** = tenant
