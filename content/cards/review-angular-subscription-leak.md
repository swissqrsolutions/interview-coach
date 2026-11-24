---
id: review-angular-subscription-leak
round: review
tech: [angular]
tier: 1
project: CARIAD (Angular / RxJS dashboards)
q: Die Angular-App wird nach ein paar Minuten langsam. Was ist falsch an dieser Komponente?
en: The Angular app gets slow after a few minutes. What is wrong with this component?
---
## 30s
```typescript
@Component({
  selector: 'app-job-status',
  standalone: true,
  template: `<p>{{ status }}</p>`,
})
export class JobStatusComponent implements OnInit {
  status = '';
  constructor(private api: JobApi) {}

  ngOnInit() {
    interval(5000).subscribe(() => {
      this.api.status().subscribe(s => this.status = s);
    });
  }
}
```
Das ist ein Subscription Leak.
`interval` läuft für immer. Auch wenn die Komponente zerstört ist.
Jedes Öffnen der Seite startet einen neuen Timer. Nach zehn Besuchen gibt es zehn Timer und viele HTTP-Aufrufe.
Dazu ein verschachteltes `subscribe`. Alte Antworten können neue überschreiben.
Fix: `switchMap`, `takeUntilDestroyed` oder die `async`-Pipe.

## 90s
**Fix mit async-Pipe:**
```typescript
@Component({
  selector: 'app-job-status',
  standalone: true,
  imports: [AsyncPipe],
  template: `<p>{{ status$ | async }}</p>`,
})
export class JobStatusComponent {
  private api = inject(JobApi);
  status$ = timer(0, 5000).pipe(
    switchMap(() => this.api.status()),
  );
}
```
**Fix mit takeUntilDestroyed (Angular 16+):**
```typescript
constructor() {
  timer(0, 5000).pipe(
    switchMap(() => this.api.status()),
    takeUntilDestroyed(),
  ).subscribe(s => this.status = s);
}
```
**Laut gesagt:** „`switchMap` bricht die alte Anfrage ab, wenn eine neue kommt. Die `async`-Pipe meldet sich selbst ab, wenn die Komponente zerstört wird. Kein manuelles `unsubscribe`.“

Bei CARIAD hatten wir Angular-Dashboards mit RxJS-Services für den Zustand. Polling und Streams sind dort typisch.

## 3min
**Welche Observables muss ich beenden?**
- HTTP-Aufrufe enden nach einer Antwort. Ein Leak ist selten, aber ein verschachteltes `subscribe` ist trotzdem schlecht.
- `interval`, `fromEvent`, `Subject`, Store-Selects, `valueChanges` von Formularen enden nie von selbst. Diese immer beenden.

**Die Optionen, von bevorzugt nach weniger gut:**
1. `async`-Pipe im Template.
2. `toSignal(obs$)` in modernen Angular-Versionen. Es meldet sich auch selbst ab.
3. `takeUntilDestroyed()` im Konstruktor oder mit `DestroyRef`.
4. Altes Muster: `takeUntil(this.destroy$)` mit `ngOnDestroy`. Oft in Angular 14-Code.
5. Manuell `subscription.unsubscribe()`. Fehleranfällig.

**Der richtige Mapping-Operator:**
- `switchMap`: nur das Neueste zählt (Suche, Polling).
- `concatMap`: der Reihe nach (Speichern in Reihenfolge).
- `mergeMap`: parallel.
- `exhaustMap`: ignoriert neue, solange eine läuft (Doppelklick auf Speichern).

**Wie bemerke ich das?** Im Network-Tab der Browser-Devtools steigt die Zahl der Aufrufe mit jedem Seitenwechsel. Ein Heap Snapshot zeigt viele Instanzen der Komponente. Die App wird mit der Zeit langsamer.

**Weitere Review-Punkte:** Keine Fehlerbehandlung. Ein Fehler beendet den Stream, und das Polling stoppt. Lösung: `catchError` innerhalb von `switchMap`.

## Follow-ups
- Warum ist verschachteltes `subscribe` schlecht? → Keine Kontrolle über Reihenfolge und Abbruch. Mit `switchMap` ist es ein Stream und einfach zu beenden.
- Was ist der Unterschied zwischen `switchMap` und `mergeMap`? → `switchMap` bricht die vorige innere Anfrage ab. `mergeMap` lässt alle parallel laufen.
- Muss ich HTTP-Subscriptions beenden? → Sie enden selbst nach der Antwort. Aber wenn die Komponente vorher zerstört wird, läuft der Callback noch. Darum auch dort `takeUntilDestroyed` oder `async`.
- Wie lösen Signals das? → `toSignal` macht aus einem Observable ein Signal und meldet sich beim Zerstören ab. Produktiv habe ich Signals noch nicht eingesetzt. Das Prinzip kenne ich von RxJS.
- Was macht `shareReplay`? → Mehrere Abonnenten teilen eine Anfrage. Mit `refCount: true`, sonst läuft die Quelle weiter.

## Don't say
- „HTTP-Observables muss man nie beenden.“ Das ist nur halb richtig.
- Nicht `ngOnDestroy` mit zehn manuellen `unsubscribe`-Aufrufen als Best Practice zeigen.

## Words
- **Subscription Leak** = subscription never ends
- **abonnieren / abmelden** = subscribe / unsubscribe
- **verschachtelt** = nested
- **zerstören** = destroy (component lifecycle)
- **Polling** = asking again every few seconds
