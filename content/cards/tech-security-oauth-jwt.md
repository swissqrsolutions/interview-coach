---
id: tech-security-oauth-jwt
round: tech
tech: [security]
tier: 1
project: DigiSanté (JWT RS256 vor dem ersten Byte), MATCH und CARIAD (Keycloak)
q: Erklären Sie OAuth2, OpenID Connect und JWT. Wie prüfen Sie ein Token?
en: Explain OAuth2, OpenID Connect and JWT. How do you validate a token?
---
## 30s
OAuth2 regelt die Autorisierung: Eine App bekommt ein Access Token für eine API.
OpenID Connect baut darauf auf und regelt die Anmeldung. Es gibt zusätzlich ein ID Token.
Ein JWT ist ein signiertes Token mit Header, Payload und Signatur.
Bei RS256 signiert der Server mit einem privaten Schlüssel. Ich prüfe mit dem öffentlichen.
Bei DigiSanté prüft der Upload das JWT gegen den öffentlichen Schlüssel aus Key Vault, bevor das erste Byte gespeichert wird.
Bei MATCH und CARIAD nutzen wir Keycloak für das Login.
Soll ich die Prüfung Schritt für Schritt zeigen?

## 90s
**Der Flow für eine Web-App: Authorization Code mit PKCE**
1. Die App schickt den Nutzer zu Keycloak.
2. Der Nutzer meldet sich an.
3. Keycloak schickt einen kurzen Code zurück.
4. Die App tauscht den Code gegen Tokens. PKCE beweist, dass es dieselbe App ist.
5. Die App ruft die API mit `Authorization: Bearer <access token>` auf.

**Service zu Service:** Client Credentials. Kein Nutzer, die App meldet sich selbst an.

**Ein Token prüfen (in dieser Reihenfolge):**
1. Signatur mit dem öffentlichen Schlüssel (JWKS, passend zur `kid`).
2. Algorithmus fest erwarten, zum Beispiel nur RS256. Nie `alg: none`.
3. `iss`: vom richtigen Aussteller?
4. `aud`: für meine API?
5. `exp` und `nbf`: noch gültig? Kleine Toleranz für Uhrzeit.
6. Rollen oder Scopes für diese Aktion.

**Spring Boot als Resource Server:**
```
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://keycloak.example.ch/realms/demo   # Beispiel
```
Laut gesagt: „Spring holt die Schlüssel vom Issuer und prüft Signatur, Ablauf und Aussteller automatisch. Die Audience prüfe ich zusätzlich.“

## 3min
**RS256 gegen HS256:**
- HS256: ein gemeinsames Geheimnis. Jeder, der prüfen kann, kann auch signieren.
- RS256: privater Schlüssel signiert, öffentlicher prüft. Viele Services können prüfen, nur einer signiert. Für verteilte Systeme die bessere Wahl.

**DigiSanté konkret:** Das JWT wird geprüft, bevor das erste Byte gespeichert wird. So landet von unbekannten Absendern nichts im Storage. Der öffentliche Schlüssel kommt aus Key Vault.

**Typische Fehler:**
- Nur dekodieren, nicht prüfen. Base64 lesen ist keine Prüfung.
- `aud` nicht prüfen: Ein Token für eine andere API wird akzeptiert.
- Tokens zu lange gültig. Access Tokens kurz (Minuten), dazu Refresh Tokens.
- Tokens im `localStorage` im Browser: XSS kann sie stehlen. Besser: Backend-for-Frontend mit HttpOnly-Cookie.

**Widerruf:** Ein JWT ist bis `exp` gültig, auch nach einem Logout. Lösungen: kurze Laufzeit, Token Introspection für kritische Fälle, oder eine Sperrliste.

**Keycloak:** Bei CARIAD lief die LDAP-Anmeldung über Keycloak. Bei MATCH ist Keycloak Teil des Stacks im Helm Chart und macht das Login. Die Begriffe: Realm (Bereich), Client (App), Rollen. Die Rollen kommen als Claims ins Token.

## Follow-ups
- Was ist der Unterschied zwischen ID Token und Access Token? → Das ID Token ist für die App: wer ist der Nutzer. Das Access Token ist für die API: was darf die App.
- Was ist PKCE? → Ein Schutz für den Code-Austausch. Die App beweist mit einem Geheimnis aus dem ersten Schritt, dass sie den Code angefordert hat.
- Wie wechseln Sie Schlüssel (Rotation)? → Der Issuer veröffentlicht alten und neuen Schlüssel im JWKS. Die `kid` im Token sagt, welcher gilt.
- Was ist der Implicit Flow? → Ein alter Flow ohne Code-Austausch. Er gilt als unsicher. Heute nimmt man Authorization Code mit PKCE.
- Sind JWTs verschlüsselt? → Normalerweise nicht, nur signiert. Jeder kann den Inhalt lesen. Keine sensiblen Daten hinein.

## Don't say
- „OAuth2 ist ein Login-Protokoll.“ Die Anmeldung ist OpenID Connect.
- „Das JWT ist sicher, weil es Base64 ist.“

## Words
- **Autorisierung** = authorisation (was darf ich)
- **Authentifizierung** = authentication (wer bin ich)
- **Aussteller** = issuer
- **Widerruf** = revocation
- **signieren / prüfen** = to sign / to verify
