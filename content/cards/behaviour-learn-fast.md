---
id: behaviour-learn-fast
round: behaviour
tech: [spark, iceberg, lakehouse]
tier: 1
project: ElCom MATCH
q: Wie lernen Sie schnell eine neue Technologie?
en: How do you learn a new technology quickly?
---
## 30s
Ich lerne mit einem echten Problem, nicht nur mit Büchern.
Zuerst verstehe ich das Prinzip: Welches Problem löst die Technologie?
Dann baue ich lokal ein kleines Beispiel und lese die offizielle Doku.
Dann arbeite ich am echten Projekt, mit Tests als Sicherheitsnetz.
Bei MATCH habe ich mit Spark, Iceberg, Nessie und Dremio ein Lakehouse gebaut, das jetzt mit über 250 Millionen Zeilen in Produktion läuft.
*(Prüfen: Welche dieser Technologien waren für Sie neu, und wie schnell waren Sie produktiv?)*

## 90s
**Meine 5 Schritte:**
1. **Warum?** Welches Problem löst es? Iceberg zum Beispiel: Transaktionen, Snapshots und Partition Pruning auf Dateien.
2. **Kleines Beispiel lokal:** Bei MATCH läuft der ganze Stack lokal auf Rancher Desktop, mit demselben Helm-Chart.
3. **Offizielle Doku und Quellcode:** nicht nur Blogs. Die Doku ist die Wahrheit.
4. **Echtes Problem lösen:** mit Tests als Sicherheitsnetz.
5. **Erklären:** Wenn ich es dem Team einfach erklären kann, habe ich es verstanden. Zum Beispiel 10 + 3 = 13 im Sprint Review.

**KI als Hilfe:** Ich nutze KI für schnelle Erklärungen und Entwürfe. Aber ich prüfe gegen die Doku und mit Tests.

## 3min
**STAR-L:**
- **Situation:** Bei MATCH sollte ein Lakehouse neben einem .NET-System entstehen. Spark, Iceberg, Nessie, MinIO und Dremio auf Kubernetes. *(Prüfen: Was davon war neu für Sie?)*
- **Aufgabe:** Produktiv werden und eine Plattform bauen, die in Produktion läuft.
- **Aktion:** Ich habe den Stack auch lokal auf Rancher Desktop laufen lassen, mit eigenen Values. Ich habe die Prinzipien gelernt: Medallion, Hidden Partitioning, Merge-on-Read. Ich habe die PySpark-Pipelines gebaut und mit einem Parity-Test abgesichert. *(Ihr echtes Beispiel: wie viele Wochen bis zum ersten produktiven Job?)*
- **Resultat:** Lakehouse in Produktion, über 250 Millionen Zeilen, 100 % Parität mit dem alten System.
- **Lektion:** Schnell lernen heisst nicht alles lesen. Es heisst: Prinzip verstehen, früh bauen und mit Tests prüfen.

**Weitere Beispiele aus dem Profil:**
- Von Java zu PySpark und .NET-Code verstehen bei MATCH.
- Kotlin für interne Tools bei CARIAD.
- Go für den SQL-Exporter bei Flaconi.

**Für Lücken ehrlich sein:** Was ich nicht produktiv kenne, zum Beispiel Databricks oder Angular Signals, sage ich offen. Dann erkläre ich, was ich davon schon weiss, und wie ich es lernen würde.

## Follow-ups
- Was haben Sie zuletzt gelernt? → *(Ihr echtes Beispiel.)*
- Wie bleiben Sie auf dem neusten Stand? → *(Ihr echtes Beispiel: Blogs, Konferenzen, Release Notes, eigene Projekte.)*
- Wie schnell sind Sie in einem neuen Projekt produktiv? → *(Ihr echtes Beispiel.)* Ich frage früh nach der Architektur und mache eine kleine echte Aufgabe in der ersten Woche.
- Was tun Sie, wenn die Doku schlecht ist? → Quellcode und Tests der Library lesen, ein kleines Experiment bauen, im Issue-Tracker suchen.

## Don't say
- „Ich kann alles in zwei Tagen lernen.“
- „Ich schaue mir einfach ein YouTube-Video an.“

## Words
- **Sicherheitsnetz** = safety net
- **produktiv** = productive / in production
- **Lücke** = gap
- **auf dem neusten Stand** = up to date
