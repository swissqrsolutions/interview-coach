---
id: tech-angular-signals
round: tech
tech: [signals]
tier: 1
proof: study
project: CARIAD (RxJS-Services als Vergleich)
q: Was sind Angular Signals?
en: What are Angular Signals?
---
## 30s
Ein Signal ist ein Wert, der Angular sagt, wenn er sich ändert.
Man liest es wie eine Funktion: `count()`.
`computed` berechnet einen neuen Wert aus anderen Signals.
`effect` führt Code aus, wenn sich ein Signal ändert.
So weiß Angular genau, welche Komponente neu prüfen muss.
Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich von den RxJS-Services bei CARIAD mit BehaviorSubject.

## 90s
```ts
count = signal(0);
double = computed(() => this.count() * 2);

constructor() {
  effect(() => console.log('count is', this.count()));
}

increment() { this.count.update(c => c + 1); }
reset() { this.count.set(0); }
```
- `signal()` hat `set()` und `update()`.
- `computed()` ist lazy und gecacht. Es rechnet nur neu, wenn ein Signal darin sich ändert.
- `effect()` ist für Seiteneffekte: Logging, `localStorage`, Sync mit einer externen Library.

**Signal-APIs in Komponenten:**
```ts
id = input.required<string>();       // statt @Input
saved = output<Report>();             // statt @Output + EventEmitter
value = model(0);                     // Two-Way-Binding
table = viewChild(MatTable);          // Signal Query
```

## 3min
**Warum Signals:**
- Feine Reaktivität: Angular weiß, welches Template ein Signal liest.
- Kein Subscribe, kein Unsubscribe.
- Grundlage für zoneless Change Detection.

**Regeln:**
- Kein State in einem `effect` setzen, wenn ein `computed` reicht. Sonst entstehen Schleifen und unklare Daten.
- Werte immutable ändern. `update(list => [...list, item])`, nicht `push()`.
- `effect` nur im Injection Context, zum Beispiel im Constructor.

**Neue Bausteine:**
- `linkedSignal`: ein Signal, das von einem anderen abhängt, aber auch selbst gesetzt werden kann.
- `resource` / `httpResource`: lädt Daten asynchron als Signal. Noch experimentell, darum vorsichtig in Produktion.

**Stabilität:** `signal`, `computed`, Signal Inputs und Queries sind stabil. `effect` ist seit Angular 20 stabil.

**Wie ich es lernen würde im Projekt:** Neue Komponenten mit Signal Inputs. Bestehende RxJS-Services bleiben. Brücke mit `toSignal()`.

## Follow-ups
- Was ist der Unterschied zu einem BehaviorSubject? → Beide haben immer einen Wert. Ein Signal ist synchron und braucht kein Subscribe. Für Zeit-Logik ist RxJS stärker.
- Wann läuft ein effect? → Asynchron, während der Change Detection. Nicht sofort bei `set()`.
- Was ist untracked? → Liest ein Signal, ohne Abhängigkeit zu erzeugen. Gut in einem `effect`.
- Kann ich ein Input-Signal setzen? → Nein, `input()` ist read-only. Für Two-Way-Binding gibt es `model()`.
- Brauche ich noch OnPush? → Ja, es ist weiter sinnvoll. Mit Signals funktioniert OnPush ohne Tricks.

## Don't say
- „Signals ersetzen RxJS komplett.“ Für Events über Zeit bleibt RxJS.
- „Ich habe Signals schon im Projekt benutzt.“ Nicht wahr. Ehrlich sagen: gelernt, nicht produktiv.

## Words
- **das Signal** = reaktiver Wert
- **berechnet** = computed
- **der Seiteneffekt** = side effect
- **die Abhängigkeit** = dependency
- **read-only** = nur lesen
