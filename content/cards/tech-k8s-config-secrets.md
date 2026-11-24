---
id: tech-k8s-config-secrets
round: tech
tech: [k8s, security]
tier: 2
project: MATCH (Vault + External Secrets Operator + Azure Key Vault)
q: Wie verwalten Sie Konfiguration und Secrets in Kubernetes?
en: How do you manage configuration and secrets in Kubernetes?
---
## 30s
Normale Konfiguration kommt in eine ConfigMap. Passwörter und Schlüssel in ein Secret.
Ein Kubernetes Secret ist aber nur Base64, nicht verschlüsselt.
Darum liegen die echten Secrets bei MATCH in HashiCorp Vault und Azure Key Vault.
Der External Secrets Operator holt sie und erstellt daraus Kubernetes Secrets.
Zu Azure Key Vault verbinden wir uns mit Workload Identity. Es gibt kein Passwort im Repo.
Soll ich zeigen, wie das External Secret aussieht?

## 90s
**ConfigMap und Secret im Pod:**
```
envFrom:
  - configMapRef: { name: api-config }
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef: { name: api-db, key: password }
```

**External Secrets Operator:**
```
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: api-db
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: ClusterSecretStore
    name: azure-keyvault
  target:
    name: api-db              # dieses K8s-Secret entsteht
  data:
    - secretKey: password
      remoteRef: { key: api-db-password }
```
Laut gesagt: „Im Git liegt nur der Verweis. Das Passwort liegt im Vault. Der Operator synchronisiert es und erneuert es automatisch.“

**Der Ablauf:**
1. `SecretStore` oder `ClusterSecretStore` sagt: wo ist der Vault, wie melde ich mich an.
2. `ExternalSecret` sagt: welche Werte, in welches Kubernetes Secret.
3. Der Operator holt die Werte im `refreshInterval` neu.

## 3min
**Warum so (MATCH):**
- Keine Secrets im Repo. Das passt zu GitOps mit ArgoCD: Alles im Git ist öffentlich lesbar für das Team.
- Automatisches Erneuern der Secrets.
- Workload Identity: Der Pod bekommt ein kurzlebiges Token von Entra ID. Kein Client-Secret, das man rotieren muss.

**Was man wissen muss:**
- **Env oder Datei?** Env-Variablen ändern sich erst nach einem Neustart des Pods. Als Volume gemountete Secrets werden nach kurzer Zeit aktualisiert. Die App muss die Datei dann neu lesen.
- **etcd:** Secrets liegen in etcd. Verschlüsselung at rest einschalten. Auf AKS ist etcd verschlüsselt; mit KMS kann man eigene Schlüssel nutzen.
- **RBAC:** Wer `get secrets` im Namespace darf, sieht alle Passwörter. Rechte knapp halten.

**Alternativen:**
- **Sealed Secrets / SOPS:** verschlüsselte Secrets im Git. Einfach, aber Rotation ist Handarbeit.
- **Secrets Store CSI Driver:** mountet Key-Vault-Werte direkt als Datei, ohne Kubernetes Secret.
- **External Secrets Operator:** flexibel, viele Backends, erzeugt normale Secrets. Das haben wir gewählt. *(Prüfen: Ihre echte Begründung für ESO.)*

**Was kann schiefgehen?**
- Vault ist nicht erreichbar → das bestehende Kubernetes Secret bleibt. Die Pods laufen weiter. Aber neue Werte kommen nicht an. → Status des ExternalSecret überwachen.
- Ein Secret ändert sich, aber die App liest es nur beim Start → Rollout nötig.

## Follow-ups
- Ist ein Kubernetes Secret sicher? → Nur mit Verschlüsselung in etcd und strengem RBAC. Base64 ist keine Verschlüsselung.
- Wie rotieren Sie ein Passwort? → Neu im Vault setzen. Der Operator aktualisiert das Secret. Dann Pods neu starten, wenn sie Env-Variablen nutzen.
- Was ist Workload Identity? → Ein Kubernetes Service Account wird mit einer Entra-ID-Identität verbunden. Der Pod bekommt Tokens ohne gespeichertes Passwort.
- Warum Vault und Key Vault zusammen? → *(Prüfen: echte Aufteilung bei MATCH, welche Secrets wo liegen.)*

## Don't say
- „Secrets sind verschlüsselt, weil sie Base64 sind.“ Base64 ist nur eine Kodierung.
- „Ich lege die values mit Passwörtern ins Git, das Repo ist privat.“ Privat ist nicht sicher.

## Words
- **verschlüsselt** = encrypted
- **Kodierung** = encoding
- **erneuern / rotieren** = to refresh / to rotate
- **Verweis** = reference
- **kurzlebig** = short-lived
