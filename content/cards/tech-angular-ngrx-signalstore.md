---
id: tech-angular-ngrx-signalstore
round: tech
tech: [signals]
tier: 2
proof: study
project: CARIAD (RxJS-Services als Vergleich)
q: Was ist die NgRx SignalStore und wann nehmen Sie sie?
en: What is the NgRx SignalStore and when do you use it?
---
## 30s
Die SignalStore ist eine leichte Store-Lösung von NgRx auf Basis von Signals.
Man baut den Store aus Bausteinen: State, Computed, Methods.
Es gibt keine Actions und keine Reducer wie im klassischen NgRx.
Darum ist viel weniger Code nötig.
Gut für einen Store pro Feature.
Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich von CARIAD: Dort hatten wir einen RxJS-Service pro Feature als kleinen Store.

## 90s
```ts
export const ReportStore = signalStore(
  { providedIn: 'root' },
  withState({ reports: [] as Report[], loading: false, filter: '' }),
  withComputed(({ reports, filter }) => ({
    visible: computed(() => reports().filter(r => r.name.includes(filter())))
  })),
  withMethods((store, api = inject(ReportApi)) => ({
    setFilter(filter: string) { patchState(store, { filter }); },
    load: rxMethod<void>(pipe(
      tap(() => patchState(store, { loading: true })),
      switchMap(() => api.load().pipe(
        tap(reports => patchState(store, { reports, loading: false }))
      ))
    ))
  })),
  withHooks({ onInit(store) { store.load(); } })
);
```
- `withState`: der Zustand. Jedes Feld ist ein Signal.
- `withComputed`: abgeleitete Werte.
- `withMethods`: Änderungen mit `patchState`.
- `rxMethod`: Brücke zu RxJS für asynchrone Arbeit.
- `withHooks`: Code bei Start und Ende.

## 3min
**SignalStore vs. klassischer NgRx Store:**
| | Klassisch | SignalStore |
|---|---|---|
| Code | viel Boilerplate | wenig |
| Struktur | Actions, Reducer, Effects | State, Computed, Methods |
| Scope | ein globaler Store | global oder pro Komponente |
| DevTools | eingebaut | mit Zusatz-Library |

**Wann SignalStore:** Feature-Zustand, mittlere Apps, Teams, die schon Signals nutzen.
**Wann klassisch:** Sehr große App, viele Teams, starke Regeln und Event-Log gewünscht.

**Erweiterungen:** `withEntities` für Listen mit IDs. Eigene Features mit `signalStoreFeature`, zum Beispiel ein wiederverwendbares Loading und Error.

**Fallen:**
- Logik direkt in Komponenten statt in `withMethods`.
- `patchState` von außen. Standardmäßig ist der State geschützt (`protectedState`), und das ist gut so.
- Ein Store pro Komponente erstellt, aber Daten sollen geteilt werden. Dann `providedIn: 'root'`.

**Mein Vergleich:** Ein RxJS-Service mit BehaviorSubject und Methoden ist fast das gleiche Muster. Die SignalStore gibt dem Muster eine feste Form.

## Follow-ups
- Brauche ich @ngrx/store dafür? → Nein. `@ngrx/signals` ist ein eigenes Paket.
- Kann ich die SignalStore in einer Komponente bereitstellen? → Ja, in `providers` der Komponente. Dann lebt der Store nur so lange wie die Komponente.
- Was macht rxMethod? → Es nimmt einen Wert, ein Signal oder ein Observable. Intern läuft eine RxJS-Pipe. Unsubscribe passiert automatisch.
- Was ist patchState? → Es ändert Teile des States immutable. Wie `{ ...state, x }`.

## Don't say
- „SignalStore ist das gleiche wie der Store mit Signals.“ Nein, es ist ein anderes Modell ohne Actions und Reducer.
- „Damit brauche ich nie mehr RxJS.“ Für asynchrone Abläufe nutzt man `rxMethod` mit RxJS.

## Words
- **der Baustein** = building block
- **bereitstellen** = to provide
- **die Erweiterung** = extension
- **geschützt** = protected
- **pro Feature** = für einen Fachbereich der App
