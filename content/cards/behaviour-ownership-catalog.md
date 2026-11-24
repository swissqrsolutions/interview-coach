---
id: behaviour-ownership-catalog
round: behaviour
tech: [dremio, iceberg, k8s, postgres]
tier: 2
project: ElCom MATCH
q: Erzählen Sie von einer Situation, in der Sie Verantwortung übernommen haben, obwohl es nicht Ihre Aufgabe war.
en: Tell me about a time you took ownership even though it was not your task.
---
## 30s
Bei MATCH ist Nessie der Katalog für alle Iceberg-Tabellen.
Nessie lief zuerst mit RocksDB, eingebettet im Pod.
Bei einem Pod-Reschedule konnte der Zustand verloren gehen.
Ohne Katalog weiss niemand mehr, welcher Snapshot aktuell ist.
Ich habe Nessie auf ein Postgres-Backend umgestellt.
Meine Lektion: Der Katalog ist der wertvollste Teil eines Lakehouse.
*(Prüfen: War das ausserhalb Ihrer Aufgabe? Sonst die Frage als „Verantwortung für Betrieb“ beantworten.)*

## 90s
**Warum ist der Katalog so wichtig?**
- Die Daten liegen als Parquet-Dateien in MinIO.
- Iceberg speichert Metadaten-Dateien: Snapshots, Manifeste, Schema.
- Der Katalog zeigt auf die aktuelle Metadaten-Datei jeder Tabelle.
- Ist der Katalog weg, liegen die Dateien noch da. Aber niemand weiss, welcher Stand gilt.

**Was ich gemacht habe:**
1. Das Risiko erkannt: RocksDB im Pod, Zustand nur lokal.
2. Nessie auf ein Postgres-Backend umgestellt.
3. *(Ihr echtes Beispiel: Wie haben Sie die bestehenden Einträge übernommen? Wie getestet?)*

## 3min
**STAR-L:**
- **Situation:** Bei MATCH lief das Lakehouse auf AKS. Nessie nutzte eingebettetes RocksDB.
- **Aufgabe:** *(Prüfen: Wer war zuständig? Wie haben Sie das Risiko entdeckt?)* Der Katalog musste einen Pod-Reschedule überleben.
- **Aktion:** Ich habe das Risiko dem Team gezeigt. Ich habe Nessie auf ein Postgres-Backend umgestellt. *(Ihr echtes Beispiel: Migration, Test, Backup.)*
- **Resultat:** Der Katalog überlebt jetzt Neustarts und Reschedules. *(Ihr echtes Beispiel mit Zahl.)*
- **Lektion:** Der Katalog ist der wertvollste Teil eines Lakehouse. Bei jedem Stateful-Dienst frage ich: Wo liegt der Zustand, und gibt es ein Backup?

**Warum das Ownership zeigt:**
- Ich habe nicht gewartet, bis Daten verloren gehen.
- Ich habe nicht nur gewarnt, sondern es gelöst.

**Andere Ownership-Beispiele aus dem Profil:**
- Rancher Desktop: Die VM-Disk wuchs, C: war voll, MinIO hat Schreibzugriffe abgelehnt. Diagnose: MinIO-Fehler → Disk → VM-Image. Fix: vhdx komprimiert.
- CI OOM: SQL-Container begrenzt, schwere Tests seriell.

**Trade-off:** Ein Postgres-Backend ist eine weitere Datenbank im Betrieb. Aber Backup und Wiederherstellung sind damit Standard.

## Follow-ups
- Warum nicht einfach ein Persistent Volume für RocksDB? → Das hätte den Reschedule-Fall gelöst. Aber Postgres gibt Backups, Monitoring und Standard-Betrieb. *(Prüfen: Wurde ein PV diskutiert?)*
- Was speichert Nessie genau? → Für jede Tabelle den Zeiger auf die aktuelle Iceberg-Metadaten-Datei, dazu Branches und Commits wie in Git.
- Was passiert mit den Daten, wenn der Katalog weg ist? → Die Dateien liegen noch in MinIO. Man kann Tabellen mit register_table wieder anmelden. Aber das ist mühsam und fehleranfällig.
- Wie sichern Sie den Katalog heute? → *(Prüfen: Backup-Strategie für die Postgres-Datenbank.)*

## Don't say
- „Das war nicht mein Job, aber ich habe es trotzdem gemacht.“ Das klingt vorwurfsvoll.
- Nicht übertreiben: Sagen Sie nur „Daten verloren“, wenn das wirklich passiert ist.

## Words
- **Verantwortung übernehmen** = take ownership
- **Zeiger** = pointer
- **Wiederherstellung** = restore
- **mühsam** = tedious
- **Zustand** = state
