---
id: tech-angular-testing
round: tech
tech: [angular, testing]
tier: 2
project: CARIAD, Unisys
q: Wie testen Sie eine Angular-Anwendung?
en: How do you test an Angular application?
---
## 30s
Ich teste in drei Ebenen.
Unit Tests für Services, Pipes und einfache Komponenten.
Komponenten-Tests mit TestBed, mit gemockten HTTP-Calls.
Und wenige End-to-End Tests im echten Browser, mit Playwright oder Cypress.
Bei CARIAD hatten wir Unit- und Integrationstests und SonarQube Quality Gates.
Bei Unisys haben wir Testautomatisierung mit Playwright und Cypress eingeführt.
Soll ich zeigen, wie ein Komponenten-Test aussieht?

## 90s
**Komponenten-Test mit TestBed:**
```ts
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [ReportComponent],
    providers: [provideHttpClient(), provideHttpClientTesting()]
  });
});

it('shows rows from the API', () => {
  const fixture = TestBed.createComponent(ReportComponent);
  const http = TestBed.inject(HttpTestingController);
  fixture.detectChanges();
  http.expectOne('/api/reports').flush([{ id: 1, name: 'A' }]);
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('A');
  http.verify();
});
```
- Standalone-Komponenten kommen in `imports`.
- `HttpTestingController` gibt feste Antworten. Kein echtes Backend.
- Für Angular Material: Component Harnesses. Der Test hängt dann nicht an CSS-Klassen.

**End-to-End:** Playwright startet die App und klickt wie ein User. Nur für die wichtigsten Abläufe.

## 3min
**Test-Runner:** Karma ist deprecated. Neue Projekte nutzen Vitest, Standard seit Angular 21. Jest ist auch verbreitet.
*(Prüfen: Welchen Test-Runner hatten Sie bei CARIAD? Jasmine/Karma oder Jest?)*

**Testpyramide:** Viele schnelle Unit Tests, weniger Komponenten-Tests, wenige E2E-Tests. E2E-Tests sind langsam und brechen leichter.

**Was ich teste:**
- Verhalten, nicht Implementierung. „Der User sieht den Fehler“, nicht „Methode X wurde aufgerufen“.
- Signals: Wert setzen, dann `computed` prüfen. Das ist einfacher als Observables mit Marble Tests.
- RxJS mit Zeit: `fakeAsync` und `tick()`, oder Marble Tests.

**Flaky Tests:**
- Grund: feste Wartezeiten, Reihenfolge der Tests, echte Netzwerk-Calls.
- In Playwright: Auto-Waiting und Locators nach Rolle oder Text statt `sleep`.
- Ein flaky Test kommt in Quarantäne und wird schnell repariert. Nie einfach ignorieren.

**In der CI:** Tests laufen bei jedem Pull Request. Ein Quality Gate in SonarQube prüft Coverage auf neuem Code.

## Follow-ups
- Was mocken Sie? → HTTP und externe Services. Nicht die Komponente selbst.
- Was ist ein Component Harness? → Eine Test-API für eine Komponente. Ich sage „klicke den Button“, nicht „finde .mat-button“.
- Wie testen Sie einen Guard oder Interceptor? → Funktional mit `TestBed.runInInjectionContext()`. Oder über einen Router-Test.
- Wie viel Coverage? → Kein fixer Wert. Wichtig ist Coverage auf neuem Code und auf der Fachlogik.
- Cypress oder Playwright? → Playwright ist schneller, kann mehrere Browser und Tabs. Cypress hat eine gute Debug-UI. Beide sind OK.

## Don't say
- „Wir testen alles mit E2E.“ Zu langsam und zu instabil.
- „100 % Coverage heißt keine Fehler.“ Coverage zeigt nur, was ausgeführt wurde.

## Words
- **der Testlauf** = test run
- **mocken** = durch eine Attrappe ersetzen
- **flaky** = mal grün, mal rot ohne Änderung
- **die Testpyramide** = viele kleine, wenige große Tests
- **das Quality Gate** = Regel, die einen Build stoppt
