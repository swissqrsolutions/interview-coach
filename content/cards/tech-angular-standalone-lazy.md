---
id: tech-angular-standalone-lazy
round: tech
tech: [angular]
tier: 1
project: CARIAD
q: Was sind Standalone Components und wie funktioniert Lazy Loading?
en: What are standalone components and how does lazy loading work?
---
## 30s
Eine Standalone Component braucht kein NgModule.
Sie importiert ihre Abhängigkeiten selbst.
Lazy Loading heißt: Angular lädt Code erst, wenn der User die Route öffnet.
So wird der erste Download kleiner und die App startet schneller.
Bei CARIAD hatten wir in Angular 14 Lazy-loaded Feature Modules und erste Standalone Components.
Seit Angular 19 ist standalone der Standard.
Soll ich zeigen, wie das Routing heute aussieht?

## 90s
**Standalone:**
```ts
@Component({
  selector: 'app-quality-report',
  imports: [DatePipe, MatTableModule],
  template: `...`
})
export class QualityReportComponent {}
```
Seit Angular 19 muss man `standalone: true` nicht mehr schreiben.

**Start der App:**
```ts
bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), provideHttpClient()]
});
```

**Lazy Loading:**
```ts
export const routes: Routes = [
  { path: 'report', loadComponent: () => import('./report/report.component').then(m => m.ReportComponent) },
  { path: 'admin', loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES) }
];
```
- `loadComponent` lädt eine Komponente.
- `loadChildren` lädt eine ganze Gruppe von Routen.
- Der Build macht daraus eigene Chunks.

## 3min
**Warum standalone besser ist:**
- Weniger Boilerplate. Man sieht direkt, was eine Komponente braucht.
- Besseres Tree Shaking.
- Lazy Loading auf Ebene einer Komponente, nicht nur eines Moduls.

**Lazy Loading im Template:** Mit `@defer` lädt man auch Teile einer Seite später, zum Beispiel ein schweres Chart.

**Preloading:** `withPreloading(PreloadAllModules)` lädt die Chunks im Hintergrund nach dem Start. Gut für Apps mit wenigen, oft genutzten Seiten.

**Trade-offs und Fehler:**
- Zu viele kleine Chunks = viele Requests. Sinnvoll nach Fachbereich schneiden.
- Ein Service mit `providedIn: 'root'` in einer Lazy-Route ist trotzdem ein Singleton. Ein Provider in `providers` einer Route gilt nur für diese Route und ihre Kinder.
- Ein Import aus der Lazy-Route in den Haupt-Code macht den Chunk kaputt. Dann ist der Code wieder im Main Bundle. Man sieht das in der Bundle-Analyse.

**Migration:** `ng generate @angular/core:standalone` migriert in drei Schritten: Komponenten, Module entfernen, Bootstrap.
*(Prüfen: Wie viele Feature Modules hatten Sie bei CARIAD?)*

## Follow-ups
- Brauche ich NgModules noch? → Für neuen Code nicht. Alte Libraries mit Modulen kann man aber weiter importieren.
- Wie schützen Sie eine Lazy-Route? → Mit einem funktionalen Guard, zum Beispiel `canMatch`. Dann lädt Angular den Code gar nicht ohne Recht.
- Was ist der Unterschied zwischen canActivate und canMatch? → `canMatch` entscheidet, ob die Route überhaupt passt. Der Chunk wird nicht geladen. `canActivate` prüft erst nach dem Match.
- Wie sehen Sie die Bundle-Größe? → Mit `ng build --stats-json` und einem Analyzer. Und mit Budgets in `angular.json`.

## Don't say
- „Lazy Loading macht die App immer schneller.“ Nur der Start wird schneller. Der erste Klick auf die Route kann langsamer sein.
- „Standalone ist nur für kleine Apps.“ Es ist der Standard für alle Apps.

## Words
- **Lazy Loading** = Code erst bei Bedarf laden
- **der Chunk** = ein Teil des Bundles
- **Tree Shaking** = ungenutzten Code beim Build entfernen
- **der Guard** = Wächter für eine Route
- **die Abhängigkeit** = dependency
