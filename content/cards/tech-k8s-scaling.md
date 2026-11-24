---
id: tech-k8s-scaling
round: tech
tech: [k8s]
tier: 2
project: MATCH (Karpenter für Spark-Spitzen)
q: Wie skaliert man in Kubernetes? Was ist der Unterschied zwischen HPA und Karpenter?
en: How do you scale in Kubernetes? What is the difference between HPA and Karpenter?
---
## 30s
Es gibt zwei Ebenen: Pods und Nodes.
Der HPA skaliert Pods. Er startet mehr Replicas, wenn zum Beispiel die CPU hoch ist.
Karpenter skaliert Nodes. Er startet neue Maschinen, wenn Pods keinen Platz finden.
Danach entfernt er leere Nodes wieder. Das spart Geld.
Bei MATCH nutzen wir Karpenter, weil Spark stoßweise läuft.
Die Nodes skalieren hoch und danach wieder herunter.
Soll ich zeigen, wie beide zusammenarbeiten?

## 90s
**HPA (Horizontal Pod Autoscaler):**
```
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: api }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: api }
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target: { type: Utilization, averageUtilization: 70 }
```
Laut gesagt: „Der HPA rechnet die CPU relativ zum Request. Ohne Request kann er nicht skalieren.“

**Zusammenspiel:**
1. Last steigt → HPA erhöht die Replicas.
2. Neue Pods passen nicht auf die Nodes → sie sind **Pending**.
3. Karpenter sieht die Pending-Pods, wählt einen passenden VM-Typ und startet einen Node.
4. Last sinkt → HPA reduziert Pods → Karpenter fasst Pods zusammen und entfernt leere Nodes (Consolidation).

## 3min
**Karpenter gegen Cluster Autoscaler:**
- Der Cluster Autoscaler vergrößert feste Node Pools. Die VM-Größe ist vorher festgelegt.
- Karpenter wählt die VM-Größe passend zu den Pending-Pods. Er ist schneller und packt dichter.
- Auf AKS gibt es Karpenter als „Node Auto Provisioning“. *(Prüfen: ob MATCH NAP oder eine eigene Karpenter-Installation nutzt.)*

**Spark bei MATCH:** Ein Spark-Job braucht für kurze Zeit viele Executors. Ein HPA passt hier nicht. Der Job selbst bestimmt die Anzahl Pods. Darum skaliert bei uns die Node-Ebene mit Karpenter: hoch für den Job, danach wieder herunter.

**Andere Skalierer:**
- **VPA:** passt Requests und Limits an. Nicht mit HPA auf derselben Metrik (CPU) kombinieren.
- **KEDA:** skaliert nach Events, zum Beispiel Länge einer Queue oder Consumer Lag. Kann auf 0 Pods gehen. Gut für Worker.

**Was kann schiefgehen?**
- Requests zu klein → HPA rechnet falsch, und Nodes sind überbucht.
- Consolidation stoppt Pods mitten in einem Job → `PodDisruptionBudget` oder die Annotation `karpenter.sh/do-not-disrupt` für laufende Spark-Pods.
- Neue Nodes brauchen Zeit (Minuten). Bei plötzlichen Spitzen hilft etwas Reserve.
- Kosten laufen weg → ein Limit für CPU und Memory im NodePool setzen.

**Monitoring:** Bei MATCH beobachten wir in Grafana die Job-Dauern und den Rückstau an Pending-Nachrichten. Wächst der Rückstau, reicht die Kapazität nicht.

## Follow-ups
- Was braucht der HPA? → Den Metrics Server und gesetzte Requests. Für eigene Metriken einen Adapter, zum Beispiel für Prometheus.
- Warum skaliert mein HPA nicht? → Keine Requests, Metrics Server fehlt, oder `maxReplicas` erreicht. `kubectl describe hpa` zeigt es.
- Wie skaliert man einen Kafka-Consumer? → Mit KEDA auf den Consumer Lag. Aber nur bis zur Anzahl Partitionen.
- Was ist ein PodDisruptionBudget? → Es sagt, wie viele Pods gleichzeitig weg sein dürfen. Es schützt bei Node-Wartung und Consolidation.

## Don't say
- „HPA startet neue Nodes.“ Der HPA skaliert nur Pods.
- „Autoscaling ersetzt Kapazitätsplanung.“ Limits und Kosten muss man trotzdem planen.

## Words
- **Ebene** = level, layer
- **stoßweise** = bursty
- **zusammenfassen** = to consolidate
- **überbucht** = overcommitted
- **Spitze** = peak
