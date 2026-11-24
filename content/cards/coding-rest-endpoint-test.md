---
id: coding-rest-endpoint-test
round: coding
tech: [spring, rest, testing, java]
tier: 1
project: DigiSanté, DAZiT (Spring Boot services)
q: Schreiben Sie einen REST-Endpoint, der ein Produkt per ID liefert, und einen Test dazu.
en: Write a REST endpoint that returns a product by ID, and a test for it.
---
## 30s
Ich wiederhole: `GET /api/products/{id}` liefert ein Produkt als JSON. Gibt es das Produkt nicht, kommt 404.
Meine Fragen: Spring Boot 3? Gibt es schon eine Datenbank, oder reicht ein Service mit Mock? Welche Felder hat ein Produkt?
Mein Plan: ein Record für die Antwort, ein Service, ein Controller.
Der Controller ist dünn. Die Logik liegt im Service.
Dann ein `@WebMvcTest` mit MockMvc: ein Test für 200, ein Test für 404.
Spring Boot Services habe ich bei DigiSanté und DAZiT gebaut.

## 90s
**Controller:**
```java
public record ProductDto(long id, String name, BigDecimal price) {}

@RestController
@RequestMapping("/api/products")
class ProductController {

    private final ProductService service;

    ProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    ResponseEntity<ProductDto> byId(@PathVariable long id) {
        return service.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
```
`ProductService.findById` gibt ein `Optional<ProductDto>` zurück.

**Test:**
```java
@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired MockMvc mvc;
    @MockitoBean ProductService service;

    @Test
    void returnsProduct() throws Exception {
        when(service.findById(1L))
            .thenReturn(Optional.of(new ProductDto(1L, "Tee", new BigDecimal("4.50"))));

        mvc.perform(get("/api/products/1"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.name").value("Tee"));
    }

    @Test
    void returns404WhenMissing() throws Exception {
        when(service.findById(99L)).thenReturn(Optional.empty());

        mvc.perform(get("/api/products/99"))
           .andExpect(status().isNotFound());
    }
}
```
Laut gesagt: „Der Test startet nur die Web-Schicht. Den Service ersetze ich durch einen Mock. So ist der Test schnell.“

## 3min
**Warum so?**
- **Constructor Injection** statt `@Autowired` auf dem Feld. Das Feld ist `final`, und ich kann ohne Spring testen.
- **Record als DTO.** Ich gebe nie die JPA-Entity direkt zurück. Sonst hängt die API an der Datenbank, und Lazy Loading macht Probleme.
- **Optional bis zum Controller.** Kein `null`, klarer 404.

**Version beachten:** Seit Spring Boot 3.4 heisst die Annotation `@MockitoBean`. Vorher war es `@MockBean`. Das sage ich, falls das Projekt älter ist.

**Testpyramide:**
- Unit-Test für den Service, ohne Spring, schnell.
- `@WebMvcTest` für Controller: Status, JSON, Validierung.
- `@SpringBootTest` mit Testcontainers für den ganzen Weg bis PostgreSQL. Wenige, aber echte Tests.

**Fehlerbehandlung im grösseren Projekt:** Statt `ResponseEntity` im Controller wirft der Service eine `ProductNotFoundException`. Ein `@RestControllerAdvice` macht daraus 404 mit `ProblemDetail` (RFC 9457). So sind alle Fehler im gleichen Format.

**Wenn Zeit bleibt:** POST mit `@Valid` und einem Test für 400 bei ungültiger Eingabe.

## Follow-ups
- Was ist der Unterschied zwischen `@WebMvcTest` und `@SpringBootTest`? → `@WebMvcTest` lädt nur die Web-Schicht. `@SpringBootTest` startet den ganzen Kontext, langsamer, aber echter.
- Wie testen Sie mit einer echten Datenbank? → Testcontainers mit PostgreSQL und `@ServiceConnection`. Gleiche Version wie in Produktion.
- Wie validieren Sie die Eingabe? → Bean Validation: `@NotBlank`, `@Positive` auf dem Record und `@Valid` im Controller. Fehler gibt 400.
- Warum nicht die Entity zurückgeben? → Die API und die Datenbank sollen sich getrennt ändern können. Ausserdem keine Lazy-Loading-Fehler und keine internen Felder nach aussen.
- Wie sichern Sie den Endpoint? → Spring Security als OAuth2 Resource Server, JWT prüfen, Rollen mit `@PreAuthorize`.

## Don't say
- Nicht `@Autowired` auf private Felder als Standard zeigen.
- Nicht nur den Happy Path testen. Der 404-Test gehört dazu.

## Words
- **Endpoint** = API route
- **dünner Controller** = thin controller, no business logic
- **Mock** = test double, fake object
- **Testpyramide** = many unit tests, fewer integration tests
- **Schicht** = layer
