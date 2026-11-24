---
id: critique-secrets-in-config
round: critique
tech: [security, k8s, gitops, azure]
tier: 1
project: ElCom MATCH (Vault + External Secrets Operator)
q: Die Passwörter stehen in der application.yml im Git-Repository. Was sagen Sie dazu?
en: The passwords are in application.yml in the Git repository. What do you say?
---
## 30s
**Die Architektur (als Text):**
```
Git-Repo: application.yml mit DB-Passwort, API-Key, Keycloak-Secret
CI-Pipeline: druckt die Konfiguration ins Build-Log
Kubernetes: Werte als Klartext-Umgebungsvariablen im Deployment-YAML
Rotation: nie
```
Das ist ein grosses Sicherheitsproblem.
Jeder mit Lesezugriff auf Git hat die Passwörter. Auch in der Git-Historie für immer.
Das Build-Log verteilt sie weiter.
Fix: Secrets in einen Secret Store, zum Beispiel Vault oder Azure Key Vault. Kein Secret im Repo.
So haben wir es bei MATCH gemacht: Vault, External Secrets Operator, Azure Key Vault über Workload Identity.

## 90s
**Meine Liste mit Fix und Trade-off:**
1. **Verfügbarkeit:** Ein geleaktes Secret muss sofort geändert werden. Ohne Rotation ist das ein Ausfall. → Automatische Rotation und Apps, die neue Secrets ohne Neustart laden.
2. **Sicherheit:** Der Hauptpunkt.
   - Secrets in einen Secret Store.
   - In Kubernetes: External Secrets Operator holt sie und macht daraus Kubernetes Secrets.
   - Zugriff auf den Store ohne Passwort: Managed Identity oder Workload Identity.
   - Secret Scanning in der Pipeline, zum Beispiel SonarQube oder gitleaks.
   - Das alte Passwort sofort rotieren. Löschen aus Git reicht nicht.
3. **Konsistenz:** Verschiedene Umgebungen mit gleichem Passwort? → Pro Umgebung eigene Secrets.
4. **Kopplung:** Die App kennt den Store nicht. Sie liest Umgebungsvariablen oder Dateien. → Austauschbar.
5. **Skalierung:** Kein Thema.
6. **Monitoring:** Wer hat wann welches Secret gelesen? → Audit-Logs im Secret Store.
7. **Kosten:** Vault braucht Betrieb. Key Vault ist günstig und gemanagt.

## 3min
**Erste Schritte, wenn ein Secret im Git war:**
1. Secret sofort rotieren. Das ist das Wichtigste.
2. Prüfen, ob es benutzt wurde: Logs der Datenbank oder der API.
3. Dann erst aus der Historie entfernen, zum Beispiel mit `git filter-repo`. Forks und Klone haben es trotzdem noch.
4. Secret Scanning aktivieren, damit es nicht wieder passiert.

**Kubernetes Secrets sind nicht verschlüsselt:** Sie sind nur Base64. Darum Encryption at Rest in etcd und RBAC, wer Secrets lesen darf. Und Secrets nie in Helm-Values im Repo.

**Aus meiner Praxis, MATCH:** HashiCorp Vault plus External Secrets Operator, Azure Key Vault über Workload Identity, automatische Aktualisierung der Secrets. Keine Secrets im Repo. Bei GitOps mit ArgoCD ist das besonders wichtig, weil das Repo die Wahrheit ist. SonarQube hat einmal Passwörter in Test-Fixtures und im lokalen Compose gemeldet. Wir haben die Fake-Passwörter entfernt, das lokale Compose mit Begründung ausgeschlossen und die Ausnahmen dokumentiert. Nie pauschal abgeschaltet.

**Bei DigiSanté:** Der JWT-Public-Key kommt aus Key Vault. Key Vault ist nur über einen Private Endpoint erreichbar.

**Trade-off:** Ein externer Secret Store ist eine neue Abhängigkeit. Fällt er aus, starten neue Pods nicht. Darum sind die synchronisierten Kubernetes Secrets ein Puffer: Laufende Pods arbeiten weiter.

## Follow-ups
- Sind Kubernetes Secrets sicher? → Nur Base64, nicht verschlüsselt. Mit Encryption at Rest, RBAC und einem externen Store sind sie okay.
- Was ist Workload Identity? → Ein Pod bekommt eine Azure-Identität über OIDC-Federation. Er braucht kein gespeichertes Passwort für Key Vault.
- Wie geht Rotation ohne Ausfall? → Zwei gültige Secrets gleichzeitig, dann umstellen, dann das alte löschen. Die App lädt neu oder startet rollierend neu.
- Und Sealed Secrets oder SOPS? → Verschlüsselte Secrets im Git. Gut für GitOps. Aber Schlüsselverwaltung und Rotation sind schwerer als mit einem zentralen Store.
- Was ist mit lokalen Entwickler-Passwörtern? → Nur Fake-Werte für lokal, klar markiert. Echte Werte nie lokal im Repo.

## Don't say
- „Das Repo ist privat, also ist es okay.“
- „Ich lösche die Datei aus Git, dann ist es weg.“ Die Historie und Klone haben es noch.

## Words
- **Secret** = password, key, token
- **Rotation** = regular change of a secret
- **Secret Store** = central safe for secrets (Vault, Key Vault)
- **Klartext** = plain text
- **geleakt** = leaked
