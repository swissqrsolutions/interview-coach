---
id: critique-cost-trap
round: critique
tech: [azure, k8s, observability]
tier: 2
project: ElCom MATCH (Karpenter, demand-driven Spark jobs)
q: Unsere Cloud-Rechnung hat sich verdreifacht. Was ist an dieser Architektur teuer?
en: Our cloud bill has tripled. What is expensive in this architecture?
---
## 30s
**Die Architektur (als Text):**
```
AKS-Cluster: 20 grosse Nodes, 24/7, kein Autoscaling
Spark-Cluster läuft immer, auch wenn keine Daten kommen
Jede Dev-Umgebung = Kopie der Produktion, läuft am Wochenende
Alle Logs auf DEBUG, 2 Jahre Aufbewahrung
Daten fliessen zwischen zwei Regionen
```
Ich sehe fünf Kostenfallen.
Feste Kapazität für Spitzenlast. Ein Spark-Cluster, der wartet. Dev-Umgebungen, die nie schlafen. Zu viele Logs. Datenverkehr zwischen Regionen.
Fix: Autoscaling, Jobs nur bei Bedarf, Dev-Umgebungen nachts aus, Log-Level und Aufbewahrung senken.
Bei MATCH skaliert Karpenter Nodes für Spark-Spitzen hoch und wieder runter.

## 90s
**Meine Liste mit Fix und Trade-off** (Kosten im Fokus, aber in meiner Reihenfolge):
1. **Verfügbarkeit:** Nicht beim Sparen kaputt machen. Produktion behält Reserve und mehrere Zonen.
2. **Sicherheit:** Günstigere Varianten dürfen nicht auf Private Endpoints oder Verschlüsselung verzichten.
3. **Konsistenz:** Spot-Nodes können verschwinden. → Nur für Jobs, die sicher neu starten können.
4. **Kopplung:** Immer laufender Spark-Cluster, weil Jobs ihn direkt brauchen. → Jobs bei Bedarf starten.
5. **Skalierung:** 20 feste Nodes. → Cluster Autoscaler oder Karpenter, Pod-Requests richtig setzen, HPA für Services. *Trade-off:* Kaltstart dauert ein paar Minuten.
6. **Monitoring:** Kosten sind nicht sichtbar. → Kosten pro Team und Umgebung über Tags und Labels. Budget-Alarme.
7. **Kosten:**
   - Dev und Test nachts und am Wochenende herunterfahren.
   - Logs: INFO statt DEBUG, kurze Aufbewahrung, alte Logs ins Archiv.
   - Datenverkehr: Dienste in derselben Region, Private Endpoints statt Umweg über das Internet.
   - Reservierungen oder Savings Plans für die feste Grundlast.

## 3min
**Wie ich vorgehe:** Erst messen, dann sparen. Die Cost-Analyse des Cloud-Anbieters nach Dienst sortieren. Meist machen zwei, drei Posten den Grossteil aus. Dort fange ich an.

**Rechtsgrösse (Right-Sizing):** Pods fordern oft viel mehr CPU und Speicher an, als sie brauchen. Der Scheduler reserviert es trotzdem. Prometheus zeigt die echte Nutzung. Requests anpassen spart Nodes.

**Aus meiner Praxis, MATCH:**
- Ein .NET-Worker schickt Spark-Jobs über die REST-API nur, wenn Arbeit wartet. Kein Spark läuft auf Vorrat.
- Spark ist stossweise. Karpenter skaliert Nodes für die Spitzen hoch und danach wieder runter.
- Kleine Dateien kosten bei Iceberg Rechenzeit und Speicher. Darum Compaction mit `rewrite_data_files` und alte Snapshots mit `expire_snapshots` löschen.
- Batch statt Streaming: Die Daten kommen als Dateien mit Fristen. Minuten Latenz reichen. Batch ist einfacher und billiger.

**Versteckte Kosten:** NAT-Gateway-Verkehr, Log-Ingestion, Snapshots, die niemand löscht, öffentliche IPs, ungenutzte Disks nach gelöschten VMs.

**Trade-off:** Jedes Sparen kostet etwas: Kaltstart-Zeit, weniger Reserve, mehr Komplexität. Ich nenne das offen und lasse das Team entscheiden, mit Zahlen.

## Follow-ups
- Was sind Spot-Instanzen? → Günstige Rechenkapazität, die der Anbieter jederzeit zurücknehmen kann. Gut für Batch-Jobs, die neu starten können.
- Warum ist Batch hier günstiger als Streaming? → Streaming läuft immer. Batch läuft nur, wenn Daten da sind. Wenn Minuten Latenz reichen, ist Batch billiger und einfacher.
- Wie verteilen Sie Kosten auf Teams? → Tags in Azure, Labels und Namespaces in Kubernetes, dann Kostenberichte pro Tag. Das schafft Verantwortung.
- Was ist FinOps? → Kosten als gemeinsame Verantwortung von Technik und Finanzen. Messen, zuordnen, optimieren, regelmässig.

## Don't say
- „Wir schalten einfach die Hälfte der Nodes ab.“ Ohne Messung riskiert man Ausfälle.
- Nicht nur Rechenkosten ansehen. Logs und Datenverkehr sind oft überraschend teuer.

## Words
- **Kostenfalle** = cost trap
- **Grundlast / Spitzenlast** = base load / peak load
- **Rechtsgrösse (Right-Sizing)** = matching resources to real use
- **herunterfahren** = to shut down
- **stossweise** = bursty
