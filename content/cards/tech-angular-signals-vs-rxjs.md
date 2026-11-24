---
id: tech-angular-signals-vs-rxjs
round: tech
tech: [signals, angular]
tier: 1
proof: study
project: CARIAD, BIT DAZiT (RxJS)
q: Signals oder RxJS – wann nehmen Sie was?
en: Signals or RxJS – when do you use which?
---
## 30s
Signals sind für Zustand: ein Wert, der jetzt gilt.
RxJS ist für Events über Zeit: Tippen, Websockets, Retry, Abbruch.
Signals sind synchron und einfach. RxJS ist mächtig, aber komplexer.
In Angular arbeiten beide gut zusammen, mit `toSignal` und `toObservable`.
RxJS habe ich bei CARIAD und DAZiT produktiv benutzt.
Signals habe ich produktiv noch nicht eingesetzt. Das Prinzip kenne ich von den RxJS-Services bei CARIAD mit BehaviorSubject.

## 90s
| Frage | Signals | RxJS |
|---|---|---|
| Hat es immer einen Wert? | ja | nicht immer |
| Zeit und Abbruch? | nein | ja: `debounceTime`, `switchMap` |
| Subscribe nötig? | nein | ja, oder `async` Pipe |
| Im Template | `count()` | `count$ \| async` |

**Brücke:**
```ts
private api = inject(ReportApi);
term = signal('');
results = toSignal(
  toObservable(this.term).pipe(
    debounceTime(300),
    switchMap(t => this.api.search(t))
  ),
  { initialValue: [] }
);
```
- `toSignal()` macht aus einem Observable ein Signal. Es unsubscribed automatisch.
- `toObservable()` macht aus einem Signal ein Observable.

## 3min
**Meine Regel:**
- UI-Zustand und abgeleitete Werte → Signals und `computed`.
- HTTP mit Abbruch, Debounce, Polling, Websocket → RxJS.
- Am Rand: RxJS rein, Signal raus zum Template.

**Fallen:**
- `toSignal()` ohne `initialValue` gibt am Anfang `undefined`.
- `toSignal()` nur im Injection Context aufrufen.
- Ein Signal gibt nur den letzten Wert. Zwischenwerte gehen verloren. Für jedes Event (z. B. Klicks zählen) ist ein Observable richtig.
- Glitch-free: Signals rechnen nicht mit halben Zuständen. Bei `combineLatest` sieht man manchmal Zwischenwerte.

**Migration in einer bestehenden RxJS-App:** Keine große Umstellung. Neue Komponenten mit Signals. Services behalten ihre Observables und geben zusätzlich ein Signal heraus. Schritt für Schritt.

**Was das für mich heißt:** Meine RxJS-Erfahrung hilft. Ich weiß, wo die Grenzen von Signals sind.

## Follow-ups
- Ersetzt Signals NgRx? → Nicht ganz. Die NgRx SignalStore nutzt Signals. Der klassische Store gibt heute auch Signals mit `selectSignal()`.
- Ist HttpClient jetzt mit Signals? → `HttpClient` gibt weiter Observables. `httpResource` ist eine neue, experimentelle Signal-API.
- Was ist besser für Performance? → Signals, weil Angular genau weiß, wer den Wert liest. Aber der Unterschied ist klein, wenn OnPush und async Pipe gut genutzt sind.
- Was ist ein Glitch? → Ein kurzer, falscher Zwischenzustand. Signals vermeiden das.

## Don't say
- „RxJS ist jetzt tot.“ Angular selbst nutzt RxJS weiter, zum Beispiel im Router und HttpClient.
- „Ich wandle alles in Signals um.“ Zeit-Logik bleibt besser in RxJS.

## Words
- **der Zustand** = state
- **abgeleitet** = derived
- **die Brücke** = bridge
- **der Zwischenwert** = intermediate value
- **mächtig** = powerful
