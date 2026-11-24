---
id: tech-angular-rxjs-operators
round: tech
tech: [angular]
tier: 1
project: BIT DAZiT, CARIAD
q: Was ist der Unterschied zwischen switchMap, mergeMap, concatMap und exhaustMap?
en: What is the difference between switchMap, mergeMap, concatMap and exhaustMap?
---
## 30s
Alle vier machen aus einem Wert ein neues Observable, zum Beispiel einen HTTP-Call.
Der Unterschied ist: Was passiert, wenn ein neuer Wert kommt und der alte Call noch läuft?
switchMap bricht den alten ab. mergeMap lässt alle parallel laufen.
concatMap wartet und macht alles der Reihe nach. exhaustMap ignoriert neue Werte, solange einer läuft.
Ich habe RxJS bei DAZiT und bei CARIAD jeden Tag benutzt. Bei CARIAD lief der State über RxJS Services.
Soll ich für jeden Operator ein Beispiel geben?

## 90s
| Operator | Neuer Wert, alter Call läuft | Typisches Beispiel |
|---|---|---|
| `switchMap` | alter Call wird abgebrochen | Suche beim Tippen |
| `mergeMap` | beide laufen parallel | viele Dateien gleichzeitig laden |
| `concatMap` | neuer wartet in der Reihe | Speichern in fester Reihenfolge |
| `exhaustMap` | neuer wird ignoriert | Login-Button, Doppelklick |

```ts
this.results$ = this.search.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(term => this.api.find(term))
);
```

**Unsubscribe:** Ein Subscribe ohne Ende ist ein Memory Leak.
```ts
private destroyRef = inject(DestroyRef);
ngOnInit() {
  this.store.changes$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(...);
}
```
- `takeUntilDestroyed()` im Constructor braucht kein Argument.
- Noch besser: die `async` Pipe oder `toSignal()`. Dann räumt Angular selbst auf.

## 3min
**Fehler, die ich oft sehe:**
- `switchMap` beim Speichern. Ein Abbruch im Browser stoppt nicht den Server. Die Daten sind vielleicht halb gespeichert, und der Client weiß es nicht. Für Schreiben besser `concatMap` oder `exhaustMap`.
- `mergeMap` ohne Limit. 500 parallele Requests überlasten das Backend. Lösung: `mergeMap(fn, 4)` mit Concurrency-Limit.
- Fehler im inneren Observable beendet den ganzen Stream. Lösung: `catchError` im inneren `pipe`, nicht außen.
- Verschachtelte `subscribe()` statt Operatoren. Das ist schwer zu lesen und schwer abzubrechen.

**HTTP-Calls:** Ein HTTP-Observable endet nach einer Antwort. Darum ist es kein Leak. Aber ein Abbruch bei Navigation ist trotzdem sinnvoll.

**Wann kein RxJS:** Für einfachen UI-Zustand nehme ich heute Signals. RxJS bleibt für Events über Zeit: Debounce, Retry, Websockets, Abbruch.
*(Ihr echtes Beispiel: ein konkreter RxJS-Fall aus DAZiT oder CARIAD, z. B. eine Suche oder ein Polling.)*

## Follow-ups
- Was ist der Unterschied zwischen Subject und BehaviorSubject? → BehaviorSubject hat immer einen aktuellen Wert. Ein neuer Subscriber bekommt ihn sofort.
- Was ist shareReplay? → Mehrere Subscriber teilen einen Call. Mit `shareReplay({ bufferSize: 1, refCount: true })` gibt es keinen Leak.
- Cold oder hot Observable? → Cold startet pro Subscriber neu, zum Beispiel HTTP. Hot läuft schon, zum Beispiel Klicks.
- Wie machen Sie Retry? → `retry({ count: 3, delay: 1000 })`. Nur für sichere, idempotente Calls.
- Wie kombinieren Sie zwei Streams? → `combineLatest` für den letzten Wert von beiden. `forkJoin` wartet, bis alle fertig sind.

## Don't say
- „switchMap ist immer richtig.“ Beim Speichern ist es gefährlich.
- „HTTP-Subscriptions muss man immer unsubscriben, sonst gibt es einen Leak.“ Sie enden selbst. Die Gefahr sind lange Streams.

## Words
- **abbrechen** = to cancel
- **der Operator** = Funktion in der RxJS-Pipe
- **das Memory Leak** = Speicher wird nicht frei
- **der Stream** = Strom von Werten über Zeit
- **parallel** = gleichzeitig
