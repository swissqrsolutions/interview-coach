---
id: project-digisante-upload
round: project
tech: [azure, security, microservices, federal]
tier: 1
project: BAG DigiSanté
q: Erklären Sie den Datei-Upload bei DigiSanté. Wie schützen Sie das System vor gefährlichen Dateien?
en: Explain the file upload at DigiSanté. How do you protect the system from dangerous files?
---
## 30s
DigiSanté ist das nationale Gesundheitsportal vom BAG.
Ich habe den Upload-Service als Quarantäne-Pipeline gebaut, eventgesteuert.
Die Upload-Funktion antwortet direkt nach dem Schreiben in den Blob Storage.
Microsoft Defender scannt die Datei. Eine zweite Funktion liest das Ergebnis aus dem Event Hub.
Dann wird die Datei freigegeben oder gelöscht.
Alles läuft im privaten Azure-Netz.
Soll ich die Sicherheitsschichten genauer erklären?

## 90s
**Der Ablauf:**
1. Der Client schickt die Datei mit einem JWT.
2. Die Upload-Funktion prüft das JWT (RS256) gegen den Public Key aus Key Vault. Erst dann wird das erste Byte gespeichert.
3. Apache Tika prüft die Byte-Signatur. So erkennen wir den echten Dateityp, nicht nur die Endung.
4. Die Datei liegt im Blob Storage in Quarantäne. Die Funktion antwortet sofort.
5. Defender for Cloud scannt die Datei.
6. Das Scan-Ergebnis kommt als Event. Eine eigene Event-Hub-Funktion liest es.
7. Sauber → Datei freigeben. Gefährlich → Datei löschen.

**Netz:** Functions, Storage, Key Vault und Event Hub sind nur über Private Endpoints erreichbar. Defender läuft in einer Netzgrenze, die Microsoft verwaltet. Für Event Grid gibt es eine bewusste Ausnahme mit öffentlichem Zugang.

## 3min
**Warum asynchron?**
- Ein Scan dauert. Würde der Upload warten, wäre er langsam und könnte in Timeouts laufen.
- So bleibt der Upload schnell. Der Status sagt dem Nutzer: in Prüfung.
- Upload und Scan-Auswertung sind getrennte Funktionen. Jede skaliert für sich.

**Verteidigung in Schichten:**
1. Wer? JWT-Prüfung vor dem ersten Byte.
2. Was? Tika prüft die Byte-Signatur gegen Spoofing, zum Beispiel eine .exe als .pdf.
3. Ist es sauber? Defender-Scan.
4. Wo? Nur private Endpoints. Keine öffentlichen Schlüssel im Code.

**Die Ausnahme für Event Grid:**
Das ist ein bewusster Trade-off. Der Defender-Weg braucht diesen Zugang. Wir haben die Ausnahme klein gehalten und dokumentiert. *(Prüfen: genaue Begründung und wer sie genehmigt hat.)*

**Was schiefgehen kann:**
- Das Scan-Event kommt nie an. Dann bleibt die Datei für immer in Quarantäne. *(Prüfen: Gibt es ein Timeout oder Monitoring dafür?)*
- Ein Event kommt doppelt. Die Freigabe muss idempotent sein: Eine schon freigegebene Datei bleibt freigegeben.
- Der Scan sagt „gefährlich“ für eine gute Datei. Dann braucht es einen klaren Prozess für den Nutzer.

**Was ich heute anders machen würde:** *(Ihr echtes Beispiel.)*

## Follow-ups
- Warum Tika und nicht den Content-Type-Header? → Den Header schickt der Client. Er kann lügen. Tika liest die ersten Bytes der Datei.
- Warum RS256 und nicht HS256? → Bei RS256 prüfen wir nur mit dem Public Key. Der private Schlüssel bleibt beim Aussteller.
- Event Grid oder Event Hub, was ist der Unterschied? → Event Grid verteilt einzelne Ereignisse an Abonnenten. Event Hub ist ein Stream mit hohem Durchsatz und Partitionen, ähnlich wie Kafka.
- Wie sieht der Nutzer den Status? → *(Prüfen: Wie wird der Status an den Client gemeldet?)*
- Wie gross dürfen Dateien sein? → *(Ihr echtes Beispiel: Grössenlimit.)*
- Was ist ein Private Endpoint? → Eine private IP für einen Azure-Dienst im eigenen VNet. Der Dienst ist dann nicht über das Internet erreichbar.
- Wie testen Sie das? → *(Ihr echtes Beispiel: z. B. Test mit EICAR-Testdatei.)*

## Don't say
- „Der Virenscan reicht.“ Sagen Sie: mehrere Schichten (Identität, Dateityp, Scan, Netz).
- Nicht sagen, dass alles öffentlich war. Nur Event Grid hatte die bewusste Ausnahme.

## Words
- **Quarantäne** = isolierter Bereich bis zur Prüfung
- **freigeben** = release
- **Byte-Signatur** = magic bytes am Dateianfang
- **Netzgrenze** = network boundary
- **bewusste Ausnahme** = deliberate exception
