---
id: project-draw-architecture
round: project
tech: [patterns, lakehouse, k8s]
tier: 1
project: ElCom MATCH
q: Zeichnen Sie die Architektur Ihres Projekts an das Whiteboard.
en: Draw your project's architecture on the whiteboard.
---
## 30s
Ich zeichne immer in derselben Reihenfolge, in zwei Minuten.
Links die Quelle, rechts der Nutzer. Der Datenfluss geht von links nach rechts.
In die Mitte kommen die Verarbeitung und die Speicher.
Unten zeichne ich die Plattform: Kubernetes, CI/CD, Monitoring.
Dann markiere ich mit einem Stern, was ich selbst gebaut habe.
Bei MATCH sind das fünf Boxen in einer Reihe.
Soll ich es Ihnen gleich zeigen?

## 90s
**Die 6 Schritte (je 15–20 Sekunden):**
1. **Quelle links:** „Energiefirmen schicken ZIPs mit XML.“
2. **Nutzer rechts:** „Die ElCom sieht Records und Charts in der Web-UI.“
3. **Fluss in der Mitte**, mit Pfeilen: Eingang → Verarbeitung → Speicher → Abfrage.
4. **Unter jeden Pfeil ein Wort**, was passiert: „claim“, „parse“, „append“, „SQL“.
5. **Plattform als Kasten unten:** AKS, Helm, ArgoCD, Vault, Grafana.
6. **Stern** an meine Teile. Dann eine Entscheidung nennen.

**MATCH als Beispiel:**
```
[Firmen: ZIP+XML]
      |
   [MinIO]  +  [MSSQL: Status Pending]
      |              |
      |       [.NET Worker] --REST--> [Spark]*
      |                                  |
      +------> Bronze -> Silver -> Gold* (Iceberg + Nessie)
                                         |
                                     [Dremio] --Arrow Flight--> [Web-UI] -> [ElCom]

  ----------------------------------------------------------------
  Plattform: AKS (Terraform) | Helm* | ArgoCD* | Vault | Keycloak | Grafana
  (* = mein Teil)
```

## 3min
**Warum diese Methode funktioniert:**
- Der Interviewer sieht sofort den Wert: von wo nach wo fliessen die Daten.
- Der Stern beantwortet die wichtigste Frage: Was haben SIE gebaut?
- Die Plattform unten trennt das Fachliche von der Technik.

**Typische Fehler und wie ich sie vermeide:**
- Zu viele Boxen am Anfang. Ich starte mit fünf. Details zeichne ich nur auf Nachfrage dazu.
- Nur Tool-Namen. Unter jeden Pfeil schreibe ich, was passiert.
- Keine Nutzer. Ich zeichne immer, wer das Ergebnis braucht.
- Stumm zeichnen. Ich spreche bei jeder Box einen Satz.

**Die zweite Ebene (auf Nachfrage):**
- **Fehlerfall:** Wo kann es brechen? Bei MATCH: der Claim und der Iceberg-Commit. Dort zeichne ich den Stale-Job-Timeout ein.
- **Skalierung:** Karpenter startet Nodes für Spark-Spitzen.
- **Sicherheit:** Keycloak für Login, Cilium-Policies zwischen den Pods, Secrets aus Vault.
- **Alt und neu:** Die alte UI auf MSSQL bleibt. Ein Feature-Switch schaltet um.

**Dasselbe für andere Projekte:**
- DigiSanté-Upload: Client → Upload-Funktion → Blob (Quarantäne) → Defender → Event Hub-Funktion → freigeben/löschen.
- DAZiT: Fachsysteme → Services → Kafka → Services → Angular-UI.

## Follow-ups
- Wo ist der Single Point of Failure? → Bei MATCH ist der Nessie-Katalog sehr kritisch. Darum läuft er jetzt mit Postgres-Backend statt RocksDB im Pod.
- Wo ist der Engpass? → *(Ihr echtes Beispiel: Wo wurde es zuerst langsam?)*
- Wo laufen die Secrets? → Vault und Azure Key Vault, über den External Secrets Operator. Nicht im Repo.
- Was passiert, wenn Dremio ausfällt? → Die Ingestion läuft weiter. Nur die neue UI kann nicht lesen. Die alte UI auf MSSQL bleibt.
- Zeichnen Sie das Deployment. → Git → ArgoCD → AKS. Images aus ACR, gebaut in Azure DevOps.

## Don't say
- „Das ist kompliziert, ich weiss nicht, wo ich anfangen soll.“ Starten Sie immer links mit der Quelle.
- Nicht 20 Boxen auf einmal zeichnen. Fünf reichen für den Anfang.

## Words
- **Datenfluss** = data flow
- **Engpass** = bottleneck
- **auf Nachfrage** = when asked
- **Single Point of Failure** = ein Teil, dessen Ausfall alles stoppt
