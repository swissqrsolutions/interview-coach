---
id: tech-openshift
round: tech
tech: [openshift]
tier: 3
proof: study
project: MATCH (AKS) als Vergleich
q: Was ist OpenShift und was ist der Unterschied zu AKS?
en: What is OpenShift and how does it differ from AKS?
---
## 30s
OpenShift ist die Kubernetes-Plattform von Red Hat.
Darunter läuft normales Kubernetes. Dazu kommen viele fertige Bausteine.
Zum Beispiel: Routes, eine eigene Registry, Builds, Monitoring und strenge Security-Regeln.
AKS ist dagegen ein schlankes, verwaltetes Kubernetes in Azure. Vieles baut man selbst dazu.
Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich von MATCH: Dort haben wir auf AKS selbst Argo CD, Kyverno, Cilium und Monitoring mit Grafana und Prometheus aufgebaut.

## 90s
| Thema | OpenShift | AKS bei MATCH |
|---|---|---|
| Zugriff von außen | Route (oder Ingress) | Service vom Typ LoadBalancer |
| Security | Security Context Constraints (SCC), restricted als Standard | Kyverno Policies, von uns definiert |
| GitOps | OpenShift GitOps (Argo CD) als Operator | Argo CD selbst installiert |
| Registry | eingebaute Registry, ImageStreams | Azure Container Registry |
| Netzwerk | OVN-Kubernetes | Cilium mit Network Policies |
| CLI | `oc` (kann alles von `kubectl`) | `kubectl` |

**Project:** Ein Namespace mit zusätzlichen Regeln und Rechten.

**SCC restricted:** Pods laufen mit einer zufälligen User-ID, nicht als root. Viele Docker-Images aus dem Internet laufen darum nicht direkt.

## 3min
**Was bei einer Migration von AKS auf OpenShift wichtig wäre:**
- Images müssen ohne root laufen und mit beliebiger UID. Dateirechte für die Gruppe `0` setzen.
- Unser Helm-Chart läuft im Kern weiter. Wir hatten schon zwei Values-Dateien (lokal und AKS). Eine dritte für OpenShift wäre der Weg. Zugriff von außen eher über Routes.
- Kyverno-Regeln: Viele Regeln deckt SCC schon ab. Andere Regeln braucht man weiter.
- Secrets: Vault mit External Secrets Operator funktioniert auch auf OpenShift.

**Trade-offs:**
- OpenShift: viel eingebaut, Support von Red Hat, gut für On-Premise. Typisch in Behörden und Banken in der Schweiz. Aber teuer und schwerer.
- AKS: günstig, flexibel, nah an Azure. Aber man muss mehr selbst integrieren und pflegen.

**Betrieb:** OpenShift 4 nutzt Operators für fast alles, auch für die Plattform selbst. Updates des Clusters laufen über den Cluster Version Operator.

**Was ich mitbringe:** Helm, GitOps mit Argo CD, Network Policies, Policy Enforcement, Autoscaling mit Karpenter, Monitoring. Das sind die gleichen Konzepte. Neu wären für mich vor allem SCC, Routes und `oc`.

## Follow-ups
- Warum startet mein Container auf OpenShift nicht? → Oft will er als root laufen oder in ein Verzeichnis schreiben. Die SCC verbietet das.
- Was ist Source-to-Image (S2I)? → OpenShift baut aus Quellcode direkt ein Image. Heute nutzen viele aber normale CI-Pipelines.
- Was ist ein Operator? → Ein Controller, der eine Anwendung wie ein Mensch betreibt: installieren, updaten, heilen.
- Gibt es OpenShift in Azure? → Ja, Azure Red Hat OpenShift (ARO) als verwalteten Dienst.
- Route oder Ingress? → Beides geht. Routes sind OpenShift-spezifisch. Ingress ist portabler.

## Don't say
- „OpenShift ist kein Kubernetes.“ Doch, es ist eine Kubernetes-Distribution.
- „Ich habe OpenShift betrieben.“ Nicht wahr. AKS ja, OpenShift nur gelernt.

## Words
- **die Distribution** = fertige Zusammenstellung einer Software
- **verwaltet** = managed
- **die Route** = OpenShift-Objekt für Zugriff von außen
- **schlank** = lean
- **beliebig** = any, random
