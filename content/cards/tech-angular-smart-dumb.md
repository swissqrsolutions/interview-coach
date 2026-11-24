---
id: tech-angular-smart-dumb
round: tech
tech: [angular]
tier: 2
project: CARIAD
q: Was ist der Unterschied zwischen Smart und Dumb Components?
en: What is the difference between smart and dumb (presentational) components?
---
## 30s
Eine Smart Component holt Daten und kennt Services.
Eine Dumb Component zeigt nur Daten. Sie bekommt Inputs und sendet Outputs.
So kann man die Dumb Component leicht testen und wiederverwenden.
Bei CARIAD haben wir die Dashboards so aufgebaut: Container oben, Presentational Components darunter.
Soll ich ein Beispiel zeigen?

## 90s
**Smart (Container):**
- spricht mit Services oder dem Store,
- hält den Zustand,
- reagiert auf Events und ruft die API.

**Dumb (Presentational):**
- nur `input()` und `output()`,
- kein HTTP, kein Store,
- `ChangeDetectionStrategy.OnPush`.

```ts
@Component({
  selector: 'app-quality-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`
})
export class QualityTableComponent {
  rows = input.required<QualityRow[]>();
  rowSelected = output<string>();
}
```
```html
<!-- Smart parent -->
<app-quality-table [rows]="rows()" (rowSelected)="open($event)" />
```

## 3min
**Vorteile:**
- Tests für Dumb Components brauchen keine Mocks für Services.
- Die gleiche Tabelle passt in mehrere Seiten.
- OnPush funktioniert gut, weil alles über Inputs kommt.

**Trade-offs:**
- Zu viele Ebenen. Dann reicht man Inputs durch fünf Komponenten. Das nennt man Prop Drilling.
- Lösung: ein Feature-Service oder Store auf Ebene des Features, nicht alles im Container.
- Nicht jede kleine Komponente muss getrennt sein. Ich trenne, wenn es Wiederverwendung oder Tests gibt.

**Fehler, die man sieht:**
- Eine Dumb Component injiziert heimlich einen Service. Dann ist sie nicht mehr wiederverwendbar.
- Ein Input-Objekt wird in der Dumb Component mutiert. Der Parent merkt es nicht.

**Heute:** Mit Signals und `model()` geht Two-Way-Binding einfacher. Die Trennung bleibt gleich.
*(Prüfen: Ein konkretes Beispiel aus CARIAD, z. B. welche Komponente wiederverwendet wurde.)*

## Follow-ups
- Wo liegt der Zustand? → Im Container oder in einem Service pro Feature. Nicht in der Dumb Component.
- Wie testen Sie eine Dumb Component? → Inputs setzen, HTML prüfen, Output-Events abhören. Keine Mocks nötig.
- Ist das wie MVC? → Ähnlich. Die Dumb Component ist die View. Der Container ist näher am Controller.
- Was ist model()? → Ein Signal für Two-Way-Binding. Das Kind kann den Wert setzen, und der Parent bekommt ihn.

## Don't say
- „Dumb Components haben keine Logik.“ Sie dürfen UI-Logik haben, zum Beispiel Sortieren in der Anzeige.
- „Jede Komponente muss smart oder dumb sein.“ Es ist eine Leitlinie, keine Pflicht.

## Words
- **der Container** = Smart Component
- **Presentational** = zeigt nur an
- **wiederverwenden** = to reuse
- **Prop Drilling** = Daten durch viele Ebenen reichen
- **injizieren** = einen Service per Dependency Injection holen
