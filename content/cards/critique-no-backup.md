---
id: critique-no-backup
round: critique
tech: [postgres, k8s, azure]
tier: 2
project: ElCom MATCH (Nessie on RocksDB → Postgres)
q: Wir haben keine Backups, weil die Datenbank in Kubernetes repliziert ist. Ist das okay?
en: We have no backups because the database is replicated in Kubernetes. Is that okay?
---
## 30s
**Die Architektur (als Text):**
```
PostgreSQL als StatefulSet in Kubernetes, 1 Primary + 1 Replica
Daten auf Persistent Volumes im selben Cluster
Backup: keins ("wir haben ja eine Replica")
Restore: nie getestet
```
Nein, das ist nicht okay. Eine Replica ist kein Backup.
Ein falsches `DELETE` oder ein Bug wird sofort auf die Replica kopiert.
Ransomware oder ein gelöschter Cluster trifft beide Kopien.
Fix: Backups an einem anderen Ort, mit Point-in-Time-Recovery. Und den Restore regelmässig testen.
Ein ungetestetes Backup ist nur eine Hoffnung.

## 90s
**Meine Liste mit Fix und Trade-off:**
1. **Verfügbarkeit:** Ohne Backup kein Weg zurück nach einem Datenverlust. → Tägliches Basis-Backup plus WAL-Archivierung, zum Beispiel mit pgBackRest oder einem Operator wie CloudNativePG. Ziel: Object Storage in einer anderen Region.
2. **Sicherheit:** Backups enthalten alle Daten. → Verschlüsselt, eigene Zugriffsrechte, unveränderlich (Immutable Storage), damit Ransomware sie nicht löscht.
3. **Konsistenz:** Ein Volume-Snapshot während Schreibvorgängen ist evtl. nicht konsistent. → Datenbank-native Backups nutzen.
4. **Kopplung:** Backup im selben Cluster und Account hängt am selben Risiko. → Anderer Ort, anderer Account.
5. **Skalierung:** Grosse DB, langer Restore. → Restore-Zeit messen. Inkrementelle Backups.
6. **Monitoring:** Läuft das Backup überhaupt? → Alarm, wenn das letzte erfolgreiche Backup älter als 26 Stunden ist.
7. **Kosten:** Speicher für Backups und WAL. → Aufbewahrung nach Bedarf, ältere Backups in günstigen Storage.

**Oder einfacher:** Ein gemanagter Dienst wie Azure Database for PostgreSQL. Backups und PITR sind eingebaut. *Trade-off:* weniger Kontrolle, aber weniger Betrieb.

## 3min
**Die Fragen ans Panel:** Was ist das RPO, wie viele Daten dürfen verloren gehen? Was ist das RTO, wie schnell müssen wir zurück? Gibt es gesetzliche Aufbewahrungsfristen?

**Die 3-2-1-Regel:** 3 Kopien, 2 verschiedene Medien, 1 Kopie an einem anderen Ort. Heute oft dazu: eine Kopie unveränderlich.

**Restore-Test als Routine:** Einmal pro Monat in eine Test-Umgebung wiederherstellen. Automatisch prüfen: Startet die DB? Stimmen die Zeilenzahlen? Wie lange hat es gedauert? Das ist dann die echte RTO.

**Nicht nur die Datenbank:** Auch Konfiguration, Secrets-Stores, Kataloge, Object Storage. Mit GitOps liegt die Konfiguration im Git. Die Daten aber nicht.

**Aus meiner Praxis, MATCH:** Nessie, der Katalog des Lakehouses, lief zuerst auf eingebettetem RocksDB. Bei einem Pod-Reschedule konnte der Zustand verloren gehen. Wir haben Nessie auf ein Postgres-Backend umgestellt. Die Lektion: Der Katalog ist der wertvollste Teil eines Lakehouses. Ohne ihn sind die Parquet-Dateien nur Dateien ohne Tabellen.

**Trade-off:** Datenbanken in Kubernetes selbst betreiben gibt Kontrolle, kostet aber viel Wissen: Backups, Upgrades, Failover. Für viele Teams ist ein gemanagter Dienst günstiger in der Summe.

## Follow-ups
- Was ist Point-in-Time-Recovery? → Basis-Backup plus alle WAL-Dateien. So kann ich auf jede Sekunde zurück, zum Beispiel kurz vor dem falschen `DELETE`.
- Reicht ein Volume-Snapshot? → Oft nicht konsistent, und meist im selben Account. Als Ergänzung okay, nicht als einziges Backup.
- Wie oft testen Sie den Restore? → Regelmässig und automatisch, zum Beispiel monatlich. *(Ihr echtes Beispiel: …)*
- Was ist der Unterschied zwischen HA und Backup? → HA schützt vor Ausfall einer Maschine. Backup schützt vor Datenverlust und Fehlern. Man braucht beides.

## Don't say
- „Wir haben RAID, also ist alles gesichert.“
- „Backups laufen, das sehe ich im Cronjob.“ Ohne Restore-Test weiss man es nicht.

## Words
- **Wiederherstellung** = restore
- **Point-in-Time-Recovery (PITR)** = restore to an exact time
- **unveränderlich** = immutable
- **Aufbewahrungsfrist** = retention period
- **Katalog** = catalog (table metadata)
