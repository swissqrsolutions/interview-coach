---
id: tech-k8s-basics
round: tech
tech: [k8s]
tier: 1
project: MATCH (ganzer Stack auf AKS)
q: Erklären Sie Pod, Deployment, Service und Ingress in Kubernetes.
en: Explain Pod, Deployment, Service and Ingress in Kubernetes.
---
## 30s
Ein Pod ist die kleinste Einheit: ein oder mehrere Container, die zusammen laufen.
Ein Deployment sagt: Ich will drei Pods von diesem Image. Kubernetes hält diesen Zustand.
Ein Service gibt den Pods eine feste Adresse und verteilt die Last.
Ein Ingress bringt HTTP-Verkehr von außen zu den Services.
Bei MATCH läuft der ganze Stack so auf AKS: Spark, Nessie, MinIO, Dremio, API, WebUI und Worker.
Soll ich zeigen, wie ein Request durch diese Teile geht?

## 90s
**Der Weg eines Requests:**
1. Der Browser ruft `https://app.example.ch/api` auf.
2. Der **Ingress Controller** (zum Beispiel NGINX oder Application Gateway) liest die Ingress-Regel: `/api` → Service `api`.
3. Der **Service** `api` hat eine feste virtuelle IP und einen DNS-Namen: `api.namespace.svc.cluster.local`.
4. Der Service schickt den Request an einen gesunden **Pod** mit dem passenden Label.
5. Das **Deployment** sorgt dafür, dass immer genug Pods da sind.

**Deployment, kurz:**
```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels: { app: api }
  template:
    metadata:
      labels: { app: api }
    spec:
      containers:
        - name: api
          image: myacr.azurecr.io/api:1.4.2
          ports: [{ containerPort: 8080 }]
```
Laut gesagt: „Der Selector verbindet alles. Deployment und Service finden die Pods über das Label `app: api`.“

## 3min
**Service-Typen:**
- `ClusterIP` (Standard): nur im Cluster erreichbar.
- `NodePort`: ein Port auf jedem Node. Gut für lokal.
- `LoadBalancer`: die Cloud erstellt einen echten Load Balancer.
Bei MATCH haben wir genau das im Helm Chart: `values.local.yaml` mit NodePort für Rancher Desktop, `values.prod.yaml` mit LoadBalancer auf AKS.

**Rolling Update:** Ein neues Image → das Deployment erstellt ein neues ReplicaSet. Es startet neue Pods und stoppt alte Schritt für Schritt (`maxSurge`, `maxUnavailable`). Nur Pods mit erfolgreicher Readiness Probe bekommen Verkehr. Rollback: `kubectl rollout undo` – oder bei GitOps ein `git revert`.

**Andere Workloads:**
- `StatefulSet`: feste Namen und eigener Speicher pro Pod, für Datenbanken.
- `Job` / `CronJob`: läuft einmal oder nach Zeitplan. Bei MATCH zum Beispiel der DB-Migrations-Job.
- `DaemonSet`: ein Pod pro Node, zum Beispiel für Logs oder das Netzwerk.

**Ingress heute:** Ingress braucht immer einen Controller. Der Nachfolger von Ingress ist die **Gateway API**. Sie trennt die Rollen besser (Gateway gegen Route) und kann mehr als HTTP. Für neue Projekte schaue ich zuerst auf die Gateway API.

**Wann ist Kubernetes zu viel?** Für ein, zwei kleine Services. Dann reichen Azure Container Apps oder App Service.

## Follow-ups
- Warum nicht direkt Pods erstellen? → Ein einzelner Pod kommt nach einem Absturz des Nodes nicht zurück. Das Deployment ersetzt ihn.
- Wie finden Pods einander? → Über den DNS-Namen des Service. Pod-IPs ändern sich bei jedem Neustart.
- Was ist ein Namespace? → Eine logische Trennung im Cluster, für Rechte, Quotas und Ordnung.
- Was ist ein Sidecar? → Ein zweiter Container im selben Pod, zum Beispiel für einen Proxy. Native Sidecars (Init Container mit `restartPolicy: Always`) sind seit Kubernetes 1.33 stabil.
- Was ist ein Init Container? → Er läuft vor dem Hauptcontainer und muss fertig werden. Bei DigiSanté (Azure Container Apps) macht ein Init Container die einmalige Zertifikats-Registrierung für den Sedex-Client.

## Don't say
- „Ein Pod ist ein Container.“ Ein Pod kann mehrere Container haben.
- „Ein Service ist ein Load Balancer von Azure.“ Nur der Typ LoadBalancer erstellt einen.

## Words
- **Zustand** = state (desired state)
- **Verkehr** = traffic
- **erreichbar** = reachable
- **Label / Selector** = Etikett / Auswahl nach Etikett
- **ersetzen** = to replace
