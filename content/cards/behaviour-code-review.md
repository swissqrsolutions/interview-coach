---
id: behaviour-code-review
round: behaviour
tech: [cicd, testing, patterns]
tier: 1
project: CARIAD, Unisys
q: Wie machen Sie Code-Reviews?
en: How do you do code reviews?
---
## 30s
Ein Review soll Fehler finden und Wissen teilen. Es ist kein Urteil über die Person.
Zuerst prüfen Tools: Build, Tests und SonarQube. Dann schaue ich als Mensch.
Ich prüfe in einer festen Reihenfolge: korrekt, sicher, schnell genug, lesbar.
Ich schreibe Fragen statt Befehle, und ich lobe gute Lösungen.
Bei CARIAD habe ich Reviews in Bitbucket gemacht und Best Practices in Confluence beschrieben.
Bei Unisys habe ich Code-Qualitäts-Standards eingeführt: SonarQube, Reviews, Testautomatisierung.

## 90s
**Meine Reihenfolge:**
1. **Verstehen:** Was ist das Ziel? Ich lese zuerst die Story und die Beschreibung.
2. **Korrekt:** Stimmt die Logik? Gibt es Tests für Randfälle?
3. **Sicher:** Eingaben geprüft? Keine Secrets? Keine SQL-Injection?
4. **Performance:** Gibt es N+1-Abfragen oder unnötige Schleifen?
5. **Lesbar:** Gute Namen, kleine Methoden, passt es zur Architektur?

**Wie ich kommentiere:**
- „Was passiert, wenn die Liste leer ist?“ statt „Das ist falsch.“
- Ich markiere: **muss** (Blocker) oder **kann** (Vorschlag, nit).
- Stil-Fragen löst ein Formatter, nicht das Review.

**Regeln für das Team:** kleine Merge Requests, schnelle Antwort (am selben Tag), mindestens ein Approve.

## 3min
**STAR-L:**
- **Situation:** Bei Unisys arbeiten wir im Bundesumfeld. Qualität ist Pflicht.
- **Aufgabe:** Einen gemeinsamen Qualitäts-Standard für das Team.
- **Aktion:** Ich habe SonarQube als Gate eingeführt. Ich habe Regeln für Reviews festgelegt. Ich habe Testautomatisierung mit JUnit, Playwright und Cypress aufgebaut.
- **Resultat:** *(Ihr echtes Beispiel mit einer Zahl: z. B. Testabdeckung, weniger Bugs in Produktion.)*
- **Lektion:** Tools prüfen das Einfache. Menschen prüfen Design und Sinn. Beides braucht man.

**Ein Beispiel für Haltung:** SonarQube hat einmal hartcodierte Passwörter in Test-Fixtures gefunden. Ich habe die Regel nicht global abgeschaltet. Ich habe die Passwörter entfernt und nur das lokale Compose-File mit Begründung ausgeschlossen. Jede Unterdrückung ist dokumentiert.

**Trade-offs:**
- Zu strenge Reviews machen das Team langsam. Zu lockere lassen Fehler durch.
- Grosse Merge Requests kann niemand gut prüfen. Lieber viele kleine.
- Bei Streit über Design: kurz sprechen statt 20 Kommentare schreiben.

## Follow-ups
- Was tun Sie, wenn ein Kollege Ihre Kommentare ignoriert? → Ich spreche direkt mit ihm. Ich erkläre das Risiko. Wenn wir uns nicht einig sind, fragen wir das Team.
- Wie reviewen Sie Code von einem Senior? → Genauso. Fragen sind immer erlaubt. Ich lerne auch dabei.
- Wie lange darf ein Review dauern? → Ziel: Antwort am selben Tag. Ein Review blockiert sonst den Kollegen.
- Reviewen Sie auch KI-generierten Code? → Ja, genauso streng. Ich übernehme keinen Code ohne Prüfung und ohne Test.
- Was ist Pair Programming im Vergleich? → Ein Review in Echtzeit. Gut für schwierige Teile und für Juniors.

## Don't say
- „Ich approve schnell, damit es weitergeht.“
- „Das ist schlecht.“ ohne Begründung und Vorschlag.

## Words
- **Randfall** = edge case
- **Blocker** = muss vor dem Merge gelöst sein
- **Unterdrückung** = suppression (Regel für eine Stelle ausschalten)
- **Haltung** = attitude
