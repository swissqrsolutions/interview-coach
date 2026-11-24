---
id: data-databricks
round: data
tech: [databricks]
tier: 2
proof: study
project: ElCom MATCH (self-hosted lakehouse as comparison)
q: Kennen Sie Databricks? Wie vergleichen Sie es mit Ihrem Lakehouse?
en: Do you know Databricks? How does it compare to your lakehouse?
---
## 30s
Databricks ist eine Managed-Plattform für Spark und das Lakehouse.
Das Table Format ist Delta Lake. Der Katalog ist Unity Catalog, mit Rechten und Lineage.
Dazu kommen Notebooks, Jobs, SQL Warehouses und ML-Funktionen.
Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich von MATCH.
Dort habe ich ein ähnliches Lakehouse selbst gebaut: Spark, Iceberg, Nessie, MinIO, Dremio, alles auf AKS.
Soll ich die Bausteine nebeneinander stellen?

## 90s
**MATCH und Databricks nebeneinander:**
| Aufgabe | MATCH (selbst gehostet) | Databricks |
|---|---|---|
| Speicher | MinIO | ADLS / S3 |
| Table Format | Iceberg | Delta Lake (Iceberg-Lesen über UniForm) |
| Katalog | Nessie | Unity Catalog |
| Rechnen | Spark auf AKS, Karpenter skaliert | Managed Cluster, Serverless |
| Abfragen | Dremio, Arrow Flight SQL | Databricks SQL Warehouse |
| Jobs starten | .NET-Worker über Spark REST API | Databricks Jobs / Workflows |
| Deployment | Helm + ArgoCD | Asset Bundles, Terraform |

**Gleich bleibt:** Medallion, Idempotenz, Partitionierung, Compaction, Datenqualität. Das Wissen ist übertragbar.

**Delta-Befehle, die ich kenne:**
```
MERGE INTO silver.trades t USING staging s ON t.trade_id = s.trade_id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;

OPTIMIZE silver.trades ZORDER BY (product);
VACUUM silver.trades RETAIN 168 HOURS;
```
Laut gesagt: „MERGE ist ein Upsert. OPTIMIZE ist die Compaction. VACUUM löscht alte Dateien, wie `expire_snapshots` plus Aufräumen bei Iceberg.“

## 3min
**Warum bei MATCH kein Databricks?** *(Prüfen: der echte Grund.)* Aus meinen Notizen: Iceberg ist herstellerneutral, mehrere Engines können lesen. Delta ist stark auf Spark und Databricks ausgerichtet. Und das Bundesumfeld läuft bei uns selbst gehostet auf AKS.

**Vorteile Databricks:**
- Weniger Betrieb: kein eigener Katalog, keine eigenen Spark-Images.
- Photon-Engine für schnelle SQL-Abfragen.
- Auto Loader für Dateien, die laufend ankommen.
- Unity Catalog: Rechte bis auf Spalten und Zeilen, Lineage.

**Nachteile:**
- Kosten nach DBU (Databricks Units) plus Cloud-Kosten. Ohne Kontrolle teuer.
- Bindung an einen Anbieter.
- Datenstandort und Compliance müssen geklärt sein.

**Was ich von MATCH mitbringe:**
- Betrieb von Spark auf Kubernetes: Speicher, Executors, OOM.
- Den Wert des Katalogs: Bei MATCH ging Nessie auf RocksDB fast verloren, wir sind auf Postgres umgezogen. In Databricks ist der Katalog gemanagt. Das ist ein echter Vorteil.
- Compaction und kleine Dateien: Das gleiche Problem, andere Befehle.

**Wie ich mich einarbeiten würde:** Ein kleines Projekt mit Delta, Unity Catalog und einem Job. Die Unterschiede zu Iceberg bewusst notieren.

## Follow-ups
- Delta oder Iceberg? → Beide geben ACID, Time Travel und Schema Evolution. Iceberg ist offener für viele Engines. Delta ist in Databricks am besten integriert.
- Was ist Unity Catalog? → Ein zentraler Katalog für Tabellen, Dateien und ML-Modelle. Mit Rechten, Audit und Lineage.
- Was ist Z-Ordering? → Daten nach mehreren Spalten zusammen sortieren. Dann überspringt die Abfrage mehr Dateien. Neuer ist Liquid Clustering.
- Was ist Auto Loader? → Er erkennt neue Dateien im Storage und lädt sie inkrementell, mit Checkpoints.
- Wie kontrollieren Sie Kosten? → Job-Cluster statt immer laufender Cluster, Auto-Termination, kleine Cluster für Entwicklung, Kosten pro Job beobachten.

## Don't say
- Nicht behaupten, Sie hätten produktiv mit Databricks gearbeitet.
- „Databricks ist nur gehostetes Spark.“ Katalog, SQL und Governance sind ein grosser Teil.

## Words
- **gemanagt** = vom Anbieter betrieben
- **die Bindung an einen Anbieter** = vendor lock-in
- **der Datenstandort** = wo die Daten physisch liegen
- **übertragbar** = transferable
- **die Einarbeitung** = onboarding
