---
id: tech-azure-network-identity
round: tech
tech: [azure, security]
tier: 1
project: DigiSanté (Private Endpoints, Managed Identity), MATCH (Workload Identity, Key Vault)
q: Wie sichern Sie eine Azure-Lösung ab – Netzwerk, Identität und Secrets?
en: How do you secure an Azure solution – network, identity and secrets?
---
## 30s
Ich sichere auf drei Ebenen: Netzwerk, Identität, Secrets.
Netzwerk: Dienste nur über Private Endpoints, öffentlicher Zugang aus.
Identität: Managed Identity statt Passwörter. Auf AKS Workload Identity.
Secrets: in Key Vault, nie im Code.
Bei DigiSanté sind Functions, Storage, Key Vault und Event Hub nur über Private Endpoints erreichbar.
Bei MATCH holen die Pods Secrets aus Key Vault über Workload Identity.
Soll ich eine der drei Ebenen genauer erklären?

## 90s
**Private Endpoint:**
- Ein Dienst wie Storage bekommt eine private IP in meinem VNet.
- Eine Private DNS Zone (`privatelink.blob.core.windows.net`) löst den Namen auf diese IP auf.
- Dann schalte ich den öffentlichen Zugang aus.
- Unterschied zum Service Endpoint: Dort bleibt die öffentliche IP, nur der Weg ist geschützt.

**Managed Identity:**
- Azure gibt einer Ressource eine Identität in Entra ID.
- Die App holt Tokens ohne gespeichertes Passwort.
- Rechte per RBAC, zum Beispiel `Key Vault Secrets User` oder `Storage Blob Data Contributor`.
- System-assigned lebt mit der Ressource. User-assigned kann man mehreren Ressourcen geben.

**Workload Identity auf AKS (MATCH):**
1. Der Cluster hat einen OIDC Issuer.
2. Ein Kubernetes Service Account ist über eine Federated Credential mit einer Entra-ID-Identität verbunden.
3. Der Pod tauscht sein Service-Account-Token gegen ein Entra-Token.
4. Mit diesem Token liest er Key Vault. Bei MATCH macht das der External Secrets Operator.

Laut gesagt: „Es gibt kein Secret, um an die Secrets zu kommen. Das ist der Punkt.“

## 3min
**DigiSanté konkret:**
- Functions, Storage, Key Vault und Event Hub: nur Private Endpoints.
- Event Grid: eine bewusste Ausnahme mit öffentlichem Zugang. Defender for Cloud läuft in einer Netzwerk-Grenze, die Microsoft verwaltet. *(Prüfen: genaue Begründung.)*
- Die Audit-Bibliothek schreibt asynchron nach Azure Monitor, über einen privaten Data Collection Endpoint, mit Managed Identity.
- Der PDF-Service läuft im privaten VNet.

**Was kann schiefgehen?**
- **DNS:** Der häufigste Fehler bei Private Endpoints. Der Name zeigt noch auf die öffentliche IP. → `nslookup` aus dem VNet prüfen, Private DNS Zone mit dem VNet verlinken.
- **Zu breite Rechte:** Eine Identität mit `Contributor` auf der ganzen Subscription. → Kleinste Rolle, kleinster Scope.
- **Key Vault Zugriff:** Heute nutze ich Azure RBAC statt der alten Access Policies.

**Trade-offs:**
- Private Endpoints kosten Geld und machen Deployment und Debugging komplizierter. CI-Agents brauchen Netzwerkzugang ins VNet.
- Dafür ist die Angriffsfläche viel kleiner. Für Gesundheitsdaten im Bund ist das der richtige Preis.

**Ausnahmen bewusst machen:** Wenn ein Dienst öffentlich sein muss, dokumentiere ich warum, und schütze ihn anders, zum Beispiel mit Identität und Filtern.

## Follow-ups
- Was ist der Unterschied zwischen Private Endpoint und Service Endpoint? → Private Endpoint gibt eine private IP im VNet. Service Endpoint schützt nur den Weg zur öffentlichen IP.
- System-assigned oder user-assigned Identity? → System-assigned für eine Ressource, einfach. User-assigned, wenn mehrere Ressourcen dieselben Rechte brauchen oder die Identität vorher existieren muss.
- Was hat Workload Identity ersetzt? → Die alte AAD Pod Identity. Sie ist abgekündigt.
- Wie kommt die App an den Key-Vault-Schlüssel für JWT? → Bei DigiSanté wird das JWT gegen den öffentlichen Schlüssel aus Key Vault geprüft. Signiert Key Vault selbst, verlässt der private Schlüssel Key Vault nie. *(Prüfen: wer das Token bei DigiSanté signiert.)*

## Don't say
- „Der Connection String mit Key steht in den App Settings.“ Besser Managed Identity oder eine Key-Vault-Referenz.
- „Private Endpoint heißt, alles ist automatisch sicher.“ Rechte und DNS gehören dazu.

## Words
- **Angriffsfläche** = attack surface
- **auflösen (DNS)** = to resolve
- **abgekündigt** = deprecated
- **Ebene** = layer
- **kleinste Rolle** = least privilege
