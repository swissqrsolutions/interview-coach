---
id: tech-spring-config-profiles
round: tech
tech: [spring]
tier: 2
project: BIT DAZiT, ElCom MATCH (Secrets)
q: Wie verwalten Sie Konfiguration in Spring Boot? Was sind Profile, und wo liegen Secrets?
en: How do you manage configuration in Spring Boot? What are profiles, and where do secrets live?
---
## 30s
Spring Boot liest Konfiguration aus vielen Quellen: Dateien, Umgebungsvariablen, Kommandozeile.
Es gibt eine feste Reihenfolge. Umgebungsvariablen überschreiben die Datei.
Profile sind Varianten, zum Beispiel `local` oder `test`.
Ich binde Konfiguration typ-sicher mit `@ConfigurationProperties`.
Secrets kommen nie ins Repo. Bei MATCH kamen sie aus Vault und Azure Key Vault über den External Secrets Operator in Kubernetes.
Soll ich die Reihenfolge der Quellen zeigen?

## 90s
**Dateien:**
- `application.yml`: Standardwerte für alle.
- `application-local.yml`: nur mit Profil `local`. Aktivieren mit `spring.profiles.active=local`.

**Typ-sicher binden:**
```java
@ConfigurationProperties(prefix = "declaration.import")
@Validated
public record ImportProperties(@NotBlank String sourceUrl, @Min(1) int batchSize, Duration timeout) {}
```
```yaml
declaration.import:
  source-url: https://example/api
  batch-size: 500
  timeout: 30s
```

**Reihenfolge (vereinfacht, oben gewinnt):**
1. Kommandozeilen-Argumente
2. Umgebungsvariablen, zum Beispiel `DECLARATION_IMPORT_BATCHSIZE=1000` (Relaxed Binding)
3. `application-{profil}.yml`
4. `application.yml`

**In Kubernetes:** Werte aus ConfigMaps und Secrets als Umgebungsvariablen. Oder als Dateien mit `spring.config.import: configtree:/etc/secrets/`.

## 3min
**Meine Regeln:**
- **Ein Artefakt für alle Umgebungen.** Dasselbe Image läuft in Test und Produktion. Nur die Konfiguration von aussen ändert sich.
- **Wenig Profile.** Profile wie `dev`, `test`, `prod` mit vielen Unterschieden führen zu Überraschungen in Produktion. Lieber Werte über Umgebungsvariablen.
- **Profile für Verhalten, nicht für Werte.** Zum Beispiel `@Profile("local")` für einen Fake-Client lokal.
- **Fail fast.** Mit `@Validated` startet der Service nicht, wenn ein Pflichtwert fehlt. Das ist besser als ein Fehler um 3 Uhr nachts.

**Secrets:**
- Nie im Git, nie im Image, nie im Log.
- Bei MATCH: HashiCorp Vault und External Secrets Operator. Azure Key Vault über Workload Identity. Secrets werden automatisch erneuert. Die MATCH-Services selbst waren .NET, aber das Prinzip ist für Spring gleich.
- Bei DigiSanté: Managed Identity statt Passwörtern, wo es geht. Dann gibt es gar kein Secret.

**Fehler, die ich gesehen habe:** SonarQube hat bei MATCH hartcodierte Passwörter in Test-Fixtures gefunden. Wir haben sie entfernt und Ausnahmen dokumentiert, statt Regeln global auszuschalten.

**@Value vs @ConfigurationProperties:** `@Value` ist ok für einen einzelnen Wert. Für Gruppen ist `@ConfigurationProperties` besser: typ-sicher, validiert, testbar, mit IDE-Unterstützung.

## Follow-ups
- Wie aktiviere ich zwei Profile? → `spring.profiles.active=local,kafka`. Oder Profil-Gruppen mit `spring.profiles.group`.
- Wie ändere ich Konfiguration ohne Neustart? → Normal braucht es einen Neustart. In Kubernetes ist ein Rolling Restart einfach und sicher.
- Was ist Relaxed Binding? → `batch-size`, `batchSize` und `BATCHSIZE` in einer Umgebungsvariable zeigen auf dasselbe Property.
- Wo prüfe ich, welcher Wert gewinnt? → Mit Actuator `/actuator/env`, nur intern und geschützt.
- Gehören Secrets in eine ConfigMap? → Nein. In ein Kubernetes Secret, besser noch aus einem Vault synchronisiert.

## Don't say
- „Wir haben ein eigenes Build pro Umgebung.“ Das widerspricht "build once, deploy many".
- „Das Passwort steht in application-prod.yml.“ Ein klares Sicherheitsproblem.

## Words
- **die Umgebungsvariable** = environment variable
- **überschreiben** = to override
- **das Profil** = profile, Variante der Konfiguration
- **der Pflichtwert** = required value
- **erneuern** = to rotate / refresh
