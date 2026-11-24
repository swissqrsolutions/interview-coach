---
id: tech-k8s-probes-resources
round: tech
tech: [k8s]
tier: 1
project: MATCH (Kyverno verlangt Limits, CI-OOM-Geschichte)
q: Was ist der Unterschied zwischen Liveness, Readiness und Startup Probe? Und was passiert bei OOMKilled?
en: What is the difference between liveness, readiness and startup probes? And what happens with OOMKilled?
---
## 30s
Die Readiness Probe fragt: Darf dieser Pod Verkehr bekommen?
Die Liveness Probe fragt: Lebt der Prozess noch? Wenn nicht, startet Kubernetes den Container neu.
Die Startup Probe schützt langsame Starts. Bis sie klappt, laufen die anderen Probes nicht.
Requests sind für die Planung, Limits sind die harte Grenze.
Über dem Memory-Limit tötet der Kernel den Container: OOMKilled, Exit-Code 137.
Bei MATCH erzwingt Kyverno Resource Limits für jeden Pod.
Soll ich ein Beispiel für eine Spring-Boot-App zeigen?

## 90s
**Probes für eine Spring-Boot-App (Actuator):**
```
startupProbe:
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  periodSeconds: 5
  failureThreshold: 30        # bis zu 150 s für den Start
livenessProbe:
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  periodSeconds: 10
readinessProbe:
  httpGet: { path: /actuator/health/readiness, port: 8080 }
  periodSeconds: 5
resources:
  requests: { cpu: 250m, memory: 512Mi }
  limits:   { memory: 768Mi }
```
Laut gesagt: „Readiness darf die Datenbank prüfen. Liveness prüft nur den Prozess selbst. Sonst startet bei einem DB-Ausfall jeder Pod neu.“

**Requests und Limits:**
- **Requests:** Der Scheduler sucht einen Node mit so viel freiem Platz.
- **CPU-Limit:** Der Container wird gebremst (Throttling). Er stirbt nicht.
- **Memory-Limit:** Der Container wird getötet. OOMKilled.

## 3min
**OOMKilled finden und beheben:**
```
kubectl describe pod api-7d9f...
#   Last State: Terminated
#   Reason: OOMKilled
#   Exit Code: 137
kubectl top pod
```
Ursachen:
- Das Limit ist zu klein für die echte Last.
- Bei Java: Die JVM sieht das Container-Limit. Der Heap ist aber nicht alles: Metaspace, Threads, Direct Buffers. → `-XX:MaxRAMPercentage=75` und Platz lassen.
- Ein echtes Memory Leak. → Heap Dump, Metriken über Zeit.

**Bei Spark (MATCH):** Executors brauchen Heap plus Memory Overhead. Das Limit des Pods muss beides abdecken.

**QoS-Klassen:**
- `Guaranteed`: Requests = Limits für CPU und Memory. Wird zuletzt verdrängt.
- `Burstable`: Requests kleiner als Limits.
- `BestEffort`: nichts gesetzt. Wird zuerst verdrängt.

**CPU-Limits – meine Meinung:** Viele Teams setzen kein CPU-Limit, nur einen CPU-Request. So gibt es kein unnötiges Throttling. Memory-Limit setze ich immer.

**Echte Geschichte (MATCH, CI):** In der CI wurde der SQL-Server-Testcontainer OOM-killed. Grund: parallele Test-Collections. Lösung: SQL-Container auf 2 GB begrenzt, Speicher auf dem Build-Server vor den Tests freigegeben, Fail-fast beim Start, schwere Collections nacheinander. Lektion: Speicher-Grenzen bewusst setzen, auch in der CI.

**Kyverno bei MATCH:** Die Policy verlangt Labels und Resource Limits. Ein Pod ohne Limits kommt gar nicht erst in den Cluster.

## Follow-ups
- Was passiert, wenn die Readiness Probe fehlschlägt? → Der Pod bleibt am Leben. Er wird nur aus den Endpoints des Service entfernt.
- Warum nicht nur eine Liveness Probe? → Ohne Readiness bekommt der Pod Verkehr, bevor er bereit ist. Die ersten Requests schlagen fehl.
- Was ist eine schlechte Liveness Probe? → Eine, die externe Systeme prüft. Fällt die DB aus, startet Kubernetes alle Pods neu, und es wird schlimmer.
- Was heißt 250m? → 250 Millicores, also ein Viertel CPU-Kern.
- Wie wählen Sie die Werte? → Messen unter Last in Grafana, dann mit Puffer setzen. Später nachjustieren.

## Don't say
- „Liveness und Readiness sind dasselbe.“ Die eine startet neu, die andere nimmt nur aus dem Verkehr.
- „Beim CPU-Limit stirbt der Container.“ Er wird nur gebremst.

## Words
- **Grenze** = limit
- **bremsen** = to throttle
- **verdrängen** = to evict
- **Exit-Code 137** = 128 + 9, getötet mit SIGKILL
- **Puffer** = buffer, headroom
