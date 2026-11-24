---
id: critique-no-auth-between-services
round: critique
tech: [security, microservices, k8s]
tier: 1
project: ElCom MATCH (Cilium, Keycloak), DigiSanté (JWT, private endpoints)
q: Die Services sprechen intern ohne Authentifizierung miteinander. Ist das sicher?
en: The services talk to each other internally without authentication. Is that secure?
---
## 30s
**Die Architektur (als Text):**
```
Internet → API-Gateway (prüft JWT) → interne Services
interne Services → rufen sich gegenseitig per HTTP auf, ohne Token, ohne TLS
"Das interne Netz ist sicher."
```
Nein, das ist nicht sicher. Das Problem heisst: harte Schale, weicher Kern.
Kommt ein Angreifer in einen Pod, kann er alle Services aufrufen.
Ein Fehler im Gateway öffnet alles. Es gibt keine Zero Trust.
Fix: Jeder Service prüft ein Token. Network Policies erlauben nur nötige Verbindungen. Verkehr mit TLS.
Bei MATCH regeln Cilium Network Policies, welche Pods mit MSSQL, MinIO und Vault sprechen dürfen.

## 90s
**Meine Liste mit Fix und Trade-off** (hier steht Sicherheit im Fokus, aber ich gehe die Reihenfolge durch):
1. **Verfügbarkeit:** Jeder kann jeden Service aufrufen. Ein Fehler oder Angreifer kann interne Services überlasten. → Network Policies und Rate Limits.
2. **Sicherheit:**
   - **Authentifizierung:** Jeder Service prüft ein JWT. Signatur, Ablauf, Audience. Für Service-zu-Service: OAuth2 Client Credentials, zum Beispiel mit Keycloak oder Entra ID. Oder mTLS mit einem Service Mesh.
   - **Autorisierung:** Darf Service A diese Aktion bei Service B? Scopes oder Rollen prüfen.
   - **Netz:** Default deny. Nur erlaubte Verbindungen.
   - **Verschlüsselung:** TLS auch intern. Personendaten im Klartext im Cluster sind ein Risiko.
3. **Konsistenz:** Wer hat die Daten geändert? Ohne Identität kein Audit. → Service-Identität im Audit-Log.
4. **Kopplung:** Tokens weiterreichen koppelt Services an den Nutzer-Kontext. → Token Exchange oder klare Service-Rollen.
5. **Skalierung:** Token-Prüfung kostet wenig, wenn die Public Keys gecacht sind (JWKS).
6. **Monitoring:** Abgelehnte Aufrufe zählen und alarmieren. Hubble zeigt bei Cilium blockierte Verbindungen.
7. **Kosten:** Ein Service Mesh kostet Ressourcen und Know-how. Network Policies und JWT sind günstiger.

## 3min
**Zero Trust in einem Satz:** „Kein Aufruf ist vertrauenswürdig, nur weil er aus dem internen Netz kommt.“

**Optionen im Vergleich:**
- **JWT pro Service:** Einfach mit Spring Security als Resource Server. Feine Rechte möglich. Aber jeder Service muss es richtig machen.
- **mTLS mit Service Mesh (Istio, Linkerd):** Identität für jeden Pod, Verschlüsselung automatisch. Kosten: Komplexität und Sidecar-Ressourcen.
- **Network Policies:** Grobe Regeln auf Netzebene. Billig und stark als zweite Linie. Nicht genug allein.
Ich empfehle mindestens zwei Linien: Network Policies plus Token-Prüfung.

**Aus meiner Praxis:**
- **MATCH:** Cilium Network Policies bestimmen, welche Pods mit MSSQL, MinIO und Vault sprechen dürfen. Hubble zeigt den Verkehr. Kyverno erlaubt nur Images aus der ACR und keine privilegierten Pods. Login über Keycloak.
- **DigiSanté:** Das JWT (RS256) wird gegen den Public Key aus Key Vault geprüft, bevor das erste Byte gespeichert wird. Functions, Storage, Key Vault und Event Hub sind nur über Private Endpoints erreichbar.

**Wie ich es einführe, ohne alles zu brechen:** Zuerst den Verkehr beobachten, zum Beispiel mit Hubble oder dem Audit-Modus von Cilium. Dann default deny pro Namespace. Token-Prüfung Service für Service, mit Monitoring der Ablehnungen.

## Follow-ups
- Was ist der Unterschied zwischen Authentifizierung und Autorisierung? → Authentifizierung: Wer bist du? Autorisierung: Was darfst du?
- Reicht ein API-Gateway nicht? → Nein. Es schützt nur den Eingang. Interne Angreifer oder ein falsch konfiguriertes Routing umgehen es.
- Was ist mTLS? → Beide Seiten zeigen ein Zertifikat. So kennt der Server den Client und umgekehrt.
- Wie prüft ein Service ein JWT schnell? → Er lädt die Public Keys einmal (JWKS) und cacht sie. Dann prüft er die Signatur lokal, ohne Aufruf beim IdP.
- Was ist Client Credentials? → Ein OAuth2-Flow für Maschinen. Der Service holt mit seiner ID und seinem Secret ein Token, ohne Nutzer.

## Don't say
- „Unser Netz ist intern, also sicher.“
- „Ein Service Mesh löst alles.“ Autorisierung im Service bleibt nötig.

## Words
- **Zero Trust** = trust nothing by default
- **Network Policy** = firewall rule between pods
- **mTLS** = mutual TLS, both sides show a certificate
- **Service-Identität** = identity of a service, not a user
- **default deny** = block everything, allow only what is needed
