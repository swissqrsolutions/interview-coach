---
id: project-match-platform
round: project
tech: [k8s, gitops, security, observability]
tier: 1
project: ElCom MATCH
q: Wie haben Sie die Plattform für MATCH auf Kubernetes aufgebaut und betrieben?
en: How did you build and run the MATCH platform on Kubernetes?
---
## 30s
Der ganze MATCH-Stack läuft auf AKS, also Kubernetes in Azure.
Ein Helm-Chart beschreibt alles: Spark, Nessie, MinIO, Dremio, API, Web-UI, Worker, MSSQL und Keycloak.
Den Cluster erstellen wir mit Terraform. Die Images kommen aus der Azure Container Registry.
ArgoCD deployt aus Git. Niemand ändert den Cluster von Hand.
Secrets kommen aus Vault und Azure Key Vault, nie aus dem Repo.
Cilium, Kyverno und Karpenter machen den Cluster sicher und elastisch.
Soll ich einen Teil genauer erklären, zum Beispiel GitOps oder Secrets?

## 90s
**Die Schichten (von unten nach oben):**
1. **Infrastruktur:** Terraform erstellt AKS. Die Images liegen in ACR.
2. **Paket:** Ein Helm-Chart für den ganzen Stack. Zwei Values-Dateien: `values.local.yaml` für Rancher Desktop mit NodePort, `values.prod.yaml` für AKS mit LoadBalancer und ACR.
3. **Deployment:** ArgoCD mit automatischem Sync, `prune` und `selfHeal`. Ein PostSync-Hook erstellt die MinIO-Buckets. Ein Migrations-Job bereitet die Datenbank vor.
4. **Secrets:** HashiCorp Vault und der External Secrets Operator. Azure Key Vault über Workload Identity. Secrets werden automatisch erneuert.
5. **Regeln und Netz:** Kyverno erlaubt nur Images aus ACR, keine privilegierten Pods, Pflicht-Labels und Resource Limits. Cilium Network Policies sagen, welcher Pod mit MSSQL, MinIO oder Vault sprechen darf.
6. **Skalierung:** Spark ist stossweise. Karpenter startet Nodes bei Spitzen und entfernt sie danach.
7. **Monitoring:** Grafana und Prometheus. Wir beobachten Job-Dauer, wartende Meldungen und Pod-Restarts.

```
ArgoCD Application (vereinfacht)
syncPolicy:
  automated:
    prune: true
    selfHeal: true
```

## 3min
**Warum diese Entscheidungen?**
- **Ein Chart statt viele:** Der Stack wird zusammen getestet und zusammen deployt. Lokal und in Produktion ist es derselbe Chart. Nur die Values sind anders.
- **GitOps:** Git ist die einzige Wahrheit. Ein Rollback ist ein `git revert`. `selfHeal` setzt manuelle Änderungen zurück. So gibt es keinen Drift.
- **Secrets nicht im Repo:** Im Repo steht nur ein `ExternalSecret`. Der Operator holt den Wert aus Vault oder Key Vault. Workload Identity braucht kein Passwort für Azure.

**Trade-offs:**
- Ein grosser Chart ist bequem. Aber ein Fehler kann alles blockieren. Bei mehr Teams würde ich den Chart teilen, zum Beispiel Daten-Stack und Applikation.
- Jobs sind in Kubernetes unveränderlich. ArgoCD zeigt dann immer eine Differenz. Darum haben wir `ignoreDifferences` für Jobs gesetzt.
- Eigene Datenplattform auf Kubernetes heisst: Wir betreiben Spark, Dremio und Nessie selbst. Das ist Arbeit. Dafür sind wir herstellerneutral.

**Was schiefgehen kann und wie wir es merken:**
- Nessie lief zuerst mit RocksDB im Pod. Bei einem Reschedule konnte der Katalog verloren gehen. Ich habe Nessie auf ein Postgres-Backend umgestellt.
- Ein Spark-Job hängt: Grafana zeigt lange Job-Dauer und einen wachsenden Rückstau an Pending-Meldungen.
- Ein Pod startet immer neu: Alarm auf Pod-Restarts.
- Ein Firmen-Proxy signiert TLS neu. Spark und pip konnten nichts laden. Fix: das Firmen-CA-Zertifikat ins Spark-Image einbauen.

**Was ich heute anders machen würde:** *(Ihr echtes Beispiel: z. B. Katalog von Anfang an mit Postgres-Backend.)*

## Follow-ups
- Was passiert, wenn jemand mit kubectl etwas ändert? → ArgoCD sieht den Drift. Mit selfHeal setzt es den Zustand aus Git zurück.
- Wie machen Sie ein Rollback? → git revert auf den letzten guten Commit. ArgoCD synchronisiert dann automatisch.
- Warum Vault und Azure Key Vault zusammen? → *(Prüfen: welche Secrets liegen wo?)* Der External Secrets Operator kann beide lesen. Die Pods sehen nur normale Kubernetes Secrets.
- Was ist Workload Identity? → Der Pod bekommt eine Identität in Entra ID über ein Service-Account-Token. So braucht er kein Passwort für Key Vault.
- Was macht Kyverno genau? → Es ist ein Admission Controller. Er prüft jedes Objekt vor dem Speichern. Ein Pod mit fremdem Image oder ohne Limits wird abgelehnt.
- Wozu Cilium? → Cilium ist das CNI mit eBPF. Es setzt Network Policies durch. Mit Hubble sehe ich, welcher Pod mit wem spricht.
- Warum Karpenter und nicht nur der Cluster Autoscaler? → Karpenter wählt passende Node-Grössen direkt für wartende Pods. Für stossweise Spark-Last ist das schneller und billiger.
- Wie testen Sie den Chart lokal? → Mit values.local.yaml auf Rancher Desktop. Derselbe Chart, nur NodePort statt LoadBalancer.

## Don't say
- „ArgoCD ist einfach CI/CD.“ ArgoCD macht nur das Deployment (Pull aus Git). Build und Tests laufen in Azure DevOps.
- Nicht sagen, dass Secrets „verschlüsselt im Repo“ liegen. Bei MATCH sind keine Secrets im Repo.
- Nicht alle Tools aufzählen, ohne das Problem zu nennen, das jedes Tool löst.

## Words
- **Drift** = Cluster ist anders als Git
- **Admission Controller** = prüft Objekte vor dem Speichern
- **stossweise** = bursty, in Spitzen
- **Rückstau** = backlog
- **unveränderlich** = immutable
