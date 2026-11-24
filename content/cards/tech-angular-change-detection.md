---
id: tech-angular-change-detection
round: tech
tech: [angular]
tier: 1
project: CARIAD
q: Wie funktioniert Change Detection in Angular? Was ist OnPush?
en: How does change detection work in Angular? What is OnPush?
---
## 30s
Change Detection bringt neue Daten in das HTML.
Angular prüft den Komponenten-Baum von oben nach unten.
Mit zone.js weiß Angular, wann ein Klick, ein Timer oder ein HTTP-Call fertig ist.
Mit OnPush prüft Angular eine Komponente nur, wenn es einen Grund gibt.
Bei CARIAD hatten wir Dashboards mit vielen Tabellen in Angular 14. Dort hilft OnPush stark.
Heute geht Angular den Weg zu Signals und zoneless.
Soll ich Default und OnPush genauer vergleichen?

## 90s
**Default:** Nach jedem Event prüft Angular alle Komponenten im Baum. Das ist einfach, aber bei vielen Komponenten langsam.

**OnPush:** Angular prüft die Komponente nur, wenn:
- ein `@Input` eine neue Referenz bekommt,
- ein Event in der Komponente oder einem Kind passiert,
- die `async` Pipe einen neuen Wert bekommt,
- ein Signal im Template sich ändert,
- wir `markForCheck()` aufrufen.

**Wichtig:** Mit OnPush muss man Daten immutable ändern. Neues Array statt `push()`.

```ts
@Component({
  selector: 'app-map-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (m of maps(); track m.id) { <app-map-row [map]="m" /> }`
})
export class MapListComponent {
  maps = input.required<MapTile[]>();
}
```

**zone.js:** zone.js patcht Browser-APIs wie `setTimeout` und `addEventListener`. Danach startet Angular die Prüfung automatisch.

## 3min
**Zoneless:** Ohne zone.js startet Angular die Prüfung nur bei klaren Signalen: Signal-Änderung, Template-Event, `async` Pipe, `markForCheck()`.
- Angular 18: experimentell (`provideExperimentalZonelessChangeDetection()`).
- Angular 20: `provideZonelessChangeDetection()`, stabil seit 20.2.
- Angular 21: zoneless ist der Standard für neue Projekte.
- Vorteile: kleineres Bundle, weniger unnötige Prüfungen, klarere Stack Traces.

**Trade-offs:**
- OnPush ist schneller, aber Fehler sind schwer zu sehen. Die Daten ändern sich, das HTML aber nicht.
- Typischer Grund: ein Objekt wird mutiert statt ersetzt.
- Zoneless braucht Code, der Angular informiert. Alte Libraries, die auf zone.js warten, machen Probleme.

**Wie ich Probleme finde:** Angular DevTools zeigen, wie oft und wie lange Change Detection läuft. Ein Profiling vorher und nachher.

**Was ich heute anders machen würde:** Neue Komponenten immer mit OnPush und Signals. Dann ist der Schritt zu zoneless klein.
*(Prüfen: Haben Sie bei CARIAD OnPush überall genutzt oder nur in großen Tabellen?)*

## Follow-ups
- Warum ändert sich das HTML nicht, obwohl die Daten neu sind? → Wahrscheinlich OnPush und ein mutiertes Objekt. Die Referenz ist gleich, also prüft Angular nicht.
- Was ist der Unterschied zwischen markForCheck und detectChanges? → `markForCheck()` markiert die Komponente und ihre Eltern für die nächste Runde. `detectChanges()` prüft sofort, aber nur diese Komponente und ihre Kinder.
- Was ist ExpressionChangedAfterItHasBeenCheckedError? → Ein Wert ändert sich während der Prüfung. Das gibt es nur im Dev-Modus. Meist ändert ein Lifecycle-Hook den Zustand zu spät.
- Brauche ich zone.js noch? → Für neue Apps nicht. Für alte Apps ist es ein Umbau Schritt für Schritt: zuerst OnPush und Signals, dann zoneless.
- Wie hilft trackBy oder track? → Angular erkennt gleiche Zeilen wieder. Es baut nicht die ganze Liste neu.

## Don't say
- „OnPush prüft nie.“ Falsch. Es prüft bei Inputs, Events, async Pipe und Signals.
- „zone.js macht die Change Detection.“ Nein. zone.js sagt nur, wann. Angular macht die Prüfung.

## Words
- **Change Detection** = Angular prüft, ob sich Daten geändert haben
- **die Referenz** = reference, Adresse eines Objekts
- **mutieren** = ein Objekt direkt ändern
- **immutable** = unveränderlich, man baut eine neue Kopie
- **zoneless** = ohne zone.js
