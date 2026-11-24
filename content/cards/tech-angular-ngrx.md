---
id: tech-angular-ngrx
round: tech
tech: [signals]
tier: 2
proof: study
project: CARIAD (RxJS-Services als Vergleich)
q: Wie funktioniert NgRx? Erklären Sie Store, Actions, Reducer, Selectors und Effects.
en: How does NgRx work? Explain store, actions, reducers, selectors and effects.
---
## 30s
NgRx ist State Management nach dem Redux-Muster.
Es gibt einen zentralen Store mit dem Zustand der App.
Komponenten senden Actions. Ein Reducer berechnet daraus den neuen Zustand.
Selectors lesen Teile des Zustands. Effects machen Seiteneffekte wie HTTP-Calls.
Der Vorteil: Ein klarer Datenfluss in eine Richtung.
Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich von CARIAD: Dort lief der State über RxJS-Services mit BehaviorSubject.

## 90s
**Ablauf:** Komponente → `dispatch(action)` → Reducer → neuer State → Selector → Komponente.
Für HTTP: Action → Effect → API → Erfolg- oder Fehler-Action → Reducer.

```ts
export const ReportActions = createActionGroup({
  source: 'Report Page',
  events: { 'Load': emptyProps(), 'Load Success': props<{ reports: Report[] }>(), 'Load Failure': props<{ error: string }>() }
});

export const reportReducer = createReducer(initialState,
  on(ReportActions.load, s => ({ ...s, loading: true })),
  on(ReportActions.loadSuccess, (s, { reports }) => ({ ...s, loading: false, reports }))
);

export const selectReports = createSelector(selectReportState, s => s.reports);

loadReports$ = createEffect(() => this.actions$.pipe(
  ofType(ReportActions.load),
  exhaustMap(() => this.api.load().pipe(
    map(reports => ReportActions.loadSuccess({ reports })),
    catchError(e => of(ReportActions.loadFailure({ error: e.message })))
  ))
));
```
- Reducer sind pure Funktionen. Kein HTTP, keine Mutation.
- Selectors sind memoized. Sie rechnen nur neu, wenn sich der Input ändert.
- In der Komponente: `store.selectSignal(selectReports)` gibt ein Signal.

## 3min
**Wann NgRx sinnvoll ist:**
- Viele Komponenten teilen den gleichen Zustand.
- Viele Teams arbeiten an einer großen App.
- Man braucht Nachvollziehbarkeit: Redux DevTools zeigen jede Action, mit Time Travel.

**Wann nicht:**
- Kleine App oder wenig geteilter Zustand. Dann ist ein Service mit Signals einfacher.
- NgRx bringt viel Boilerplate. Für mittlere Fälle ist die NgRx SignalStore leichter.

**Typische Fehler:**
- `catchError` außen am Effect. Dann stirbt der Effect nach dem ersten Fehler.
- State im Reducer mutieren. Selectors merken die Änderung nicht.
- Alles in den Store legen, auch Formular-Zustand. Der Store wird groß und langsam.

**Mein Vergleich zu CARIAD:** Unsere RxJS-Services waren ein kleiner Store pro Feature. Das ist leichter, aber ohne DevTools und ohne feste Regeln. NgRx gibt diese Regeln für ein großes Team.

## Follow-ups
- Was ist der Unterschied zwischen Reducer und Effect? → Der Reducer ist synchron und pur. Der Effect macht asynchrone Arbeit und sendet neue Actions.
- Warum Actions als Events benennen? → „[Report Page] Load“ sagt, wo es passiert ist. Das hilft beim Debuggen.
- Was ist @ngrx/entity? → Helfer für Listen mit IDs: hinzufügen, ändern, löschen, normalisiert.
- Welchen Operator im Effect? → Lesen oft `switchMap`. Speichern `concatMap` oder `exhaustMap`.
- Wie konfiguriert man NgRx ohne Module? → `provideStore()`, `provideState()` und `provideEffects()` in den Providern.

## Don't say
- „Jede Angular-App braucht NgRx.“ Nein, oft reicht ein Service.
- „Im Reducer rufe ich die API.“ Falsch, das gehört in einen Effect.

## Words
- **der Store** = zentraler Speicher für den Zustand
- **die Action** = Ereignis, das etwas beschreibt
- **der Reducer** = Funktion: alter State + Action → neuer State
- **memoized** = Ergebnis wird gespeichert
- **pur** = ohne Seiteneffekte
