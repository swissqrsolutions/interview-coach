---
id: sql-multi-tenancy
round: sql
tech: [postgres]
tier: 2
project: DigiSanté (Personen-Service, eine DB pro Mandant)
q: Wie trennen Sie die Daten von mehreren Mandanten in PostgreSQL?
en: How do you separate the data of several tenants in PostgreSQL?
---
## 30s
Es gibt drei Wege: eine Datenbank pro Mandant, ein Schema pro Mandant, oder eine Tabelle mit `tenant_id`.
Mehr Trennung heißt mehr Sicherheit, aber mehr Betrieb.
Bei DigiSanté hat jeder Mandant eine eigene PostgreSQL-Datenbank.
Der Personen-Service legt sie zur Laufzeit an.
Flyway-Migrationen laufen automatisch pro Mandant.
Es geht um AHV-Personendaten über ZAS/UPI. So sind sie pro Mandant voll getrennt.
Soll ich die Trade-offs der drei Wege vergleichen?

## 90s
**1. Datenbank pro Mandant (DigiSanté):**
- Volle Isolation. Ein Fehler im `WHERE` zeigt nie fremde Daten.
- Backup, Restore und Löschen pro Mandant sind einfach.
- Aber: viele Verbindungs-Pools, viele Migrationen, mehr Betrieb.

**2. Schema pro Mandant:**
- Eine DB, ein Schema pro Mandant. Die App setzt `search_path`.
- Weniger Betrieb als DB pro Mandant. Gute Trennung.
- Bei Tausenden Mandanten: sehr viele Tabellen, langsame Migrationen.

**3. Gemeinsame Tabellen mit `tenant_id`:**
- Am billigsten, skaliert auf viele kleine Mandanten.
- Risiko: Ein vergessener Filter zeigt fremde Daten. Darum Row-Level Security:
```
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON persons
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- pro Request in der Transaktion:
SET LOCAL app.tenant_id = '6f1c...';
```
Laut gesagt: „Die DB filtert selbst. Auch wenn der Entwickler den Filter vergisst.“

## 3min
**Wie läuft das bei DigiSanté?**
- Ein neuer Mandant → der Service legt die Datenbank an → Flyway migriert sie.
- Jede neue Migration läuft automatisch für alle Mandanten-Datenbanken.
- *(Prüfen: wie der Service pro Request die richtige DB wählt, z. B. mit Spring `AbstractRoutingDataSource`.)*

**Was kann schiefgehen?**
- Eine Migration klappt bei Mandant 7 nicht, bei den anderen schon. → Flyway merkt sich den Stand pro DB. Ich brauche Monitoring über alle Mandanten und einen klaren Plan für „halb migriert“.
- Zu viele Verbindungen: Jeder Pool hält Verbindungen offen. → Kleine Pools, eventuell PgBouncer.
- Der Mandanten-Kontext fehlt in einem Async-Thread. → Kontext explizit weitergeben, nie nur in einer ThreadLocal hoffen.

**Fallen bei RLS:**
- Der Besitzer der Tabelle und Superuser umgehen RLS. → Die App nutzt eine eigene Rolle, oder `FORCE ROW LEVEL SECURITY`.
- Mit Connection Pool `SET LOCAL` benutzen, nicht `SET`. Sonst bleibt der Wert für den nächsten Request auf der Verbindung.
- Jeder Index sollte mit `tenant_id` beginnen.

**Meine Faustregel:**
- Wenige, große Mandanten mit sensiblen Daten (Behörden, Gesundheit) → DB pro Mandant.
- Viele kleine Mandanten (SaaS) → gemeinsame Tabellen mit RLS.
- Dazwischen → Schema pro Mandant.

## Follow-ups
- Wie löschen Sie alle Daten eines Mandanten? → Bei DB pro Mandant: die DB löschen. Bei gemeinsamen Tabellen: viele `DELETE`s, schwer zu beweisen.
- Wie machen Sie Auswertungen über alle Mandanten? → Bei getrennten DBs schwer. Dann ein eigener Export in ein Reporting-System.
- Kann ein Mandant die anderen langsam machen? → Bei gemeinsamer DB ja (Noisy Neighbour). Eigene DBs oder Limits helfen.
- Wie testen Sie die Isolation? → Ein Test mit zwei Mandanten: Mandant A darf nie Daten von B sehen. *(Prüfen: ob es so einen Test bei DigiSanté gibt.)*

## Don't say
- „Ein `WHERE tenant_id = ?` in jeder Abfrage reicht.“ Ein vergessener Filter ist ein Datenleck.
- Nicht behaupten, DB pro Mandant sei immer am besten. Bei 10 000 Mandanten ist es zu teuer.

## Words
- **Mandant** = tenant
- **zur Laufzeit** = at runtime
- **Trennung** = separation, isolation
- **Datenleck** = data leak
- **Noisy Neighbour** = ein Mandant stört die anderen
