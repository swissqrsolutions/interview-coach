---
id: tech-k8s-helm
round: tech
tech: [k8s, gitops]
tier: 2
project: MATCH (ein Helm Chart für den ganzen Stack)
q: Was ist Helm, und wie haben Sie Ihre Charts aufgebaut?
en: What is Helm, and how did you structure your charts?
---
## 30s
Helm ist ein Paketmanager für Kubernetes.
Ein Chart ist eine Vorlage für viele YAML-Dateien. Werte kommen aus `values`-Dateien.
So nutze ich dieselbe Vorlage für lokal und für Produktion.
Bei MATCH habe ich ein Helm Chart für den ganzen Stack: Spark, Nessie, MinIO, Dremio, API, WebUI, Worker, MSSQL, Keycloak und den DB-Migrations-Job.
Lokal läuft es auf Rancher Desktop, in Produktion auf AKS.
Soll ich die Struktur zeigen?

## 90s
**Struktur (vereinfacht, Dateinamen als Beispiel):**
```
match/
  Chart.yaml
  values.yaml             # Standardwerte
  values.local.yaml       # Rancher Desktop, NodePort
  values.prod.yaml        # AKS, LoadBalancer, Images aus ACR
  templates/
    api-deployment.yaml
    api-service.yaml
    dremio-statefulset.yaml
    db-migration-job.yaml
    _helpers.tpl
```
**Ein Template:**
```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "match.fullname" . }}-api
spec:
  replicas: {{ .Values.api.replicas }}
  template:
    spec:
      containers:
        - name: api
          image: "{{ .Values.image.registry }}/api:{{ .Values.api.tag }}"
```
**Befehle:**
```
helm template . -f values.local.yaml          # nur rendern, prüfen
helm upgrade --install match . -f values.prod.yaml -n match
helm rollback match 3
```
Laut gesagt: „Der Unterschied zwischen lokal und Produktion steht nur in den values. Die Templates sind gleich.“

## 3min
**Helm mit ArgoCD (wie bei MATCH):**
ArgoCD rendert das Chart selbst, wie `helm template`, und wendet das Ergebnis an. Es gibt dann keine Helm-Release-Historie im Cluster. Der Rollback geht über `git revert`, nicht über `helm rollback`. Helm-Hooks übersetzt ArgoCD in eigene Hooks. Bei MATCH erstellen PostSync-Hooks die MinIO-Buckets.

**Jobs sind unveränderlich:** Ein Job-Template kann man nach dem Erstellen nicht ändern. Darum hat MATCH `ignoreDifferences` für Jobs in ArgoCD.

**Ein Chart oder viele?**
- Ein Chart für alles (MATCH): einfach zu deployen, eine Version für den ganzen Stack, gut für ein Team.
- Viele Charts, eins pro Service: Teams deployen unabhängig. Aber Versionen müssen zusammenpassen.
- *(Prüfen: Würden Sie es heute wieder als ein Chart bauen? Was spricht für Subcharts?)*

**Gute Praxis:**
- `helm lint` und `helm template` in der CI.
- Keine Secrets in den values. Bei MATCH kommen Secrets über External Secrets aus Vault und Key Vault.
- Image-Tags fest, nie `latest`.
- Wenige Werte in den values. Zu viel Logik in Templates wird schwer lesbar.

**Alternativen:** Kustomize arbeitet mit Overlays statt Vorlagen. Kein Templating, dafür weniger flexibel. Für eigene Apps mit vielen Varianten finde ich Helm praktischer.

## Follow-ups
- Was ist der Unterschied zwischen `helm install` und `upgrade --install`? → `upgrade --install` installiert beim ersten Mal und aktualisiert danach. Gut für Pipelines.
- Wo liegt der Zustand eines Helm-Release? → Als Secret im Namespace des Release. Mit ArgoCD gibt es keinen solchen Zustand.
- Wie testen Sie ein Chart? → `helm lint`, `helm template` mit allen values-Dateien, und lokal auf Rancher Desktop installieren.
- Was sind Subcharts? → Abhängige Charts in `Chart.yaml`, zum Beispiel ein fertiges Chart für eine Datenbank.

## Don't say
- „Helm deployt bei uns direkt aus der Pipeline“, wenn ArgoCD deployt. Sagen Sie genau, wer was macht.
- „Passwörter stehen in values.prod.yaml.“ Nie.

## Words
- **Vorlage** = template
- **rendern** = Vorlage mit Werten füllen
- **unveränderlich** = immutable
- **Paketmanager** = package manager
