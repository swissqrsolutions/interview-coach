---
id: tech-angular-new-control-flow
round: tech
tech: [signals, angular]
tier: 2
proof: study
project: CARIAD (Angular 14, *ngIf/*ngFor als Vergleich)
q: Was ist der neue Control Flow in Angular? Was macht @defer?
en: What is the new control flow in Angular? What does @defer do?
---
## 30s
Seit Angular 17 gibt es eine neue Syntax im Template: `@if`, `@for` und `@switch`.
Sie ersetzt `*ngIf`, `*ngFor` und `ngSwitch`.
Die Syntax ist direkt im Compiler. Man braucht keine Imports.
`@for` verlangt `track`. Das macht Listen schneller.
`@defer` lädt einen Teil der Seite später, zum Beispiel beim Scrollen.
Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich von CARIAD: Dort hatten wir in Angular 14 `*ngIf`, `*ngFor` mit `trackBy` und Lazy Loading pro Route.

## 90s
```html
@if (user(); as u) {
  <p>Hallo {{ u.name }}</p>
} @else if (loading()) {
  <app-spinner />
} @else {
  <p>Bitte einloggen.</p>
}

@for (r of reports(); track r.id; let i = $index) {
  <app-report-row [report]="r" [index]="i" />
} @empty {
  <p>Keine Reports.</p>
}

@defer (on viewport; prefetch on idle) {
  <app-heavy-chart [data]="data()" />
} @placeholder {
  <div class="chart-box"></div>
} @loading (minimum 300ms) {
  <app-spinner />
} @error {
  <p>Chart konnte nicht laden.</p>
}
```
- `@for` hat `$index`, `$first`, `$last`, `$even`, `$odd`, `$count`.
- `@empty` zeigt etwas bei einer leeren Liste.
- `@defer` Trigger: `on idle` (Standard), `on viewport`, `on interaction`, `on hover`, `on timer(2s)`, `on immediate`, oder `when` mit einer Bedingung.

## 3min
**Warum besser:**
- Kein `CommonModule` und keine Directive-Imports.
- Bessere Typprüfung, zum Beispiel nach `@if`.
- `track` ist Pflicht. Viele Performance-Fehler mit `*ngFor` ohne `trackBy` sind damit weg.
- `@defer` macht Lazy Loading im Template, ohne eigene Route.

**Wichtig bei @defer:**
- Die Komponenten im Block müssen standalone sein. Und sie dürfen außerhalb des Blocks nicht im Template verwendet werden. Sonst landen sie im Haupt-Bundle.
- Bei SSR wird standardmäßig der `@placeholder` gerendert. Mit Incremental Hydration (`hydrate on ...`) geht mehr.
- Nicht alles defer-en. Wichtiger Inhalt oben auf der Seite muss sofort da sein, sonst springt das Layout.

**Status:** Control Flow und `@defer` sind seit Angular 18 stabil. `*ngIf`, `*ngFor` und `ngSwitch` sind seit Angular 20 deprecated.

**Migration:** `ng generate @angular/core:control-flow` stellt alte Templates automatisch um. Danach Code Review, besonders bei `track`.

## Follow-ups
- Was soll ich bei track verwenden? → Eine stabile ID. `$index` nur, wenn die Liste sich nicht ändert.
- Was ist der Unterschied zwischen @defer und Lazy Routes? → Lazy Routes laden eine ganze Seite. `@defer` lädt einen Teil innerhalb einer Seite.
- Was macht prefetch? → Es lädt den Code schon vorher, zum Beispiel bei `idle`. Gezeigt wird er erst beim Haupt-Trigger.
- Muss ich alles sofort migrieren? → Nein. Alt und neu funktionieren zusammen. Aber die alten Directives sind deprecated.

## Don't say
- „@if ist nur eine andere Schreibweise.“ Es ist im Compiler eingebaut, mit besserer Typprüfung und ohne Imports.
- „@defer macht Daten-Lazy-Loading.“ Es lädt Code und Komponenten, nicht Daten.

## Words
- **der Control Flow** = Steuerung im Template
- **der Trigger** = Auslöser
- **verzögert** = deferred, später
- **der Platzhalter** = placeholder
- **deprecated** = veraltet, wird später entfernt
