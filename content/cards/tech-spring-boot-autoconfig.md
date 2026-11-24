---
id: tech-spring-boot-autoconfig
round: tech
tech: [spring]
tier: 2
project: BAG DigiSanté (Audit-Library)
q: Wie funktioniert die Auto-Configuration von Spring Boot? Haben Sie schon einen eigenen Starter gebaut?
en: How does Spring Boot auto-configuration work? Have you built your own starter?
---
## 30s
Ein Starter ist ein Paket von Abhängigkeiten, zum Beispiel `spring-boot-starter-web`.
Die Auto-Configuration erstellt dann passende Beans automatisch.
Sie nutzt Bedingungen: Ist eine Klasse da? Fehlt eine Bean? Ist ein Property gesetzt?
Bei DigiSanté habe ich eine eigene Autoconfigure-Library gebaut: Audit Logging nach DSG.
Die Services binden nur die Library ein. Dann schreiben sie Audit-Logs asynchron nach Azure Monitor, über einen privaten Data Collection Endpoint mit Managed Identity.
Soll ich zeigen, wie so eine Library aufgebaut ist?

## 90s
**Ablauf beim Start:**
1. `@SpringBootApplication` enthält `@EnableAutoConfiguration`.
2. Spring Boot liest alle Dateien `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` im Classpath.
3. Jede gelistete Klasse ist eine `@AutoConfiguration`.
4. Spring prüft ihre Bedingungen. Nur passende Beans werden erstellt.
5. Eigene Beans der App haben Vorrang, wegen `@ConditionalOnMissingBean`.

**Beispiel einer eigenen Library:**
```java
@AutoConfiguration
@ConditionalOnClass(AuditClient.class)
@ConditionalOnProperty(prefix = "audit", name = "enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(AuditProperties.class)
public class AuditAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    AuditClient auditClient(AuditProperties props) {
        return new AuditClient(props.endpoint());
    }
}
```
Die Klasse steht als eine Zeile in der `.imports`-Datei.
*(Prüfen: Wie war Ihre Audit-Library konkret aufgebaut? Namen der Klassen und Properties anpassen.)*

## 3min
**Warum eine eigene Library?** Viele Services brauchen dasselbe Audit-Logging. Ohne Library kopiert jedes Team den Code. Mit Library ist das Format einheitlich und DSG-konform. Ein Update geht über eine neue Version.

**Design-Regeln für eine gute Library:**
- Immer `@ConditionalOnMissingBean`. Der Service kann jede Bean überschreiben.
- Properties mit `@ConfigurationProperties` und Validierung. Sinnvolle Defaults.
- Keine Abhängigkeit auf eine bestimmte App. Nur das Minimum im Classpath.
- Asynchron senden, damit ein langsamer Endpoint den Request nicht bremst. Aber: Audit-Daten dürfen nicht still verloren gehen. Darum Fehler messen und alarmieren. *(Prüfen: Wie haben Sie bei DigiSanté Fehler beim Senden behandelt?)*
- Tests mit `ApplicationContextRunner`: Kontext mit und ohne Property starten und prüfen, welche Beans es gibt.

**Debugging:** Mit `--debug` oder `debug=true` druckt Spring Boot den Condition Evaluation Report. Er zeigt, welche Auto-Configuration aktiv ist und warum. Mit Actuator gibt es `/actuator/conditions`.

**Änderung in Spring Boot 3:** Auto-Configurations stehen nicht mehr in `spring.factories`, sondern in der `.imports`-Datei.

**Trade-off:** Auto-Configuration ist bequem, aber "Magie". Neue Teammitglieder verstehen nicht, woher eine Bean kommt. Darum dokumentiere ich die Library und ihre Properties gut.

## Follow-ups
- Wie schalte ich eine Auto-Configuration aus? → Mit `@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)` oder `spring.autoconfigure.exclude`.
- Was ist der Unterschied zwischen Starter und Autoconfigure-Modul? → Das Autoconfigure-Modul enthält den Code. Der Starter ist nur ein POM, das alle nötigen Abhängigkeiten zusammenbringt.
- Wie stelle ich die Reihenfolge sicher? → Mit `@AutoConfiguration(after = ...)` oder `before`.
- Wie testen Sie die Library? → Mit `ApplicationContextRunner`. Ohne vollen App-Start, sehr schnell.
- Warum @ConditionalOnMissingBean? → Damit der Service eine eigene Bean definieren kann. Die Library gibt nur den Default.

## Don't say
- „Spring Boot scannt einfach alle Klassen.“ Auto-Configuration kommt aus der `.imports`-Datei, nicht aus dem Component Scan.
- Keine Details zur Audit-Library erfinden. Nur sagen, was Sie wirklich gebaut haben.

## Words
- **die Bedingung** = condition
- **der Vorrang** = priority
- **einbinden** = to include (a dependency)
- **einheitlich** = uniform, consistent
- **überschreiben** = to override
