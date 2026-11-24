---
id: tech-spring-security
round: tech
tech: [spring]
tier: 1
project: CARIAD (Keycloak), DigiSanté (JWT RS256)
q: Wie funktioniert Spring Security? Wie sichern Sie eine REST-API mit JWT und Keycloak?
en: How does Spring Security work? How do you secure a REST API with JWT and Keycloak?
---
## 30s
Spring Security ist eine Kette von Servlet-Filtern vor dem Controller.
Jeder Filter hat eine Aufgabe: Token lesen, prüfen, Rechte prüfen.
Für eine REST-API ist mein Service ein OAuth2 Resource Server.
Keycloak gibt das JWT aus. Mein Service prüft nur die Signatur und die Claims.
Bei CARIAD lief der Login über Keycloak mit LDAP.
Bei DigiSanté haben wir JWTs mit RS256 gegen den Public Key aus dem Key Vault geprüft, bevor das erste Byte gespeichert wurde.
Soll ich die Konfiguration zeigen?

## 90s
**Die Filter-Kette:**
1. Der Servlet-Container ruft `DelegatingFilterProxy` auf.
2. Dieser gibt an `FilterChainProxy` weiter.
3. Spring wählt eine `SecurityFilterChain` passend zur URL.
4. Der `BearerTokenAuthenticationFilter` liest `Authorization: Bearer <jwt>`.
5. Der `JwtDecoder` prüft Signatur, Ablaufzeit (`exp`) und Issuer (`iss`).
6. Das Ergebnis kommt in den `SecurityContext`. Dann prüft die Autorisierung die Rollen.

**Konfiguration (Spring Boot 3):**
```yaml
spring.security.oauth2.resourceserver.jwt.issuer-uri: https://keycloak.example/realms/demo
```
```java
@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())                       // stateless API mit Bearer Token
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(a -> a
            .requestMatchers("/actuator/health/**").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/declarations/**").hasRole("SUBMITTER")
            .anyRequest().authenticated())
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
        .build();
}
```
Spring holt die Public Keys automatisch vom JWKS-Endpoint von Keycloak.

## 3min
**Keycloak-Rollen:** Keycloak legt Realm-Rollen in den Claim `realm_access.roles`. Spring liest standardmässig nur `scope` und macht daraus `SCOPE_...`. Darum brauche ich einen eigenen `JwtAuthenticationConverter`. Er mappt die Keycloak-Rollen auf `ROLE_...`.

**Methoden-Sicherheit:** Mit `@EnableMethodSecurity` und `@PreAuthorize("hasRole('ADMIN')")`. Für Mandanten-Regeln prüfe ich zusätzlich im Service: Gehört der Datensatz zum Mandanten im Token?

**Was ich immer prüfe:**
- Signatur mit asymmetrischem Algorithmus (RS256). Nie `alg: none` akzeptieren.
- Issuer und Audience. Ein Token für einen anderen Service darf nicht gelten.
- Kurze Lebensdauer vom Access Token. Refresh nur im Client, nicht im Backend.
- Keine Tokens im Log.

**Trade-offs:**
- JWT ist stateless und schnell. Aber ein Token kann man nicht sofort widerrufen. Darum kurze Lebensdauer.
- Token Introspection (opaque Tokens) kann man widerrufen. Aber jeder Request fragt Keycloak.

**Seit Spring Security 6:** `WebSecurityConfigurerAdapter` gibt es nicht mehr. Man definiert `SecurityFilterChain`-Beans. `authorizeRequests` ist ersetzt durch `authorizeHttpRequests`.

## Follow-ups
- Warum ist CSRF hier deaktiviert? → CSRF nutzt Cookies aus, die der Browser automatisch mitschickt. Ein Bearer Token schickt der Browser nicht automatisch. Mit Session-Cookies lasse ich CSRF an.
- Was ist der Unterschied zwischen Authentifizierung und Autorisierung? → Authentifizierung: Wer sind Sie? Autorisierung: Was dürfen Sie?
- Woher kennt der Service den Public Key? → Aus dem JWKS-Endpoint vom Issuer. Spring cached die Keys und lädt neue bei Key-Rotation.
- Was ist der Unterschied zwischen 401 und 403? → 401: nicht authentifiziert, Token fehlt oder ist ungültig. 403: authentifiziert, aber keine Berechtigung.
- Wie testen Sie Security? → Mit `@WebMvcTest` und `jwt()` aus `spring-security-test`. Ich teste erlaubte und verbotene Fälle.

## Don't say
- „JWT ist verschlüsselt.“ Normalerweise nur signiert. Jeder kann den Inhalt lesen.
- „Ich speichere die Rolle in der Session.“ Bei einer stateless API gibt es keine Session.

## Words
- **die Filterkette** = filter chain
- **die Signatur prüfen** = to verify the signature
- **widerrufen** = to revoke
- **die Berechtigung** = permission
- **der Aussteller (Issuer)** = wer das Token erstellt hat
