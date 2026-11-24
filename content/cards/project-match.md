---
id: project-match
round: project
tech: [lakehouse, spark, iceberg, dremio, k8s, gitops]
tier: 1
project: ElCom MATCH
q: Erzählen Sie von Ihrem aktuellen Projekt. Zeichnen Sie die Architektur.
en: Tell me about your current project. Draw the architecture.
---
## 30s
Bei der ElCom melden Energiefirmen ihre Handelsdaten.
Das alte System war .NET mit SQL Server.
Ich habe ein Data Lakehouse daneben gebaut.
Spark verarbeitet die Daten, Iceberg speichert sie, Dremio fragt sie ab.
Alles läuft auf Kubernetes in Azure, mit über 250 Millionen Zeilen.
Wir sind live gegangen, parallel zum alten System, mit einem Feature-Switch.

## 90s
**Der Datenfluss (von links nach rechts zeichnen):**
1. Die Firmen schicken ZIP-Dateien mit XML. Die ZIPs haben ein Passwort.
2. **Bronze:** Das rohe XML wird gespeichert.
3. **Silver:** Ein PySpark-Job entschlüsselt, parst und schreibt Records in Iceberg-Tabellen.
4. **Gold:** Ein zweiter Job rechnet die Statistik. Sieben Rechner, von .NET nach PySpark portiert.
5. **Abfrage:** Dremio liest Iceberg über Arrow Flight. Die Web-UI zeigt Tabellen und Charts.

**Die Bausteine:** MinIO als S3-Speicher, Nessie als Iceberg-Katalog, Spark-Jobs auf AKS.

**Mein Teil:** die PySpark-Pipelines, die Statistik-Portierung, das Helm-Chart für den ganzen Stack und das GitOps-Deployment mit ArgoCD.

**Die Zahl:** 100 % gleiche Ergebnisse wie das alte System. Das war die Bedingung für den Go-Live.

## 3min
**Drei Entscheidungen und warum:**
1. **Iceberg statt nur Parquet-Dateien:** Iceberg gibt uns Transaktionen, Snapshots und Partition Pruning. Bei 250 Millionen Zeilen darf eine Abfrage nicht alles lesen.
2. **Ergebnis ersetzen statt addieren:** Ein Statistik-Job rechnet einen ganzen Tag neu und überschreibt ihn. Läuft der Job zweimal, ist das Ergebnis gleich. Das ist idempotent.
3. **Jobs nur bei Arbeit starten:** Ein .NET-Worker startet Spark nur, wenn neue Meldungen da sind. Er übernimmt eine Meldung atomar, mit SQL. So nehmen zwei Worker nie dieselbe Meldung.

**Ein schweres Problem:** Die Ergebnisse waren am Anfang nicht gleich. Ursachen: .NET und Spark lesen Zahlen, Datumswerte und leere Felder anders. Dazu kam die Zeitzone von received_date. Ich habe fünf Extractor-Bugs gefunden und behoben. Dann habe ich einen automatischen Parity-Job gebaut.

**Was ich heute anders machen würde:** *(Beispiel, durch Ihre echte Antwort ersetzen.)* Früher Daten-Qualitätsregeln einbauen, zum Beispiel mit Great Expectations. Und früher Monitoring für die Spark-Jobs.

**Plattform:** AKS mit Terraform. Cilium für Network Policies, Kyverno für Regeln, Karpenter skaliert Nodes für Spark-Spitzen. Secrets aus Vault und Azure Key Vault, nie im Repo.

## Follow-ups
- Warum Iceberg und nicht Delta Lake? → Iceberg ist herstellerneutral. Spark schreibt, Dremio liest. Dazu kommen Hidden Partitioning und Schema Evolution. Delta Lake ist stark auf Spark und Databricks ausgerichtet.
- Warum Nessie? → Nessie ist ein Katalog mit Git-ähnlichen Branches für Tabellen. Er läuft selbst gehostet auf Kubernetes.
- Wie haben Sie die 100 % Parität bewiesen? → Gleiche Eingabe in beide Systeme, dann die Ergebnisse Zeile für Zeile verglichen, als automatischer Test.
- Was passiert, wenn ein Job zweimal läuft? → Nichts Schlimmes: Er überschreibt das Ergebnis für den Tag. Es wird nicht doppelt gezählt.
- Wie partitionieren Sie? → Nach days(received_date) und schema_type. Die Abfragen filtern fast immer nach Zeit und Meldungstyp. So liest Iceberg nur die nötigen Dateien.
- Wie verhindern Sie Duplikate? → Zuerst ein atomarer Claim mit UPDATE … OUTPUT. Dann DELETE für die message_id und APPEND, in einer Iceberg-Transaktion.
- Warum Batch und nicht Streaming? → Die Firmen schicken Dateien zu Fristen. Minuten reichen. Batch ist viel einfacher idempotent zu machen.
- Was war Ihr Anteil, was das Team? → Sagen Sie klar „ich“ für Ihre Teile und „wir“ für das Team.

## Don't say
- Nicht nur die Tool-Namen aufzählen. Immer sagen, welches Problem das Tool löst.
- Nicht „wir“ für alles sagen. Der Interviewer will wissen, was Sie gemacht haben.

## Words
- **Feature-Switch** = Schalter für alte oder neue Version
- **Partition Pruning** = nur die nötigen Teile lesen
- **atomar** = ganz oder gar nicht
- **Parität** = gleiche Ergebnisse
