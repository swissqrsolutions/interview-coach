---
id: critique-single-db
round: critique
tech: [postgres, azure, observability]
tier: 1
project: ElCom MATCH (analytics on the operational DB)
q: Hier ist unsere Architektur. Was ist falsch daran?
en: Here is our architecture. What is wrong with it?
---
## 30s
**Die Architektur (als Text):**
```
Web-App (3 Instanzen) ──┐
Reporting-Jobs (nachts) ─┼──> 1 PostgreSQL-VM (keine Replica)
Admin-Tool ─────────────┘     Backup: wöchentlich, gleiche VM
```
Ich prüfe in meiner Reihenfolge. Das grösste Problem ist die Verfügbarkeit.
Die eine Datenbank ist ein Single Point of Failure. Fällt die VM aus, steht alles.
Dazu das Backup auf derselben VM. Ist die Platte kaputt, ist auch das Backup weg.
Und die Reporting-Jobs bremsen die Web-App, weil alle auf derselben Datenbank laufen.
Das kenne ich aus MATCH: Dort hat die Analyse die operative Datenbank belastet.
Soll ich alle Punkte der Reihe nach durchgehen?

## 90s
**Meine Liste mit Fix und Trade-off:**
1. **Verfügbarkeit:** Eine Instanz. → Managed PostgreSQL mit Hochverfügbarkeit (Standby in einer anderen Zone) oder Patroni. *Trade-off:* etwa doppelte Kosten, aber automatisches Failover.
2. **Sicherheit:** Teilen sich alle Clients einen DB-User? → Ein User pro Anwendung mit minimalen Rechten. Reporting nur lesend. Verbindung mit TLS.
3. **Konsistenz / Daten:** Backup wöchentlich, gleiche VM. → Tägliche Backups plus WAL-Archivierung (Point-in-Time-Recovery), an einem anderen Ort. Restore regelmässig testen. *Trade-off:* Speicherkosten.
4. **Kopplung:** Drei Anwendungen auf demselben Schema. Jede Schema-Änderung kann alle brechen. → Klare Besitzer pro Schema, Zugriff für andere über eine API oder Views.
5. **Skalierung:** Reporting und Web auf derselben DB. → Read Replica für Reporting. Bei sehr grossen Daten ein eigenes analytisches System. *Trade-off:* Replica ist kurz verzögert.
6. **Monitoring:** Nichts gezeigt. → Metriken für Verbindungen, langsame Queries, Replikations-Lag, Plattenplatz. Alarm vor dem Vollwerden.
7. **Kosten:** Eine VM ist billig. HA und Replica kosten mehr. Ich zeige den Preis von einer Stunde Ausfall dagegen.

## 3min
**Wie ich priorisiere:** Nicht alles auf einmal. Zuerst das Backup an einen anderen Ort und einen Restore-Test. Das ist billig und rettet die Daten. Dann HA. Dann die Replica für Reporting.

**Fragen, die ich dem Panel stelle:**
- Wie lange darf das System ausfallen? (RTO)
- Wie viele Daten dürfen verloren gehen? (RPO)
- Wie gross ist die Datenbank, und wie lange laufen die Reports?
Die Antworten bestimmen die Lösung. Bei RPO von einem Tag reicht ein tägliches Backup. Bei RPO nahe null braucht es synchrone Replikation.

**Read Replica: Was kann schiefgehen?** Die Replica ist ein paar Sekunden hinten. Ein Nutzer speichert und sieht seine Daten nicht sofort. Darum lese ich nach dem Schreiben vom Primary. Reports sind okay mit kleinem Lag.

**Aus meiner Praxis:** Bei MATCH lag alles in SQL Server. Die Statistik wurde in .NET Zeile für Zeile gerechnet. Bei 250M+ Zeilen hat das nicht skaliert. Die Analyse hat die operative Datenbank belastet. Wir haben die Analyse in ein Iceberg-Lakehouse verschoben. Das ist der gleiche Gedanke: Lesen und Analyse trennen.

**Trade-off der Trennung:** Zwei Systeme heisst zwei Wahrheiten. Ich brauche einen klaren Datenfluss und eine Prüfung, dass die Zahlen gleich sind. Bei MATCH war das der Parity-Job.

## Follow-ups
- Was ist der Unterschied zwischen Backup und Replica? → Eine Replica kopiert auch Fehler sofort, zum Beispiel ein `DELETE` ohne `WHERE`. Nur ein Backup mit Point-in-Time-Recovery hilft dann.
- Was sind RTO und RPO? → RTO: wie schnell wieder online. RPO: wie viele Daten maximal verloren gehen.
- Warum nicht gleich sharden? → Sharding ist komplex. Zuerst vertikal skalieren, Indizes, Replica. Sharding erst, wenn eine Maschine wirklich nicht reicht.
- Was kostet das? → HA verdoppelt grob die DB-Kosten. *(Prüfen: konkrete Preise des Cloud-Anbieters.)* Ich vergleiche mit den Kosten eines Ausfalls.

## Don't say
- „Wir brauchen sofort Microservices mit eigener Datenbank.“ Zu gross als erster Schritt.
- Nicht nur „Single Point of Failure“ sagen. Fix und Trade-off nennen.

## Words
- **Single Point of Failure** = one part whose failure stops everything
- **Hochverfügbarkeit (HA)** = high availability
- **Failover** = automatic switch to standby
- **Read Replica** = read-only copy
- **Wiederherstellung (Restore)** = restore from backup
