---
id: assessment-case-question
round: assessment
tech: [federal, microservices]
tier: 1
q: Hier ist ein technischer Fall aus unserer Ausschreibung. Wie gehen Sie vor?
en: Here is a technical case from our tender. How do you approach it?
---
## 30s
Zuerst wiederhole ich den Fall in einem Satz.
Dann stelle ich drei Fragen: Wer nutzt es? Wie viele Daten? Welche Regeln gelten?
Danach mache ich einen einfachen Plan: Ablauf, Daten, Sicherheit, Betrieb.
Am Ende nenne ich die Risiken und einen ersten Schritt.
Wenn ich etwas nicht weiss, sage ich das offen.

## 90s
**Die Struktur (immer gleich):**
1. **Verstehen:** „Habe ich richtig verstanden, dass …?“
2. **Fragen:** Nutzer, Menge, Verfügbarkeit, Datenschutz, bestehende Systeme.
3. **Annahmen:** Wenn keine Antwort kommt: „Ich nehme an, dass …“ Laut sagen.
4. **Lösung in Schichten:** Eingang → Verarbeitung → Speicher → Ausgabe.
5. **Querschnitt:** Sicherheit (DSG, Netz, Identität), Betrieb (Monitoring), Tests.
6. **Risiken und erster Schritt:** Was kann schiefgehen? Was baue ich zuerst?

**Beispiel kurz:** Fall: „Ein Amt bekommt Dateien von Firmen und braucht Statistiken.“
→ Upload mit Scan und Quarantäne (wie DigiSanté). → Idempotente Ingestion in ein Lakehouse (wie MATCH). → Statistik pro Tag neu rechnen. → Zugriff über Keycloak, nur private Netze.

## 3min
**Was die Jury bewertet (ZK14 Fachwissen, ZK16 klare Sprache):**
- Struktur ist wichtiger als die perfekte Lösung.
- Trade-offs zeigen: „Option A ist einfacher, Option B skaliert besser.“
- Ehrlichkeit: Eine unbekannte Technologie nicht erfinden.

**Unbekannte Technologie im Fall:**
„Produktiv habe ich *(X)* noch nicht eingesetzt. Das Prinzip kenne ich von *(Y)*. Ich würde so vorgehen: …“ Dann die Struktur oben.

**Senior-Signale:**
- Nach den nicht-funktionalen Anforderungen fragen: Verfügbarkeit, Datenschutz, Aufbewahrung.
- Einen schrittweisen Go-live vorschlagen: parallel zum alten System, hinter einem Feature Switch. So war es bei MATCH.
- Messbare Abnahme vorschlagen: zum Beispiel ein automatischer Vergleich mit dem alten System.

**Zeit:** Bei 10 Minuten: 1 Minute verstehen, 2 Minuten fragen, 5 Minuten Lösung, 2 Minuten Risiken.

**Am Ende:** „Welchen Teil soll ich vertiefen?“

## Follow-ups
- Welche Technologie würden Sie wählen? → Die einfachste, die die Anforderungen erfüllt. Dann einen Grund und einen Trade-off.
- Was ist das grösste Risiko? → Ein konkretes Risiko nennen, zum Beispiel Datenqualität oder Migration, und wie ich es messe.
- Was, wenn die Anforderung sich ändert? → Kleine Schritte, Feature Switch, Tests. So bleibt das System änderbar.
- Wie schätzen Sie den Aufwand? → Grob in Teilen, mit Annahmen. *(Ihr echtes Vorgehen: z. B. Story Points im Team.)*

## Don't say
- Sofort eine Lösung zeichnen, ohne Fragen.
- „Das kenne ich nicht“ und dann schweigen.
- Zehn Technologien nennen, ohne Grund.

## Words
- **die Annahme** = assumption
- **die nicht-funktionale Anforderung** = non-functional requirement
- **der Querschnitt** = cross-cutting concern
- **vertiefen** = to go deeper
- **die Aufbewahrung** = data retention
