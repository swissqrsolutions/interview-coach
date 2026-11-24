---
id: phone-short-project
round: phone
tech: [lakehouse, spark, k8s]
tier: 1
project: ElCom MATCH
q: Was machen Sie aktuell?
en: What are you working on at the moment?
---
## 30s
Ich arbeite für Unisys als externer Consultant beim Bund in Bern.
Mein Projekt ist MATCH bei der ElCom.
Energiehändler melden dort ihre Orders und Trades.
Ich habe ein Data Lakehouse mit Apache Iceberg und Spark gebaut.
Es läuft auf Kubernetes in Azure, mit über 250 Millionen Zeilen.
Die Statistik habe ich von .NET nach PySpark portiert, mit 100 % gleichen Ergebnissen.

## 90s
**Problem vorher:** Alles war in SQL Server. Die Statistik lief Zeile für Zeile in .NET. Bei 250 Millionen Zeilen hat das nicht mehr skaliert.

**Was ich gebaut habe:**
1. **Ingestion:** ZIP-Dateien mit XML werden entschlüsselt, geparst und nach Iceberg geschrieben. Idempotent und crash-sicher.
2. **Statistik:** sieben Rechner in PySpark. Ein Paritäts-Job vergleicht jedes Ergebnis mit dem alten System.
3. **Plattform:** ein Helm Chart für den ganzen Stack auf AKS. Deployment mit ArgoCD.
4. **Go-live:** parallel zum alten System, hinter einem Feature Switch.

**Mein Teil:** *(Prüfen: Rolle im Team, Teamgrösse.)*

## 3min
**Für 60 Sekunden am Telefon:** Nur 30s sagen. Dann fragen: „Soll ich mehr zur Architektur sagen?“

**Wenn der Recruiter mehr will, eine Entscheidung erklären:**
- **Batch statt Streaming:** Die Daten kommen als Dateien mit Fristen. Minuten Latenz reichen. Batch ist einfacher idempotent.
- **Iceberg statt Delta:** herstellerneutral. Spark schreibt, Dremio liest.

**Zweites Projekt, falls gefragt:** BAG DigiSanté. Datei-Upload mit Virenscan auf Azure, nur über Private Endpoints.

**Passt es zur Stelle?** Wählen Sie den Teil, der zum Inserat passt:
- Data-Stelle → Iceberg, Spark, Parität.
- Platform-Stelle → AKS, Helm, ArgoCD, Vault.
- Backend-Stelle → DigiSanté und DAZiT mit Spring Boot.

## Follow-ups
- Was war Ihre Rolle genau? → *(Prüfen: Ihre Rolle.)* Ich habe die Statistik-Engine und die ETL-Pipelines in PySpark gebaut.
- Wie gross ist das Team? → *(Ihr echtes Beispiel: Teamgrösse.)*
- Ist das noch in Betrieb? → Ja, produktiv, mit über 250 Millionen Zeilen.
- Warum nicht Databricks? → Wir laufen auf eigenem AKS. Iceberg ist herstellerneutral, mehrere Engines lesen dieselben Tabellen.

## Don't say
- Nicht mit allen 20 Tools anfangen. Erst Problem, dann Lösung, dann Zahl.
- Nicht „wir“ für alles. Sagen Sie klar, was Sie selbst gebaut haben.

## Words
- **der Energiehändler** = energy trader
- **die Parität** = parity (same results as before)
- **portieren** = to port (move code to another language)
- **crash-sicher** = safe if the job crashes
