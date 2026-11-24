---
id: tech-terraform
round: tech
tech: [gitops]
tier: 2
project: MATCH (AKS mit Terraform)
q: Wie arbeiten Sie mit Terraform? Was ist der State, und was kann schiefgehen?
en: How do you work with Terraform? What is the state, and what can go wrong?
---
## 30s
Terraform ist Infrastructure as Code. Ich beschreibe die Infrastruktur in Dateien.
`terraform plan` zeigt, was sich ändert. `terraform apply` führt es aus.
Terraform merkt sich die echte Infrastruktur im State.
Den State lege ich remote ab, mit Locking. So arbeiten zwei Personen nicht gleichzeitig darauf.
Bei MATCH ist der AKS-Cluster mit Terraform aufgebaut.
Soll ich den Ablauf mit Plan und Apply zeigen?

## 90s
**Ein AKS-Cluster, vereinfacht:**
```
resource "azurerm_kubernetes_cluster" "aks" {
  name                = "aks-match-prod"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = "match"

  default_node_pool {
    name       = "system"
    vm_size    = "Standard_D4s_v5"
    node_count = 2
  }

  identity { type = "SystemAssigned" }

  oidc_issuer_enabled       = true   # für Workload Identity
  workload_identity_enabled = true
}
```
*(Beispiel. Prüfen: echte Werte bei MATCH.)*

**State im Azure Storage (übliches Muster, Namen als Beispiel):**
```
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-tfstate"
    storage_account_name = "sttfstate"
    container_name       = "tfstate"
    key                  = "match-prod.tfstate"
  }
}
```
Laut gesagt: „Der State liegt in einem Blob. Azure Storage sperrt ihn mit einem Lease. So gibt es kein paralleles Apply.“

**Der Ablauf in der Pipeline:**
1. `terraform fmt -check` und `terraform validate`.
2. `terraform plan -out=tfplan` im Pull Request. Ein Mensch liest den Plan.
3. Nach Freigabe: `terraform apply tfplan`.

## 3min
**Warum der State so wichtig ist:**
- Er verbindet Code und echte Ressourcen.
- Er kann Secrets enthalten, zum Beispiel Passwörter von Datenbanken. Darum: privater Storage, verschlüsselt, wenige Rechte.
- Geht der State verloren, „vergisst“ Terraform die Ressourcen. Dann helfen nur `import`-Blöcke. Darum Versionierung oder Soft Delete auf dem Storage.

**Was kann schiefgehen?**
- **Drift:** Jemand ändert etwas im Portal. Der nächste Plan will es zurücksetzen. → Keine Handänderungen, regelmäßig `plan` laufen lassen.
- **Replace statt Update:** Manche Attribute erzwingen ein Neu-Erstellen. Im Plan steht dann `-/+`. Bei einem Cluster oder einer DB ist das gefährlich. → Plan immer lesen, `prevent_destroy` für kritische Ressourcen.
- **Zu großer State:** Alles in einem State macht Plans langsam und riskant. → Aufteilen, zum Beispiel Netzwerk, Cluster, Apps.

**Grenze zwischen Terraform und GitOps (MATCH):**
- Terraform baut die Plattform, bei MATCH den AKS-Cluster. *(Prüfen: auch Netzwerk, ACR und Identitäten?)*
- Helm und ArgoCD deployen, was im Cluster läuft.
So hat jedes Werkzeug eine klare Aufgabe.

**Module:** Wiederverwendbare Bausteine, zum Beispiel ein Modul „aks-cluster“ für mehrere Umgebungen. Versionen der Provider und Module fest pinnen.

## Follow-ups
- Was ist der Unterschied zwischen Terraform und ARM oder Bicep? → Bicep ist nur für Azure. Terraform funktioniert für viele Clouds und Dienste.
- Was macht `terraform import`? → Es holt eine bestehende Ressource in den State. Heute meistens mit einem `import`-Block im Code.
- Wie gehen Sie mit Secrets in Terraform um? → Nicht im Code. Aus Key Vault lesen oder generieren lassen, als `sensitive` markieren.
- Was ist OpenTofu? → Ein Open-Source-Fork von Terraform, nach dem Lizenzwechsel von HashiCorp. Fast gleich zu benutzen.
- Wo liegt bei MATCH der State? → *(Prüfen: echtes Backend und wer `apply` ausführt.)*

## Don't say
- „Ich mache `apply` ohne den Plan zu lesen.“
- „Der State kann ins Git.“ Er kann Secrets enthalten und braucht Locking.

## Words
- **Zustand (State)** = state
- **Drift** = Unterschied zwischen Code und Realität
- **sperren** = to lock
- **Freigabe** = approval
- **Baustein** = building block
