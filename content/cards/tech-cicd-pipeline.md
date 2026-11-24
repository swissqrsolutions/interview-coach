---
id: tech-cicd-pipeline
round: tech
tech: [cicd]
tier: 2
project: MATCH (Azure DevOps, SonarQube, ein CI-Gate)
q: Wie sieht eine gute CI/CD-Pipeline aus? Beschreiben Sie Ihre letzte.
en: What does a good CI/CD pipeline look like? Describe your last one.
---
## 30s
Eine gute Pipeline ist schnell, wiederholbar und stoppt bei Fehlern früh.
Die Schritte: bauen, testen, Qualität prüfen, Image bauen, deployen.
Bei MATCH haben wir Build-, SonarQube- und Deploy-Pipelines in Azure DevOps, dazu einige GitHub Actions.
Die Python-Tests laufen in den .NET-Komponententests mit. So gibt es ein einziges CI-Gate.
Das Deployment selbst macht ArgoCD aus Git.
Soll ich die Stufen genauer zeigen?

## 90s
**Die Stufen:**
1. **Build:** kompilieren, Abhängigkeiten aus einem Cache.
2. **Tests:** Unit-Tests, dann Integrationstests mit Testcontainers.
3. **Qualität:** SonarQube Quality Gate. Rot = Stopp.
4. **Image:** Multi-Stage Dockerfile, Tag = Commit-SHA, Push in die Azure Container Registry.
5. **Deploy:** Der neue Tag kommt ins Git. ArgoCD synchronisiert. *(Prüfen: wie der Tag bei MATCH ins Git kommt.)*

**Ein Ausschnitt (Azure DevOps YAML):**
```
stages:
  - stage: Build
    jobs:
      - job: build_test
        steps:
          - script: dotnet test --collect:"XPlat Code Coverage"
          - task: SonarQubeAnalyze@7
          - task: SonarQubePublish@7
  - stage: Image
    dependsOn: Build
    jobs:
      - job: docker
        steps:
          - task: Docker@2
            inputs:
              command: buildAndPush
              repository: match/api
              tags: $(Build.SourceVersion)
```
*(Beispiel. Prüfen: echte Struktur bei MATCH.)*

Laut gesagt: „Ein Image wird einmal gebaut und dann durch alle Umgebungen geschoben. Ich baue nicht pro Umgebung neu.“

## 3min
**Echte Geschichten aus MATCH:**
- **OOM in der CI:** Der SQL-Server-Testcontainer wurde OOM-killed, wegen paralleler Test-Collections. Lösung: Container auf 2 GB begrenzt, Speicher auf dem Build-Server vorher freigegeben, Fail-fast beim Start, schwere Collections nacheinander.
- **Docker 29 hat Testcontainers gebrochen:** 121 Tests liefen lokal nicht mehr. Lokal habe ich Docker gepinnt bzw. zurückgestuft. Die CI hat eine kontrollierte Docker-Version. Lektion: Werkzeug-Versionen in der CI fest halten.
- **SonarQube und Passwörter:** Sonar fand fest kodierte Passwörter in Test-Fixtures und in der lokalen Compose-Datei. Ich habe die Fake-Passwörter entfernt, die lokale Compose-Datei mit Begründung ausgeschlossen und jede Ausnahme dokumentiert. Regeln habe ich nie pauschal abgeschaltet.

**Was eine Pipeline gut macht:**
- Schnelles Feedback: Unit-Tests in Minuten, langsame Tests parallel oder später.
- Reproduzierbar: feste Versionen für Tools und Base Images.
- Sicher: keine Secrets im Log, Service Connections mit wenigen Rechten, Image-Scan.
- Ein Gate statt vieler Ausnahmen: Bei MATCH gibt es für .NET und Python ein gemeinsames CI-Gate.

**Was ich anders machen würde:** *(Ihr echtes Beispiel, z. B. Pipeline-Zeit messen, Caching für Abhängigkeiten.)*

**Frühere Projekte:** Jenkins bei DAZiT, NABODAT und Flaconi, Bamboo bei CARIAD. CARIAD: Ich habe den ganzen Release-Prozess automatisiert.

## Follow-ups
- Continuous Delivery oder Deployment? → Delivery: jede Version kann live gehen, ein Mensch drückt den Knopf. Deployment: jede grüne Version geht automatisch live.
- Wie machen Sie die Pipeline schneller? → Cache für Abhängigkeiten und Docker-Layer, Tests parallel, nur geänderte Teile bauen.
- Wie gehen Sie mit flaky Tests um? → Nicht einfach wiederholen. Ursache finden, Test isolieren, bis dahin sichtbar markieren.
- Was blockiert bei Ihnen ein Merge? → Rote Tests und ein rotes SonarQube Quality Gate. *(Prüfen: weitere Regeln, z. B. Review-Pflicht.)*

## Don't say
- „Bei roten Tests deployen wir trotzdem, wenn es eilt.“
- „Ich schalte die Sonar-Regel einfach ab.“ Begründete, dokumentierte Ausnahme statt pauschal.

## Words
- **Stufe** = stage
- **zurückstufen** = to downgrade
- **pauschal** = blanket, across the board
- **reproduzierbar** = reproducible
- **fest kodiert** = hardcoded
