---
id: takehome-testing
round: takehome
tech: [testing, spring, python]
tier: 1
q: Wie haben Sie Ihre Lösung getestet?
en: How did you test your solution?
---
## 30s
Ich habe in drei Ebenen getestet.
Unit-Tests für die Logik: schnell, ohne Spring und ohne Datenbank.
Web-Tests für die API: Status, JSON und Fehlerfälle mit MockMvc.
Ein Integrationstest mit einer echten PostgreSQL in Testcontainers.
Ich teste nicht nur den Happy Path. Auch leere Eingaben, ungültige Werte und „nicht gefunden“.
Alle Tests laufen mit einem Befehl: `./mvnw verify` oder `pytest`.
*(Ihr echtes Beispiel: Anzahl Tests und was abgedeckt ist.)*

## 90s
**Beispiel Unit-Test (Java):**
```java
@Test
void appliesTenPercentDiscountFrom100() {
    var calc = new PriceCalculator();
    assertEquals(new BigDecimal("90.00"), calc.total(new BigDecimal("100.00")));
}
```
**Beispiel Integrationstest:**
```java
@SpringBootTest
@Testcontainers
class OrderFlowIT {
    @Container @ServiceConnection
    static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:16");
    // POST /orders, dann GET /orders/{id}, Ergebnis prüfen
}
```
**Beispiel PySpark (pytest):**
```python
def test_dedupes_orders(spark):
    df = spark.createDataFrame([("o1", 10), ("o1", 10), ("o2", 5)], ["id", "amount"])
    result = dedupe_orders(df)
    assert sorted(r.id for r in result.collect()) == ["o1", "o2"]
```
**Laut gesagt:** „Die Unit-Tests prüfen die Regeln. Der Integrationstest prüft, dass alles zusammen mit einer echten Datenbank läuft. Gleiche PostgreSQL-Version wie in Produktion.“

**Was ich teste, in dieser Reihenfolge:**
1. Die wichtigste Fachregel.
2. Fehlerfälle: 400, 404, kaputte Eingaben.
3. Randfälle: leer, null, Grenzen.
4. Einmal der ganze Weg bis zur Datenbank.

## 3min
**Warum Testcontainers statt H2?** H2 verhält sich anders als PostgreSQL: andere SQL-Dialekte, andere Typen, andere Sperren. Ein Test mit H2 kann grün sein, und Produktion scheitert. Testcontainers startet die echte Datenbank in Docker.

**Was ich nicht getestet habe, und warum:** Ich sage es offen. Zum Beispiel: „Getter und Mapper teste ich nicht einzeln. Sie laufen im Integrationstest mit.“ Oder: „Lasttests fehlen. Das wäre der nächste Schritt.“

**Testabdeckung:** Ich nenne die Zahl, aber ich verkaufe sie nicht als Qualität. 100 % Abdeckung sagt nicht, dass die Asserts gut sind. Wichtiger: Jede Fachregel hat einen Test.

**Aus meiner Praxis:**
- Bei MATCH war 100 % Ergebnis-Parität mit dem alten System das Kriterium für den Go-Live. Ein eigener Job `validate_parity.py` vergleicht die Ergebnisse Tabelle für Tabelle. Lektion: Geschäftslogik nie ohne maschinell prüfbaren Vergleich portieren.
- In der CI hat der OOM-Killer einmal den SQL-Server-Testcontainer beendet. Fix: Container auf 2 GB begrenzt, Speicher vor den Tests freigegeben, schnell scheitern beim Start, schwere Test-Sammlungen nacheinander.
- Docker 29 hat lokal 121 Testcontainers-Tests gebrochen. Lokal haben wir die Version festgehalten, die CI hat eine kontrollierte Docker-Version.
- Bei Unisys habe ich Testautomatisierung mit JUnit, Playwright und Cypress als Qualitätsstandard eingeführt und gepflegt.

## Follow-ups
- Haben Sie TDD gemacht? → *(Ehrlich sagen: ganz, teilweise oder nicht.)* Für Fachregeln schreibe ich den Test gern zuerst.
- Warum nicht nur Integrationstests? → Sie sind langsam und zeigen nicht genau, wo der Fehler ist. Viele Unit-Tests, wenige Integrationstests.
- Wie testen Sie Zeit, zum Beispiel „heute“? → Eine `Clock` injizieren. Im Test eine feste Uhr.
- Wie testen Sie das Frontend? → Komponententests und ein paar End-to-End-Tests mit Playwright oder Cypress für die wichtigsten Abläufe.
- Was ist Mutation Testing? → Ein Tool ändert den Code absichtlich, zum Beispiel PIT. Bleiben die Tests grün, sind sie zu schwach.

## Don't say
- „Ich hatte keine Zeit für Tests.“ Dann lieber weniger Features und gute Tests.
- „Ich habe 95 % Coverage, also ist alles gut.“

## Words
- **Testabdeckung (Coverage)** = share of code run by tests
- **Integrationstest** = test with real parts together
- **Randfall** = edge case
- **Parität** = same results as the old system
- **injizieren** = to inject (dependency)
