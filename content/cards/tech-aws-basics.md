---
id: tech-aws-basics
round: tech
tech: [aws]
tier: 3
project: CARIAD
q: Welche Erfahrung haben Sie mit AWS? Welche Dienste kennen Sie?
en: What experience do you have with AWS? Which services do you know?
---
## 30s
Bei CARIAD habe ich auf AWS entwickelt.
Laut meinem Arbeitszeugnis: Grundlagen, Anwendungsentwicklung, Datenbanken, Security, Skalierbarkeit und Monitoring.
Das Projekt war die HAD Map Learning Plattform. Sie verarbeitet Sensordaten aus Millionen VW-Fahrzeugen für HD-Karten.
Heute arbeite ich vor allem mit Azure. Die Konzepte sind sehr ähnlich.
*(Prüfen: Welche AWS-Dienste haben Sie bei CARIAD konkret genutzt? Nur diese nennen.)*
Soll ich die wichtigsten Dienste mit Azure vergleichen?

## 90s
**Kern-Dienste und ihr Azure-Gegenstück:**
| AWS | Wofür | Azure |
|---|---|---|
| EC2 | virtuelle Maschinen | Virtual Machines |
| S3 | Object Storage | Blob Storage |
| RDS | verwaltete Datenbank, z. B. PostgreSQL | Azure Database for PostgreSQL |
| Lambda | Serverless-Funktionen | Azure Functions |
| EKS | verwaltetes Kubernetes | AKS |
| IAM | Rechte und Rollen | Entra ID + RBAC |
| VPC | privates Netzwerk | VNet |
| CloudWatch | Logs, Metriken, Alarme | Azure Monitor |
| SQS / SNS | Queue / Pub-Sub | Service Bus / Event Grid |

**IAM-Prinzip:** Ein Service bekommt eine Rolle, kein festes Passwort. Least Privilege: nur die Rechte, die er braucht. Das gleiche Prinzip nutzen wir in Azure mit Managed Identity und Workload Identity.

## 3min
**Security:**
- Keine Access Keys im Code. Rollen für EC2, Lambda und Pods (EKS: IRSA oder Pod Identity).
- S3-Buckets privat, Block Public Access an, Verschlüsselung an.
- Private Subnetze und VPC Endpoints statt Internet. Bei DigiSanté haben wir das in Azure mit Private Endpoints gemacht.

**Skalierung:**
- Auto Scaling Groups für EC2, Kubernetes-Autoscaling auf EKS. Karpenter kommt ursprünglich von AWS. Bei MATCH nutzen wir es auf AKS.
- Lambda skaliert automatisch, aber Achtung: Cold Starts und Limits für gleichzeitige Ausführungen.

**Kosten:** Größter Fehler sind vergessene Ressourcen und Datenverkehr aus der Cloud heraus (Egress). Tags und Budgets mit Alarmen von Anfang an.

**Infrastructure as Code:** Terraform funktioniert für AWS und Azure. Bei MATCH haben wir AKS mit Terraform provisioniert. Das Wissen lässt sich übertragen.

**Ehrlich:** Meine tiefste Cloud-Erfahrung ist heute Azure. AWS kenne ich aus der CARIAD-Zeit. Für ein AWS-Projekt würde ich mich schnell in die aktuellen Dienste einarbeiten.

## Follow-ups
- Was ist der Unterschied zwischen Security Group und Network ACL? → Security Group ist stateful und hängt an einer Instanz. Network ACL ist stateless und gilt für ein Subnetz.
- Was ist eine Availability Zone? → Ein eigenes Rechenzentrum in einer Region. Mehrere AZs geben Ausfallsicherheit.
- S3-Konsistenz? → S3 ist seit 2020 strong consistent für Lesen nach Schreiben.
- Lambda oder Container? → Lambda für kurze, seltene Events. Container für lange Prozesse und volle Kontrolle.
- Wie verbinden Sie Pods auf EKS mit AWS-Diensten? → Mit einer IAM-Rolle pro Service Account. Keine Keys im Pod.

## Don't say
- Keine Dienste nennen, die Sie bei CARIAD nicht genutzt haben, als ob Sie sie genutzt hätten.
- „AWS und Azure sind ganz anders.“ Die Konzepte sind fast gleich, nur die Namen sind anders.

## Words
- **das Arbeitszeugnis** = reference letter from the employer
- **verwaltet** = managed
- **die Region** = geografischer Standort der Cloud
- **Least Privilege** = nur die nötigen Rechte
- **einarbeiten** = sich in etwas Neues einlernen
