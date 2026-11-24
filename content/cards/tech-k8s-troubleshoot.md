---
id: tech-k8s-troubleshoot
round: tech
tech: [k8s]
tier: 1
project: MATCH (AKS, ACR, Karpenter, Kyverno, Firmen-Proxy)
q: Ein Pod ist in CrashLoopBackOff, Pending oder ImagePullBackOff. Wie gehen Sie vor?
en: A pod is in CrashLoopBackOff, Pending or ImagePullBackOff. How do you proceed?
---
## 30s
Ich starte immer mit drei Befehlen: `get`, `describe` und `logs`.
Bei `describe` lese ich die Events unten. Dort steht meistens der Grund.
CrashLoopBackOff heißt: Der Container startet und stirbt immer wieder.
Pending heißt: Der Scheduler findet keinen passenden Node.
ImagePullBackOff heißt: Das Image kann nicht geladen werden.
Bei MATCH betreibe ich den Stack auf AKS mit Images aus der Azure Container Registry.
Soll ich jeden Fall einzeln durchgehen?

## 90s
**Die Basis:**
```
kubectl get pods -n match
kubectl describe pod <pod> -n match       # Events unten lesen
kubectl logs <pod> -n match --previous    # Logs vom letzten, abgestürzten Start
kubectl get events -n match --sort-by=.lastTimestamp
```

**CrashLoopBackOff:**
- `logs --previous` zeigt den Fehler vom letzten Start.
- Typisch: fehlende Konfiguration oder Secret, DB nicht erreichbar, falscher Startbefehl, OOMKilled (Exit-Code 137), Liveness Probe zu streng.
- Kubernetes wartet zwischen den Neustarts immer länger, bis maximal 5 Minuten.

**Pending:**
- `describe` zeigt zum Beispiel: `0/3 nodes are available: 3 Insufficient memory`.
- Typisch: Requests zu groß, Taints ohne Toleration, nodeSelector oder Affinity passt nicht, PersistentVolumeClaim nicht gebunden.

**ImagePullBackOff:**
- Falscher Image-Name oder Tag.
- Keine Rechte auf die Registry. Auf AKS braucht die Kubelet-Identität die Rolle `AcrPull` auf der ACR.
- Netzwerk: Der Node erreicht die Registry nicht, zum Beispiel wegen Firewall.

Laut gesagt: „Ich ändere nichts, bevor ich den Grund in den Events oder Logs gelesen habe.“

## 3min
**Fälle, die zu MATCH passen:**
- **Pending mit Karpenter:** Pending-Pods sind das Signal für Karpenter. Er startet einen neuen Node. Spark ist stoßweise, darum ist das normal. Bleibt ein Pod lange Pending, passt kein Node-Typ zu den Requests, oder ein Limit ist erreicht.
- **Kyverno blockiert:** Bei MATCH erlaubt Kyverno nur Images aus unserer ACR und keine privilegierten Pods. Dann entsteht der Pod gar nicht. Den Grund sehe ich in den Events des ReplicaSets oder Jobs, nicht beim Pod.
- **Netzwerk-Policy:** Mit Cilium regeln wir, welche Pods mit MSSQL, MinIO und Vault sprechen dürfen. Ein neuer Pod ohne passende Regel startet, aber er erreicht die DB nicht. Das sieht dann wie ein App-Fehler aus. Mit Hubble sehe ich die blockierten Flows.
- **Firmen-Proxy (echte Geschichte):** Ein Proxy hat TLS neu signiert. Spark-Jobs und `pip` sind gescheitert. Lösung: das CA-Bundle der Firma ins Spark-Image einbauen.

**Mehr Werkzeuge:**
- `kubectl exec -it <pod> -- sh` – wenn der Container lange genug lebt.
- `kubectl debug` – ein Debug-Container neben dem kaputten, wenn das Image keine Shell hat.
- `kubectl get pod <pod> -o yaml` – den echten Zustand und den Exit-Code sehen.

**Vorbeugen:**
- Alarme in Grafana auf Pod-Neustarts. Bei MATCH beobachten wir Neustarts, Job-Dauern und den Rückstau.
- Requests realistisch setzen.
- Startup Probe für langsame Starts.

## Follow-ups
- Was ist der Unterschied zwischen ErrImagePull und ImagePullBackOff? → ErrImagePull ist der erste Fehler. ImagePullBackOff heißt: Kubernetes wartet vor dem nächsten Versuch.
- Der Pod läuft, aber der Service antwortet nicht. Was prüfen Sie? → Readiness, die Labels im Selector, die Endpoints (`kubectl get endpointslices`), den Port und Network Policies.
- Was ist CreateContainerConfigError? → Meistens fehlt ein Secret oder eine ConfigMap, auf die der Pod zeigt.
- Wie debuggen Sie einen Pod ohne Shell im Image? → Mit `kubectl debug` und einem Ephemeral Container.

## Don't say
- „Ich lösche den Pod einfach.“ Ohne Ursache kommt der Fehler zurück.
- „Ich gebe dem Pod mehr Speicher.“ Erst wissen, ob es wirklich OOMKilled war.

## Words
- **Ereignis (Event)** = event
- **abstürzen** = to crash
- **stoßweise** = bursty
- **signieren** = to sign (TLS)
- **vorbeugen** = to prevent
