---
id: tech-angular-upgrade-14-to-modern
round: tech
tech: [angular, signals]
tier: 1
project: CARIAD (Angular 14)
q: Wie würden Sie eine Angular-14-App auf eine moderne Version bringen?
en: How would you upgrade an Angular 14 app to a modern version?
---
## 30s
Ich gehe immer eine Major-Version nach der anderen: 14, 15, 16 und so weiter.
Für jeden Schritt gibt es `ng update` und den Update Guide auf angular.dev.
Nach jedem Schritt: Build, Tests, kurz deployen.
Erst wenn die Version stabil ist, kommt die Modernisierung: Standalone, Control Flow, Signals.
Meine letzte große Angular-App war bei CARIAD in Angular 14. Dort hatten wir schon Lazy Loading, RxJS-Services und erste Standalone Components. Das ist ein guter Startpunkt.
*(Prüfen: Haben Sie bei CARIAD selbst ein Upgrade gemacht? Wenn nein, als Plan erklären.)*
Soll ich die Schritte genauer zeigen?

## 90s
**Phase 1 – Versionen (ohne neue Features):**
1. Node.js und TypeScript passend zur Zielversion.
2. `ng update @angular/core@15 @angular/cli@15`, dann 16, 17, 18 und weiter.
3. Angular Material mit updaten. Wichtig: v15 bringt die MDC-Komponenten. Die alten Legacy-Komponenten sind in v17 weg. Das ändert Styles.
4. Third-Party-Libraries prüfen. Oft blockiert eine alte Library das Upgrade.

**Phase 2 – Modernisierung mit Schematics:**
```bash
ng generate @angular/core:standalone
ng generate @angular/core:control-flow
ng generate @angular/core:inject
ng generate @angular/core:signal-input-migration
```
5. Neuer Build mit esbuild (`application` Builder). Viel schnellere Builds.

**Phase 3 – Signals und zoneless:** Neue Komponenten mit Signals und OnPush. Später `provideZonelessChangeDetection()`.

## 3min
**Risiken:**
- Material MDC: Abstände und Farben ändern sich. Visuelle Tests oder Screenshots vergleichen. Das ist oft der größte Aufwand.
- Libraries ohne Support für neue Versionen. Dann ersetzen oder forken.
- RxJS 7: einige Operatoren sind deprecated, zum Beispiel `toPromise()`.
- Karma ist deprecated. Wechsel des Test-Runners ist ein eigener Schritt, nicht im gleichen Release.

**Wie ich das organisiere:**
- Ein Upgrade-Branch pro Version, klein mergen. Kein Big Bang über Monate.
- Tests sind das Sicherheitsnetz. Vor dem Upgrade Coverage auf wichtigen Abläufen prüfen, plus ein paar E2E-Tests mit Playwright.
- Feature-Arbeit läuft weiter. Darum kurze Schritte, damit es wenig Merge-Konflikte gibt.

**Was nicht muss:** Nicht alles sofort auf Signals umbauen. RxJS-Services funktionieren weiter. Neue Features mit Signals, alte Teile nur beim Anfassen.

**Woran ich Erfolg messe:** Build-Zeit, Bundle-Größe, keine neuen Fehler in Produktion, Tests grün.

## Follow-ups
- Kann ich direkt von 14 auf 20 springen? → Nein. `ng update` unterstützt nur einen Major-Schritt. Die Migrationen laufen pro Version.
- Was ist der größte Aufwand? → Meist Angular Material und alte Libraries, nicht Angular selbst.
- Wie lange dauert das? → Abhängig von Größe und Tests. Ich würde mit einem Spike von ein paar Tagen schätzen.
- Was ist mit Angular.js? → Das ist ein anderes Framework. Das wäre eine Migration, kein Upgrade.
- Warum nicht neu schreiben? → Zu viel Risiko. Ein schrittweises Upgrade hält die App immer lauffähig.

## Don't say
- „Ich habe bei CARIAD von 14 auf 20 migriert.“ Nur sagen, wenn es wahr ist.
- „Wir springen direkt auf die neueste Version.“ Das geht nicht sauber.

## Words
- **die Major-Version** = Hauptversion
- **das Schematic** = automatische Code-Migration
- **das Sicherheitsnetz** = safety net
- **schrittweise** = step by step
- **der Spike** = kurze technische Untersuchung
