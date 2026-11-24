---
id: tech-gitops-argocd
round: tech
tech: [gitops]
tier: 2
project: MATCH (ArgoCD mit Auto-Sync, Prune, Self-Heal)
q: Was ist GitOps, und wie arbeiten Sie mit ArgoCD?
en: What is GitOps, and how do you work with ArgoCD?
---
## 30s
GitOps heißt: Git ist die einzige Wahrheit für den Zustand im Cluster.
Niemand ändert den Cluster von Hand. Jede Änderung ist ein Commit.
ArgoCD läuft im Cluster. Es vergleicht Git mit dem Cluster und gleicht ab.
Bei MATCH nutzen wir Auto-Sync mit Prune und Self-Heal.
Ein Rollback ist ein `git revert`.
Soll ich zeigen, wie eine Änderung vom Commit bis in den Cluster kommt?

## 90s
**Der Ablauf:**
1. Ich ändere das Helm Chart oder einen Image-Tag und mache einen Pull Request.
2. Review, Merge auf den Hauptzweig.
3. ArgoCD sieht den neuen Commit und rendert das Chart.
4. ArgoCD vergleicht mit dem Cluster: „OutOfSync“.
5. Auto-Sync wendet die Änderung an. Danach: „Synced“ und „Healthy“.

**Die Application:**
```
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata: { name: match, namespace: argocd }
spec:
  source:
    repoURL: https://git.example.ch/match-deploy.git   # Beispiel
    path: charts/match                                  # Beispiel
    helm:
      valueFiles: [values.prod.yaml]
  destination: { server: https://kubernetes.default.svc, namespace: match }
  syncPolicy:
    automated:
      prune: true      # gelöschte Ressourcen auch im Cluster löschen
      selfHeal: true   # Handänderungen im Cluster zurücksetzen
```
Laut gesagt: „Prune räumt auf. Self-Heal setzt manuelle Änderungen zurück. So bleibt Git die Wahrheit.“

## 3min
**Was wir bei MATCH zusätzlich brauchten:**
- **PostSync-Hooks:** Nach dem Sync erstellen Hooks die MinIO-Buckets.
- **ignoreDifferences für Jobs:** Jobs sind unveränderlich. Ohne diese Regel zeigt ArgoCD dauernd „OutOfSync“.
- **Keine manuellen Änderungen am Cluster.** Self-Heal würde sie sowieso zurücksetzen.

**Vorteile:**
- Jede Änderung hat einen Autor, ein Review und eine Historie.
- Rollback ist einfach: `git revert`.
- Die Pipeline braucht keine Admin-Rechte auf dem Cluster. ArgoCD zieht die Änderungen (Pull statt Push).

**Nachteile und Fallen:**
- Secrets gehören nicht ins Git. Bei MATCH lösen wir das mit External Secrets, Vault und Key Vault.
- Notfall-Fix von Hand geht nicht schnell, Self-Heal setzt ihn zurück. Auch ein Hotfix geht über Git.
- Prune kann zu viel löschen, wenn jemand eine Datei falsch verschiebt. Darum Review und für wichtige Ressourcen die Annotation `Prune=false`.
- Reihenfolge: Sync Waves (`argocd.argoproj.io/sync-wave`) für „zuerst DB-Migration, dann App“. *(Prüfen: ob MATCH Sync Waves nutzt.)*

**Mehrere Umgebungen:** Eine Application pro Umgebung, oder ein ApplicationSet, das sie aus einer Vorlage erzeugt.

## Follow-ups
- Pull oder Push – was ist der Unterschied? → Bei Push deployt die Pipeline mit Cluster-Rechten. Bei Pull holt ArgoCD die Änderungen aus Git. Pull ist sicherer.
- Wie kommt ein neuer Image-Tag ins Git? → Die Pipeline baut das Image, schiebt es in die ACR und ändert den Tag im Deploy-Repo per Commit. *(Prüfen: wie das bei MATCH genau läuft.)*
- Was ist der Unterschied zwischen Synced und Healthy? → Synced: der Cluster entspricht Git. Healthy: die Ressourcen laufen wirklich, zum Beispiel alle Pods bereit.
- ArgoCD oder Flux? → Beide sind GitOps-Werkzeuge. ArgoCD hat eine starke UI. Flux ist schlanker und mehr CLI-orientiert.
- Wie machen Sie einen Rollback? → `git revert` des Commits. ArgoCD synchronisiert den alten Stand.

## Don't say
- „Ich mache schnell ein `kubectl edit` in Produktion.“ Das widerspricht GitOps.
- „GitOps heißt, das YAML liegt im Git.“ Entscheidend ist der automatische Abgleich.

## Words
- **abgleichen** = to reconcile
- **Hauptzweig** = main branch
- **zurücksetzen** = to revert, to reset
- **Umgebung** = environment
- **ziehen (Pull)** = to pull
