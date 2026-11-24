---
id: tech-spring-testing
round: tech
tech: [spring, testing]
tier: 1
project: CARIAD, ElCom MATCH (Testcontainers)
q: Wie testen Sie eine Spring-Boot-Anwendung? Wann @SpringBootTest, wann Test Slices, wann Testcontainers?
en: How do you test a Spring Boot application? When @SpringBootTest, when test slices, when Testcontainers?
---
## 30s
Ich teste in Schichten.
Die Fachlogik teste ich mit reinen Unit-Tests, ohne Spring. Das ist am schnellsten.
Für eine Schicht nehme ich Test Slices: `@WebMvcTest` für Controller, `@DataJpaTest` für Repositories.
`@SpringBootTest` startet den ganzen Kontext. Das nehme ich nur für wenige End-to-End-Fälle.
Für die Datenbank nehme ich Testcontainers mit echtem PostgreSQL, keine H2.
Bei CARIAD habe ich Unit- und Integrationstests geschrieben und REST-Services mit Swagger getestet. Bei MATCH liefen 121 Tests mit Testcontainers. Das war die .NET-Seite, aber das Prinzip ist gleich.
Soll ich ein Beispiel zeigen?

## 90s
**Controller-Slice:**
```java
@WebMvcTest(DeclarationController.class)
class DeclarationControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean DeclarationService service;   // Spring Boot 3.4+, vorher @MockBean

    @Test
    void returns404WhenMissing() throws Exception {
        when(service.find("x")).thenThrow(new DeclarationNotFoundException("x"));
        mvc.perform(get("/api/declarations/x")).andExpect(status().isNotFound());
    }
}
```

**Repository mit echtem PostgreSQL (Spring Boot 3.1+):**
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class DeclarationRepositoryTest {
    @Container @ServiceConnection
    static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:16");
}
```
`@ServiceConnection` setzt URL, User und Passwort automatisch.

**Die Slices:** `@WebMvcTest`, `@DataJpaTest`, `@JsonTest`, `@RestClientTest`. Jede lädt nur die Beans für ihre Schicht.

## 3min
**Warum keine H2?** H2 ist nicht PostgreSQL. JSONB, Window Functions, PostGIS oder Flyway-Skripte verhalten sich anders. Ein grüner Test mit H2 beweist wenig.

**Geschwindigkeit:**
- Spring cached den Kontext zwischen Tests. Aber jede andere Kombination aus Mocks oder Properties baut einen neuen Kontext. Das macht die Suite langsam.
- Darum: wenige, einheitliche Basis-Konfigurationen.
- Ein Container für alle Tests (statisch, wiederverwendet), nicht einer pro Test.

**Was ich bei MATCH gelernt habe:**
- Docker 29 hat lokal unsere 121 Testcontainers-Tests gebrochen. Wir haben lokal die Version gepinnt und uns auf die CI mit kontrollierter Docker-Version verlassen.
- In der CI wurde der SQL-Server-Container OOM-killed, weil Tests parallel liefen. Wir haben ihn auf 2 GB begrenzt und die schweren Tests seriell gemacht.

**Trade-offs:**
- Zu viele `@SpringBootTest` → langsame Pipeline. Entwickler laufen die Tests nicht mehr lokal.
- Zu viele Mocks → Tests prüfen nur die Mocks. Integration mit echter DB findet mehr echte Fehler.

**Weitere Werkzeuge:** WireMock für externe REST-APIs. Kafka als Testcontainer für Event-Tests. `@Transactional` im Test macht am Ende Rollback; das ist bequem, aber es kann Fehler beim Commit verstecken.

## Follow-ups
- Was ist der Unterschied zwischen @Mock und @MockitoBean? → `@Mock` ist reines Mockito, ohne Spring. `@MockitoBean` ersetzt eine Bean im Spring-Kontext.
- Warum ist meine Test-Suite so langsam? → Oft viele verschiedene Kontexte. Ich prüfe, welche Tests eigene Mocks oder Properties haben, und vereinheitliche sie.
- Rollt @DataJpaTest zurück? → Ja, jeder Test läuft in einer Transaktion mit Rollback am Ende.
- Wie testen Sie einen REST-Client? → Mit `@RestClientTest` oder WireMock. So teste ich auch Timeouts und Fehler-Codes.
- Was teste ich mit @SpringBootTest? → Wenige wichtige Abläufe von Anfang bis Ende, mit `webEnvironment = RANDOM_PORT`.

## Don't say
- „Ich teste alles mit @SpringBootTest.“ Langsam und unklar, was getestet wird.
- „H2 reicht für Tests.“ Nicht, wenn Produktion PostgreSQL ist.

## Words
- **die Test-Slice** = Test für eine Schicht der App
- **der Kontext** = Spring ApplicationContext
- **vortäuschen (mocken)** = to mock
- **die Suite** = alle Tests zusammen
- **seriell** = nacheinander, nicht parallel
