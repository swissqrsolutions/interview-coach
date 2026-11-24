---
id: behaviour-constraints
round: behaviour
tech: [cicd, spark, federal]
tier: 2
project: ElCom MATCH
q: Wie arbeiten Sie in einer Umgebung mit vielen Einschränkungen, zum Beispiel beim Bund?
en: How do you work in an environment with many constraints, e.g. the federal administration?
---
## 30s
Im Bundesumfeld gibt es Proxys, strenge Netze und Qualitäts-Regeln.
Ich sehe das nicht als Hindernis. Die Regeln haben einen Grund.
Ich suche eine saubere Lösung innerhalb der Regeln, keine Abkürzung.
Bei MATCH signiert ein Firmen-Proxy TLS neu. Spark-Jobs und pip sind gescheitert.
Ich habe das Firmen-CA-Zertifikat ins Spark-Image eingebaut.
Und SonarQube-Funde habe ich gelöst, statt Regeln global abzuschalten.

## 90s
**Geschichte 1: Proxy**
- Problem: Der Proxy bricht TLS auf und signiert neu. Spark und pip vertrauen dem Zertifikat nicht.
- Falsche Lösung: TLS-Prüfung ausschalten.
- Meine Lösung: Das Firmen-CA-Bundle ins Spark-Image einbauen. Die Prüfung bleibt an.

**Geschichte 2: SonarQube**
- Problem: SonarQube meldet hartcodierte Passwörter in Test-Fixtures und im lokalen Compose-File.
- Falsche Lösung: die Regel für alles abschalten.
- Meine Lösung: Fake-Passwörter in Fixtures auf null gesetzt. Das Compose-File für die lokale Entwicklung mit Begründung ausgeschlossen. Jede Unterdrückung dokumentiert.

## 3min
**STAR-L (Proxy):**
- **Situation:** Bei MATCH laufen Spark-Jobs hinter einem Firmen-Proxy. Der Proxy signiert TLS neu.
- **Aufgabe:** Spark und pip müssen wieder funktionieren, ohne die Sicherheit zu schwächen.
- **Aktion:** Ich habe die Fehlermeldung analysiert: Zertifikat nicht vertrauenswürdig. Ich habe das Firmen-CA-Bundle in das Spark-Image eingebaut. So vertrauen Spark und pip dem Proxy, und die TLS-Prüfung bleibt aktiv.
- **Resultat:** Spark-Jobs und pip laufen wieder. *(Ihr echtes Beispiel mit Zahl: z. B. wie viele Images, wie lange blockiert?)*
- **Lektion:** Eine Sicherheitsregel nie abschalten, um ein Problem zu lösen. Die Ursache verstehen und richtig lösen.

**STAR-L (SonarQube), kurz:**
Funde ernst nehmen, gezielt lösen, nur mit Begründung unterdrücken. Nie Regeln pauschal deaktivieren. Ergebnis: Quality Gate grün, und jede Ausnahme ist nachvollziehbar.

**Senior-Sicht:**
- Im Bund prüfen Audits später, was wir gemacht haben. Dokumentierte Ausnahmen sind dann Gold wert.
- Einschränkungen früh im Projekt klären: Proxy, Netz, erlaubte Images. Das spart Wochen.
- Bei DigiSanté gab es eine bewusste Ausnahme für Event Grid. Auch das: klein halten und dokumentieren.

## Follow-ups
- Warum nicht einfach verify=False in pip? → Dann ist jede Verbindung ungeschützt. Das ist eine Sicherheitslücke und würde in jedem Review auffallen.
- Wie bauen Sie ein CA-Zertifikat in ein Image ein? → Das Zertifikat ins Image kopieren und den Trust Store aktualisieren, z. B. update-ca-certificates. Für Java zusätzlich in den Java Trust Store. *(Prüfen: genauer Weg im Projekt.)*
- Wie gehen Sie mit langsamen Freigabe-Prozessen um? → Früh anfragen, Anfragen vollständig machen, parallel weiterarbeiten.
- Welche Einschränkungen gibt es noch im Bund? → Datenschutz (DSG), nur erlaubte Images, private Netze, HERMES als Projektmethode.

## Don't say
- „Die Regeln beim Bund sind nur bürokratisch.“
- „Ich habe die Prüfung kurz ausgeschaltet.“

## Words
- **Einschränkung** = constraint
- **Abkürzung** = shortcut
- **vertrauenswürdig** = trusted
- **pauschal** = across the board
- **nachvollziehbar** = traceable, understandable
