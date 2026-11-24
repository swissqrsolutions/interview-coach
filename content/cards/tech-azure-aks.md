---
id: tech-azure-aks
round: tech
tech: [azure, k8s]
tier: 2
project: MATCH (AKS mit Terraform, Cilium, Kyverno, Karpenter, ACR)
q: Was ist AKS, und wie haben Sie Ihren Cluster aufgebaut und betrieben?
en: What is AKS, and how did you build and run your cluster?
---
## 30s
AKS ist der verwaltete Kubernetes-Dienst von Azure.
Azure betreibt die Control Plane. Wir kümmern uns um Nodes, Workloads und Upgrades.
Bei MATCH läuft der ganze Lakehouse-Stack auf AKS: Spark, Nessie, MinIO, Dremio, dazu API, WebUI und Worker.
Den Cluster haben wir mit Terraform aufgebaut. Die Images kommen aus der Azure Container Registry.
Im Cluster: Cilium für Netzwerk-Policies, Kyverno für Regeln, Karpenter für Nodes, Prometheus und Grafana für Monitoring.
Soll ich die Bausteine einzeln erklären?

## 90s
**Die Bausteine bei MATCH:**
- **Provisionierung:** Terraform für AKS. Deployments mit einem Helm Chart über ArgoCD.
- **Registry:** Azure Container Registry. Kyverno erlaubt nur Images aus unserer ACR.
- **Netzwerk:** Cilium als CNI mit Network Policies. Sie regeln, welche Pods mit MSSQL, MinIO und Vault sprechen dürfen. Hubble zeigt die Flows.
- **Policies:** Kyverno: nur ACR-Images, keine privilegierten Pods, Pflicht-Labels und Resource Limits.
- **Skalierung:** Karpenter für Spark-Spitzen. Nodes kommen und gehen wieder.
- **Secrets:** Vault und External Secrets Operator, Azure Key Vault über Workload Identity.
- **Monitoring:** Prometheus und Grafana: Job-Dauern, Rückstau an Pending-Nachrichten, Pod-Neustarts.

Laut gesagt: „Der Cluster ist kein Haustier. Alles ist Code: Terraform, Helm, ArgoCD und Policies.“

**Network Policy (Beispiel, Prinzip):**
```
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: minio-allow-spark }
spec:
  podSelector: { matchLabels: { app: minio } }
  ingress:
    - from:
        - podSelector: { matchLabels: { app: spark } }
```

## 3min
**Was AKS gut macht:**
- Control Plane wird verwaltet und ist hoch verfügbar (je nach Tier).
- Integration mit Entra ID, ACR, Azure Monitor, Key Vault.
- Upgrades für Kubernetes und Node-Images per Klick oder automatisch.

**Was wir selbst tun müssen:**
- **Upgrades:** Kubernetes-Versionen haben eine begrenzte Support-Zeit. Erst in einer Testumgebung, dann Produktion. Vorher veraltete APIs prüfen.
- **System- und User-Node-Pools trennen:** Systempods nicht neben schweren Spark-Executors.
- **Kosten:** Nodes laufen, auch wenn nichts passiert. Darum Karpenter.
- **Speicher:** Persistent Volumes mit Azure Disk sind an eine Zone gebunden. Das beachten bei StatefulSets.

**Lektion aus MATCH:** Nessie lief zuerst mit eingebettetem RocksDB. Bei einem Pod-Reschedule konnte der Zustand verloren gehen. Wir haben Nessie auf ein Postgres-Backend umgestellt. Lektion: Der Katalog ist der wertvollste Teil eines Lakehouse. Zustand gehört in einen echten, gesicherten Speicher.

**Lokal gleich wie Produktion:** Dasselbe Helm Chart läuft lokal auf Rancher Desktop (NodePort) und auf AKS (LoadBalancer). Nur die values-Dateien unterscheiden sich.

**Alternative:** Für wenige einfache Services sind Azure Container Apps billiger und weniger Betrieb. Für einen Stack mit Spark, Datenbanken und eigenen Policies ist AKS besser.

## Follow-ups
- Was ist die Control Plane? → API Server, etcd, Scheduler und Controller. Bei AKS betreibt Azure sie.
- Wie greift AKS auf die ACR zu? → Die Kubelet-Identität bekommt die Rolle AcrPull auf der Registry.
- Was ist Cilium? → Ein CNI auf Basis von eBPF. Es macht Netzwerk, Network Policies und Sichtbarkeit mit Hubble.
- Warum Kyverno? → Policies als Kubernetes-YAML, einfacher als Rego bei OPA Gatekeeper. *(Prüfen: Ihre echte Begründung.)*
- Wie machen Sie ein AKS-Upgrade? → Release Notes lesen, veraltete APIs prüfen, erst Test-Cluster, dann Node Pools nacheinander, mit PodDisruptionBudgets.

## Don't say
- „Bei AKS muss man sich um nichts kümmern.“ Nodes, Upgrades und Kosten bleiben bei uns.
- „Wir haben Änderungen direkt im Portal gemacht.“ Bei MATCH ist alles Code.

## Words
- **verwaltet** = managed
- **Haustier** = pet (Server, den man von Hand pflegt)
- **eingebettet** = embedded
- **wertvoll** = valuable, precious
- **Sichtbarkeit** = visibility, observability
