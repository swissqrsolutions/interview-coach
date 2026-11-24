---
id: tech-patterns-solid
round: tech
tech: [patterns]
tier: 1
project: CARIAD (Code-Reviews), Unisys (Qualitäts-Standards)
q: Erklären Sie die SOLID-Prinzipien mit Beispielen.
en: Explain the SOLID principles with examples.
---
## 30s
SOLID sind fünf Prinzipien für gut wartbaren objektorientierten Code.
S: eine Klasse, ein Grund für Änderungen.
O: offen für Erweiterung, geschlossen für Änderung.
L: eine Unterklasse muss sich wie die Oberklasse verhalten.
I: kleine, spezifische Interfaces.
D: von Abstraktionen abhängen, nicht von Details.
In Code-Reviews bei CARIAD in Bitbucket und bei Unisys achte ich besonders auf S und D.
Soll ich zu jedem Prinzip ein Beispiel geben?

## 90s
**S – Single Responsibility:** Ein `DeclarationService` prüft, rechnet, schreibt PDF und schickt E-Mails? Zu viel. Ich trenne in Validator, Calculator, PdfRenderer, Notifier.

**O – Open/Closed:** Neue Zahlungsart = neue Klasse, kein neuer `if`-Zweig.
```java
interface PaymentMethod { boolean supports(String type); Receipt pay(Order o); }
@Component class TwintPayment implements PaymentMethod { ... }
@Component class InvoicePayment implements PaymentMethod { ... }
// Spring injiziert List<PaymentMethod>. Neue Art = neue Bean, kein Umbau.
```

**L – Liskov Substitution:** Klassisches Beispiel: `Square extends Rectangle`. `setWidth` ändert auch die Höhe. Code, der mit Rectangle rechnet, bricht. Lösung: keine Vererbung, getrennte Typen.

**I – Interface Segregation:** Kein riesiges `Repository`-Interface mit 30 Methoden. Ein Leser braucht nur `findById`, nicht `deleteAll`.

**D – Dependency Inversion:** Die Fachlogik hängt von einem Interface `TaxRateProvider` ab. Die Implementierung mit REST-Client ist ein Detail. Spring injiziert sie. Im Test nehme ich einen Fake.

## 3min
**Zusammenhang mit Architektur:** Dependency Inversion ist die Basis von hexagonaler Architektur (Ports and Adapters). Der Fachkern definiert Ports als Interfaces. Adapter für DB, REST und Kafka implementieren sie. Der Kern kennt kein Spring und kein JPA.

**Wann ich SOLID nicht übertreibe:**
- Ein Interface für jede Klasse mit nur einer Implementierung ist oft unnötig. Spring kann auch Klassen proxyen. Ich führe ein Interface ein, wenn es eine zweite Implementierung oder eine klare Grenze gibt.
- Zu kleine Klassen machen den Code schwer zu verfolgen.
- YAGNI: Keine Erweiterungspunkte für Fälle, die vielleicht nie kommen.

**Wie man Verletzungen bemerkt:**
- Eine Klasse ändert sich in fast jedem Pull Request. → Zu viele Verantwortungen.
- Ein Konstruktor mit 8 Abhängigkeiten. → Klasse macht zu viel.
- `instanceof`-Ketten oder `switch` über Typen an vielen Stellen. → Open/Closed verletzt. Ausnahme: ein sealed Interface mit Pattern Matching an einer Stelle kann ok sein.
- Unit-Test braucht viele Mocks. → Zu viele Abhängigkeiten.
- SonarQube zeigt hohe Komplexität. → Guter Hinweis für Refactoring.

**Im Team:** Bei CARIAD habe ich Best Practices in Confluence dokumentiert und Code-Reviews in Bitbucket gemacht. *(Ihr echtes Beispiel: ein Review, in dem Sie eine Klasse nach SRP aufgeteilt haben.)*

## Follow-ups
- Was ist der Unterschied zwischen Dependency Inversion und Dependency Injection? → Inversion ist das Prinzip: von Abstraktionen abhängen. Injection ist die Technik: Abhängigkeiten von aussen geben.
- Geben Sie ein Beispiel für eine Liskov-Verletzung. → Eine Unterklasse wirft `UnsupportedOperationException` für eine Methode der Oberklasse. Zum Beispiel eine unveränderliche Liste als `List`.
- Ist SOLID auch für funktionalen Code wichtig? → Die Ideen ja: kleine Funktionen, klare Abhängigkeiten. Die Begriffe kommen aus der OOP.
- Was ist der Unterschied zwischen Kohäsion und Kopplung? → Kohäsion: Teile einer Klasse gehören eng zusammen, gut. Kopplung: Klassen hängen voneinander ab, möglichst wenig.
- Wie überzeugen Sie Kollegen im Review? → Mit einem konkreten Problem, zum Beispiel "dieser Test braucht 6 Mocks". Nicht mit dem Namen des Prinzips.

## Don't say
- Nur die fünf Namen aufzählen ohne Beispiel.
- „Jede Klasse braucht ein Interface.“ Das ist Over-Engineering.

## Words
- **wartbar** = maintainable
- **die Verantwortung** = responsibility
- **die Erweiterung** = extension
- **die Kopplung** = coupling
- **die Kohäsion** = cohesion
