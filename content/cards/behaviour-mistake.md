---
id: behaviour-mistake
round: behaviour
tech: [dremio, k8s]
tier: 1
project: ElCom MATCH
q: Erzählen Sie von einem Fehler, den Sie gemacht haben.
en: Tell me about a mistake you made.
---
## 30s
Ein guter Fehler für das Interview ist echt, technisch und mit einer Lektion.
Bei MATCH lief der Nessie-Katalog zuerst mit RocksDB im Pod.
Bei einem Reschedule konnte der Katalog verloren gehen. Ohne Katalog sind die Iceberg-Tabellen nicht mehr lesbar.
*(Prüfen: War das Ihre eigene Entscheidung? Nur dann als eigenen Fehler erzählen.)*
Ich habe Nessie auf ein Postgres-Backend umgestellt.
Meine Lektion: Der Katalog ist der wertvollste Teil eines Lakehouse.

## 90s
**So erzähle ich einen Fehler:**
1. Klar sagen: „Das war mein Fehler.“
2. Kurz erklären, warum er passiert ist.
3. Was ich sofort getan habe.
4. Was ich dauerhaft geändert habe.
5. Die Lektion.

**Das Risiko technisch:**
- Iceberg-Daten liegen als Dateien in MinIO.
- Nessie weiss, welcher Snapshot der aktuelle ist.
- RocksDB im Pod speichert das lokal. Wird der Pod auf einen anderen Node verschoben, ist der Zustand weg.
- Mit Postgres liegt der Zustand in einer richtigen Datenbank mit Backup.

## 3min
**STAR-L:**
- **Situation:** Bei MATCH haben wir das Lakehouse auf Kubernetes aufgebaut. Nessie lief mit eingebettetem RocksDB.
- **Aufgabe:** *(Prüfen: Wie wurde das Risiko bemerkt? Ein Vorfall oder eine Analyse?)*
- **Aktion:** Ich habe das Risiko analysiert. Ich habe Nessie auf ein Postgres-Backend umgestellt. *(Ihr echtes Beispiel: Wie haben Sie die bestehenden Katalog-Daten übernommen?)*
- **Resultat:** Der Katalog überlebt jetzt Pod-Reschedules. *(Ihr echtes Beispiel mit einer Zahl.)*
- **Lektion:** Bei Stateful-Komponenten frage ich zuerst: Wo liegt der Zustand? Was passiert bei einem Neustart?

**Alternative Geschichte, falls Nessie nicht Ihr Fehler war:** *(Ihr echtes Beispiel: ein eigener Fehler mit Lektion.)*

**Warum diese Art Geschichte gut ist:**
- Der Fehler ist echt, aber er hat keinen grossen Schaden gemacht.
- Er zeigt Verantwortung: Ich habe ihn selbst behoben.
- Die Lektion ist allgemein und reif.

## Follow-ups
- Wie haben Sie es gemerkt? → *(Ihr echtes Beispiel.)*
- Was hätten Sie früher tun können? → Bei jeder Komponente fragen: Wo ist der Zustand, gibt es ein Backup?
- Hat der Kunde etwas gemerkt? → *(Prüfen.)*
- Was ist Ihr grösster Fehler in der Karriere? → *(Ihr echtes Beispiel.)*

## Don't say
- „Ich mache keine Fehler.“ oder ein Fake-Fehler wie „Ich arbeite zu viel“.
- Nicht die Schuld einem Kollegen oder einem Tool geben.

## Words
- **Zustand** = state
- **eingebettet** = embedded
- **verschieben (Reschedule)** = Pod startet auf einem anderen Node
- **Vorfall** = incident
