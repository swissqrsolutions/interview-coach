---
id: tech-security-owasp
round: tech
tech: [security]
tier: 2
project: DigiSanté (Upload: Tika, JWT, Quarantäne), MATCH (SonarQube, Kyverno)
q: Was ist die OWASP Top 10, und wie schützen Sie eine Anwendung konkret?
en: What is the OWASP Top 10, and how do you protect an application in practice?
---
## 30s
Die OWASP Top 10 ist eine Liste der häufigsten Sicherheitsrisiken in Web-Anwendungen.
Platz 1 ist seit Jahren Broken Access Control: Ein Nutzer sieht Daten, die nicht seine sind.
Weitere wichtige Punkte: Injection, falsche Konfiguration, schwache Authentifizierung, unsichere Abhängigkeiten.
Bei DigiSanté schützen wir den Datei-Upload mehrfach: JWT-Prüfung vor dem ersten Byte, echter Dateityp mit Apache Tika, Virenscan in Quarantäne.
Soll ich die wichtigsten Risiken mit Gegenmaßnahmen zeigen?

## 90s
**Die Risiken, die ich immer prüfe:**
- **Broken Access Control:** Jeder Endpoint prüft Rechte auf dem Server. Auch beim Objekt: Darf dieser Nutzer genau diesen Datensatz sehen? (IDOR)
- **Injection:** Nie SQL aus Strings bauen. Immer Parameter.
- **Security Misconfiguration:** Debug-Endpoints aus, Standard-Passwörter weg, öffentlicher Zugang nur bewusst.
- **Supply Chain / verwundbare Komponenten:** Abhängigkeiten scannen und aktualisieren. In der Liste 2025 sind Supply-Chain-Fehler eine eigene Kategorie.
- **Authentication Failures:** Tokens richtig prüfen: Signatur, Aussteller, Audience, Ablauf.
- **Logging Failures:** Sicherheitsereignisse loggen, ohne sensible Daten im Log.

**Injection, falsch und richtig:**
```
// falsch
String sql = "SELECT * FROM persons WHERE ahv = '" + ahv + "'";

// richtig
jdbc.query("SELECT * FROM persons WHERE ahv = ?", mapper, ahv);
```
Laut gesagt: „Mit Parametern trennt die Datenbank Code und Daten. Die Eingabe kann die Abfrage nicht ändern.“

## 3min
**DigiSanté: Upload als Beispiel für Verteidigung in Schichten:**
1. **Authentifizierung zuerst:** JWT RS256 gegen den öffentlichen Schlüssel aus Key Vault, bevor das erste Byte gespeichert wird.
2. **Dateityp an den Bytes:** Apache Tika erkennt den echten MIME-Typ. Eine `.pdf`-Endung auf einer `.exe` hilft nicht.
3. **Quarantäne:** Microsoft Defender scannt. Erst danach wird die Datei freigegeben oder gelöscht.
4. **Netzwerk:** Functions, Storage, Key Vault, Event Hub nur über Private Endpoints.
5. **Audit:** Eine gemeinsame Spring-Boot-Bibliothek für DSG-konformes Audit-Logging nach Azure Monitor.

**MATCH: Sicherheit in Pipeline und Cluster:**
- SonarQube fand fest kodierte Passwörter in Test-Fixtures und in der lokalen Compose-Datei. Ich habe die Fake-Passwörter entfernt, die lokale Datei mit Begründung ausgeschlossen und jede Ausnahme dokumentiert. Nie Regeln pauschal abgeschaltet.
- Kyverno: nur Images aus unserer ACR, keine privilegierten Pods.
- Cilium Network Policies: Nur bestimmte Pods sprechen mit MSSQL, MinIO und Vault.
- Keine Secrets im Repo: Vault, External Secrets, Key Vault.

**Was oft vergessen wird:**
- **SSRF:** Der Server ruft eine URL auf, die der Nutzer angibt. → Erlaubte Ziele festlegen.
- **Fehlerbehandlung:** Stacktraces nicht an den Client schicken.
- **Rate Limiting** auf Login und teure Endpoints.

## Follow-ups
- Was ist IDOR? → Insecure Direct Object Reference: `/persons/123` funktioniert auch für fremde IDs. Lösung: Rechte pro Objekt prüfen.
- Wie schützen Sie sich vor XSS in Angular? → Angular escaped Werte im Template automatisch. Kein `bypassSecurityTrust...` ohne guten Grund, dazu eine Content Security Policy.
- Was ist CSRF, und brauche ich Schutz? → Ein fremder Request mit den Cookies des Nutzers. Mit Bearer-Token im Header kaum ein Risiko. Mit Cookies: SameSite und CSRF-Token.
- Wie finden Sie verwundbare Abhängigkeiten? → Scanner in der CI, zum Beispiel OWASP Dependency-Check, Dependabot oder ein Image-Scan.

## Don't say
- „Wir sind im internen Netz, darum ist Sicherheit kein Thema.“
- „Die Prüfung macht das Frontend.“ Prüfen muss immer der Server.

## Words
- **Gegenmaßnahme** = countermeasure
- **Verteidigung in Schichten** = defence in depth
- **verwundbar** = vulnerable
- **Endung** = file extension
- **escapen** = Sonderzeichen unschädlich machen
