---
id: project-digisante-tenants
round: project
tech: [postgres, hibernate, spring, federal]
tier: 1
project: BAG DigiSanté
q: Wie haben Sie die Mandantentrennung im Personen-Service gelöst?
en: How did you solve tenant isolation in the person service?
---
## 30s
Der Personen-Service gibt Zugriff auf AHV-Personendaten über ZAS/UPI.
Jeder Mandant darf nur seine eigenen Daten sehen.
Darum hat jeder Mandant eine eigene PostgreSQL-Datenbank.
Die Datenbank wird zur Laufzeit erstellt.
Flyway-Migrationen laufen automatisch pro Mandant.
So haben wir eine volle Schema-Isolation.
Soll ich erklären, warum wir nicht eine gemeinsame Datenbank genommen haben?

## 90s
**Drei Modelle für Mandanten:**
1. Eine Datenbank, eine Spalte `tenant_id` in jeder Tabelle. Billig, aber ein vergessener Filter zeigt fremde Daten.
2. Eine Datenbank, ein Schema pro Mandant. Mittlere Trennung.
3. **Eine Datenbank pro Mandant.** Stärkste Trennung. Das haben wir gewählt.

**Der Ablauf bei einem neuen Mandanten:**
1. Der Service erstellt die Datenbank zur Laufzeit.
2. Flyway führt alle Migrationen für diese Datenbank aus.
3. Danach kann der Mandant Daten nutzen.

**Pro Request (typisches Muster in Spring):** Der Mandant kommt aus dem Token. Ein Routing wählt die passende DataSource. *(Prüfen: Wie genau wurde die Verbindung pro Mandant gewählt?)*

```
Flyway.configure()
      .dataSource(tenantDataSource)
      .load()
      .migrate();
```

## 3min
**Warum Datenbank pro Mandant?**
- Es sind AHV-Personendaten. Sie sind sehr sensibel. Datenschutz (DSG) ist zentral.
- Ein Fehler im Code kann nicht zu fremden Daten führen. Die Verbindung zeigt nur auf eine Datenbank.
- Löschen oder Sichern pro Mandant ist einfach.

**Trade-offs:**
- Mehr Datenbanken heisst mehr Verbindungen. Jeder Mandant braucht einen Connection Pool. Bei vielen Mandanten wird das teuer.
- Migrationen laufen viele Male. Schlägt eine fehl, ist ein Mandant auf einer anderen Version. Das muss man sehen und reparieren können.
- Abfragen über alle Mandanten sind schwer. Für Berichte braucht es einen anderen Weg.

**Wann würde ich es anders machen?**
Bei Tausenden kleinen Mandanten mit wenig sensiblen Daten: eine Datenbank mit `tenant_id` und Row-Level Security in PostgreSQL.

**Was schiefgehen kann:**
- Migration fehlschlägt bei einem Mandanten → *(Prüfen: Wie haben Sie das erkannt und behandelt?)*
- Zu viele Verbindungen → kleine Pools pro Mandant, Pools für inaktive Mandanten schliessen. *(Prüfen: wie gelöst?)*

## Follow-ups
- Wie viele Mandanten gibt es? → *(Ihr echtes Beispiel: Anzahl Mandanten.)*
- Was ist Row-Level Security? → PostgreSQL filtert Zeilen automatisch nach einer Regel, zum Beispiel nach tenant_id. Das schützt auch bei einem vergessenen WHERE.
- Was macht Flyway genau? → Flyway führt versionierte SQL-Skripte in Reihenfolge aus. Die Tabelle flyway_schema_history merkt sich, welche schon gelaufen sind.
- Was passiert, wenn eine Migration bei Mandant 5 fehlschlägt? → Flyway stoppt für diesen Mandanten. Die anderen sind nicht betroffen. *(Prüfen: Was haben Sie dann gemacht?)*
- Was ist die AHV-Nummer und UPI? → Die AHV-Nummer ist die Sozialversicherungsnummer. UPI ist das Register der ZAS dafür.
- Wie testen Sie das? → *(Ihr echtes Beispiel: z. B. Testcontainers mit PostgreSQL.)*

## Don't say
- „Mandanten trennt man einfach mit einer tenant_id.“ Bei AHV-Daten ist das zu schwach erklärt.
- Nicht sagen, dass Daten von ZAS kopiert und gespeichert werden, wenn Sie es nicht sicher wissen.

## Words
- **Mandant** = tenant
- **zur Laufzeit** = at runtime
- **Schema-Isolation** = getrennte Tabellen pro Mandant
- **sensibel** = sensitive
- **Connection Pool** = Sammlung offener DB-Verbindungen
