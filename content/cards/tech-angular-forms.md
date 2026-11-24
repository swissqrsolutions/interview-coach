---
id: tech-angular-forms
round: tech
tech: [angular]
tier: 2
project: BIT DAZiT
q: Reactive Forms oder Template-driven Forms? Wie validieren Sie?
en: Reactive forms or template-driven forms? How do you validate?
---
## 30s
Template-driven Forms definiert man im HTML mit `ngModel`. Das ist gut für kleine Formulare.
Reactive Forms definiert man im TypeScript-Code. Das ist besser für große Formulare.
Reactive Forms sind typisiert, testbar und gut für dynamische Felder.
Bei DAZiT ging es um Steuerdeklarationen. Dort sind Formulare und Validierung zentral.
Soll ich zeigen, wie ich ein Formular mit Validierung baue?
*(Prüfen: Welche Form-Art haben Sie bei DAZiT genutzt?)*

## 90s
```ts
private fb = inject(NonNullableFormBuilder);
form = this.fb.group({
  amount: [0, [Validators.required, Validators.min(0)]],
  email: ['', [Validators.required, Validators.email]],
  items: this.fb.array<FormGroup>([])
});
```
- Seit Angular 14 sind Reactive Forms typisiert. `form.value.amount` ist eine Zahl.
- `NonNullableFormBuilder`: Nach `reset()` kommt der Startwert zurück, nicht `null`.
- `FormArray` für Listen, zum Beispiel mehrere Positionen.

**Eigener Validator:**
```ts
export const notInFuture: ValidatorFn = c =>
  new Date(c.value) > new Date() ? { inFuture: true } : null;
```

**Async Validator:** Prüft gegen das Backend, zum Beispiel ob eine Nummer existiert. Er läuft nur, wenn die normalen Validatoren OK sind.

## 3min
**Validierung über mehrere Felder:** Ein Validator auf der `FormGroup`, zum Beispiel „Enddatum nach Startdatum“.

**Server bleibt die Wahrheit:** Validierung im Browser ist für den User. Das Backend prüft immer noch einmal. Sonst umgeht man sie mit einem einfachen HTTP-Call.

**Eigene Form-Controls:** Mit `ControlValueAccessor` baut man eine eigene Komponente, die wie ein Input funktioniert. Zum Beispiel ein Feld für eine AHV-Nummer.

**Typische Fehler:**
- `updateOn: 'change'` mit teurem Async Validator. Jede Taste = ein Request. Besser `updateOn: 'blur'` oder Debounce.
- Fehler sofort anzeigen, bevor der User etwas getippt hat. Besser erst bei `touched` oder beim Absenden.
- `form.value` ignoriert deaktivierte Felder. Für alle Werte: `form.getRawValue()`.

**Neu:** Angular 21 hat Signal Forms als experimentelle API. Das Modell ist ein Signal. Für Produktion würde ich noch warten, bis die API stabil ist.

## Follow-ups
- Wann nehmen Sie Template-driven? → Für ein Login oder eine kleine Suche. Für alles Große Reactive Forms.
- Wie zeigen Sie Fehlermeldungen? → `control.hasError('required')` und `touched`. Oder Angular Material `mat-error`.
- Wie testen Sie ein Formular? → Werte setzen, `form.valid` prüfen. Ohne DOM, das ist schnell.
- Was ist der Unterschied zwischen value und getRawValue? → `getRawValue()` enthält auch deaktivierte Felder.

## Don't say
- „Frontend-Validierung reicht.“ Das Backend muss immer prüfen.
- „Template-driven ist veraltet.“ Es ist nicht veraltet, nur für große Formulare weniger gut.

## Words
- **das Formular** = form
- **die Validierung** = validation
- **typisiert** = mit festen Typen
- **deaktiviert** = disabled
- **absenden** = to submit
