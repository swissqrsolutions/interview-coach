---
id: behaviour-pressure
round: behaviour
tech: [cicd, testing, mssql]
tier: 2
project: ElCom MATCH
q: Erzählen Sie von einer Situation unter Druck. Wie sind Sie vorgegangen?
en: Tell me about a situation under pressure. How did you proceed?
---
## 30s
Unter Druck werde ich ruhiger und systematischer.
Bei MATCH ist unsere CI-Pipeline rot geworden.
Der SQL-Server-Testcontainer wurde vom System beendet: Out of Memory.
Die Ursache: Test-Collections liefen parallel und brauchten zu viel Speicher.
Ich habe den Container auf 2 GB begrenzt, Speicher vor den Tests frei gemacht und die schweren Tests seriell laufen lassen.
Danach war die Pipeline wieder stabil.

## 90s
**Mein Vorgehen unter Druck:**
1. **Ruhig bleiben, Fakten sammeln:** Logs lesen, nicht raten.
2. **Ursache eingrenzen:** Der Container wurde OOM-killed. Also: Speicher.
3. **Warum zu wenig Speicher?** Parallele Test-Collections starten mehrere schwere Tests gleichzeitig.
4. **Fix in mehreren Schichten:**
   - SQL-Container auf 2 GB begrenzt.
   - Build-Server-Speicher vor den Tests frei gemacht.
   - Fail fast beim Start: Wenn der Container nicht hochkommt, sofort abbrechen.
   - Die schweren Collections seriell statt parallel.
5. **Kommunizieren:** Das Team wissen lassen, was los ist.

## 3min
**STAR-L:**
- **Situation:** Bei MATCH laufen Python-Tests und .NET-Komponententests in einem CI-Gate. Der SQL-Server-Testcontainer wurde OOM-killed. *(Ihr echtes Beispiel: Was war der Druck? Release, Sprint-Ende, blockiertes Team?)*
- **Aufgabe:** Die Pipeline schnell wieder grün und stabil machen.
- **Aktion:** Ich habe die Logs analysiert und den OOM-Kill gefunden. Ich habe den Container auf 2 GB begrenzt. Ich habe Speicher auf dem Build-Server frei gemacht. Ich habe einen Fail-fast-Check eingebaut und die schweren Test-Collections seriell gemacht.
- **Resultat:** Die Pipeline lief wieder stabil. *(Ihr echtes Beispiel mit Zahl: z. B. Zeit bis zur Lösung, rote Builds vorher/nachher.)*
- **Lektion:** Ein flaky Build ist kein Pech. Er hat eine Ursache. Und „fail fast“ spart viel Zeit beim Suchen.

**Ähnliche Geschichte:** Docker 29 hat lokal 121 Testcontainers-Tests gebrochen. Ich habe lokal Docker gepinnt bzw. zurückgestuft und mich auf die CI mit kontrollierter Docker-Version verlassen.

**Trade-off:** Serielle Tests sind langsamer. Aber ein stabiler, etwas langsamerer Build ist besser als ein schneller, der zufällig rot wird.

## Follow-ups
- Warum nicht einfach mehr Speicher für den Build-Server? → *(Prüfen: Gab es die Option?)* Mehr Speicher versteckt das Problem nur. Der Container braucht trotzdem eine Grenze.
- Was heisst OOM-killed? → Der Linux-Kernel beendet einen Prozess, wenn kein Speicher mehr da ist. Exit-Code 137.
- Wie erkennen Sie flaky Tests? → Ein Test, der ohne Code-Änderung mal grün, mal rot ist. Ich suche Muster: Zeit, Parallelität, Ressourcen.
- Wie gehen Sie mit Termindruck um? → Ich sage früh und ehrlich, was realistisch ist. Und ich mache das Wichtigste zuerst.

## Don't say
- „Ich arbeite unter Druck am besten.“ ohne Beispiel.
- „Ich habe den Test einfach deaktiviert.“

## Words
- **eingrenzen** = narrow down
- **flaky** = mal grün, mal rot
- **seriell** = nacheinander
- **begrenzen** = cap, limit
- **zurückstufen** = downgrade
