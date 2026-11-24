---
id: tech-docker-multistage
round: tech
tech: [k8s]
tier: 2
project: MATCH (Multi-Stage Dockerfiles, CA-Bundle im Spark-Image)
q: Was ist ein Multi-Stage Dockerfile, und was macht ein gutes Image aus?
en: What is a multi-stage Dockerfile, and what makes a good image?
---
## 30s
Ein Multi-Stage Dockerfile hat mehrere `FROM`-Blöcke.
Die erste Stufe baut die App, mit JDK, Maven oder SDK.
Die letzte Stufe enthält nur das Ergebnis und eine kleine Runtime.
So ist das Image klein und hat keine Build-Werkzeuge. Das ist sicherer.
Bei MATCH nutzen wir Multi-Stage Dockerfiles. Die Images liegen in der Azure Container Registry.
Soll ich ein Beispiel für Spring Boot zeigen?

## 90s
**Beispiel Spring Boot:**
```
# Stufe 1: bauen
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -q dependency:go-offline        # Abhängigkeiten als eigener Layer
COPY src ./src
RUN mvn -q package -DskipTests

# Stufe 2: laufen
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 10001 app
COPY --from=build /src/target/app.jar app.jar
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```
Laut gesagt: „Zuerst kopiere ich nur die `pom.xml`. Ändert sich nur der Code, kommen die Abhängigkeiten aus dem Cache. Das macht den Build schnell.“

**Was das bringt:**
- Image ohne Maven und JDK: kleiner, weniger Sicherheitslücken.
- Nicht-root-User: passt zu Policies wie Kyverno bei MATCH (keine privilegierten Pods).
- Gleicher Build überall: lokal und in der CI.

## 3min
**Gute Images – meine Liste:**
- Base Image mit fester Version, nie `latest`. Regelmäßig aktualisieren.
- Kleine Runtime: JRE statt JDK, oder distroless bzw. Chiseled Images für .NET.
- `.dockerignore`, damit `target/`, `.git` und Secrets nicht im Build-Kontext landen.
- Keine Secrets im Image, auch nicht in einem früheren Layer. Für Build-Secrets: `RUN --mount=type=secret`.
- Ein Prozess pro Container. Logs nach stdout.
- Image-Scan in der CI.

**Echte Geschichte (MATCH):** Ein Firmen-Proxy hat TLS neu signiert. Spark-Jobs und `pip` sind gescheitert, weil sie dem Zertifikat nicht vertraut haben. Lösung: Das CA-Bundle der Firma direkt ins Spark-Image einbauen. Lektion: Vertrauen und Zertifikate gehören bewusst ins Image, nicht als Workaround zur Laufzeit.

**Spring Boot Alternative:** Layered JARs oder Buildpacks (`mvn spring-boot:build-image`). Dann trennt Spring die Abhängigkeiten von meinem Code in eigene Layer.

**Frühere Erfahrung:** Bei CARIAD habe ich Dockerfiles für ein effizientes DB-Setup geschrieben.

**Trade-off distroless:** Sehr klein und sicher, aber keine Shell. Debugging geht dann mit `kubectl debug` und einem Ephemeral Container.

## Follow-ups
- Was ist ein Layer? → Jede Anweisung wie `RUN` oder `COPY` erzeugt eine Schicht. Unveränderte Schichten kommen aus dem Cache.
- Warum ist die Reihenfolge im Dockerfile wichtig? → Was sich selten ändert, kommt zuerst. Sonst wird der Cache bei jeder Code-Änderung ungültig.
- CMD oder ENTRYPOINT? → ENTRYPOINT ist das Programm. CMD sind Standard-Argumente, die man beim Start überschreiben kann.
- Wie klein ist klein genug? → Kein fester Wert. Wichtig ist: keine Build-Tools, keine unnötigen Pakete, wenige bekannte Lücken.
- Warum nicht als root? → Bricht jemand aus der App aus, hat er weniger Rechte. Viele Cluster-Policies verbieten root.

## Don't say
- „Ich nehme `FROM openjdk:latest`.“ Keine feste Version, und das Image ist veraltet.
- „Das Passwort setze ich mit `ENV` im Dockerfile.“ Es bleibt im Image sichtbar.

## Words
- **Stufe** = stage
- **Schicht (Layer)** = layer
- **Sicherheitslücke** = vulnerability
- **vertrauen** = to trust
- **Build-Kontext** = Dateien, die Docker zum Bauen bekommt
