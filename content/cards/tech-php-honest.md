---
id: tech-php-honest
round: tech
tech: [php]
tier: 4
proof: study
project: Java/Spring (DAZiT, DigiSanté) als Vergleich
q: Haben Sie Erfahrung mit PHP?
en: Do you have experience with PHP?
---
## 30s
Ehrlich gesagt: Mit PHP habe ich nicht produktiv gearbeitet.
Ich kenne aber die Grundlagen von modernem PHP 8: Typen, Klassen, Composer und Frameworks wie Symfony und Laravel.
Die Konzepte kenne ich gut aus Java und Spring: MVC, Dependency Injection, ORM, REST.
Symfony ist in der Struktur ähnlich wie Spring.
Ich lerne neue Sprachen schnell: Kotlin, Go und C# habe ich in Projekten neben Java genutzt.
Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich von Spring Boot bei DAZiT und DigiSanté.

## 90s
**So antworte ich, wenn ich eine Sprache nicht kenne:**
1. Ehrlich sagen: nicht produktiv.
2. Zeigen, was ich weiß: die Konzepte.
3. Eine Brücke zu meiner Erfahrung bauen.
4. Einen Plan nennen: wie ich mich einarbeite.

**Konzepte im Vergleich:**
| PHP | Java |
|---|---|
| Composer | Maven / Gradle |
| Symfony / Laravel | Spring Boot |
| Doctrine (Symfony) | Hibernate / JPA |
| Eloquent (Laravel) | Active Record, ähnlich wie einfache Repositories |
| PHPUnit | JUnit |
| PSR-Standards | Java-Konventionen, Jakarta-Specs |

**Modernes PHP 8:**
```php
final class Invoice {
    public function __construct(
        public readonly string $id,
        public readonly float $amount,
    ) {}
}
```
- Typen für Parameter und Rückgabe, Enums, `match`, Attribute, readonly Properties.

## 3min
**Was bei PHP anders ist als bei Java:**
- Shared-nothing: Klassisch startet jeder Request bei Null (PHP-FPM). Kein Zustand im Speicher zwischen Requests. Cache und Sessions liegen extern, zum Beispiel in Redis.
- Darum kein Thread-Problem wie in Java, aber teurer Start pro Request. OPcache hilft dabei.
- Dynamische Typen sind möglich. `declare(strict_types=1);` macht es strenger.

**Mein Plan für die ersten Wochen:**
- Bestehenden Code lesen und die Architektur verstehen.
- Kleine Bugs und Tests zuerst, mit Code Review vom Team.
- Statische Analyse mit PHPStan oder Psalm, wie SonarQube bei mir in Java-Projekten.

**Was ich sofort mitbringe:** Architektur, REST-Design, SQL, Testing, CI/CD, Docker und Kubernetes, Security. Das ist in jeder Sprache gleich.

**Was ich nicht sage:** Ich behaupte nicht, PHP zu können. Lieber ehrlich und mit Plan. Das schafft Vertrauen.

## Follow-ups
- Wie schnell können Sie produktiv sein? → Für kleine Aufgaben in wenigen Wochen, mit Review. Die Konzepte kenne ich schon.
- Was ist Composer? → Der Paketmanager von PHP, wie Maven für Java.
- Was ist der Unterschied zwischen Laravel und Symfony? → Laravel ist schnell für den Start, mit viel Konvention. Symfony ist modularer und ähnlich wie Spring.
- Was ist eine typische Sicherheitslücke in PHP-Apps? → SQL Injection ohne Prepared Statements und XSS ohne Escaping. Das gleiche wie in Java.
- Haben Sie schon eine neue Sprache schnell gelernt? → Ja: Go bei Flaconi für einen Exporter, Kotlin bei CARIAD für Tooling, C# bei MATCH für den Worker.

## Don't say
- „PHP ist eine schlechte Sprache.“ Nie die Sprache des Arbeitgebers schlecht machen.
- „Ja, ich kann PHP.“ Nicht wahr. Ehrlich bleiben.

## Words
- **ehrlich gesagt** = to be honest
- **die Brücke** = bridge, Verbindung zu meiner Erfahrung
- **sich einarbeiten** = to get up to speed
- **der Paketmanager** = package manager
- **das Vertrauen** = trust
