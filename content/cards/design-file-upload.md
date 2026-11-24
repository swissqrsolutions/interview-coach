---
id: design-file-upload
round: design
tech: [azure, microservices]
tier: 1
project: BAG DigiSanté (file-upload service)
q: Entwerfen Sie einen sicheren Datei-Upload für ein Behördenportal.
en: Design a secure file upload for a government portal.
---
## 30s
Zuerst frage ich: Wie viele Dateien? Wie gross? Welche Dateitypen? Wie sensibel sind die Daten?
Genau so etwas habe ich bei DigiSanté gebaut, dem nationalen Gesundheitsportal.
Die Upload-Function prüft zuerst das Token. Dann schreibt sie die Datei in einen Blob und antwortet sofort.
Microsoft Defender scannt die Datei. Das Ergebnis kommt über Event Hub zu einer zweiten Function.
Diese gibt die Datei frei oder löscht sie.
Alles läuft in privaten Azure-Netzen, über Private Endpoints.
Soll ich die Sicherheitsschritte genauer zeigen?

## 90s
**Zahlen (Annahme für das Interview):** 50 000 Uploads pro Tag, je bis 20 MB. Das sind weniger als 1 pro Sekunde im Schnitt, Spitze vielleicht 20 pro Sekunde. Speicher: bis 1 TB pro Monat. *(Prüfen: echte Zahlen von DigiSanté, falls Sie sie kennen und nennen dürfen.)*

**API:**
```
POST /api/files          (multipart, Authorization: Bearer <JWT>)
  → 202 { "fileId": "...", "status": "QUARANTINE" }
GET  /api/files/{id}      → { "status": "CLEAN" | "REJECTED" | "QUARANTINE" }
GET  /api/files/{id}/content   → nur wenn CLEAN
```

**Datenmodell (mein Vorschlag):**
```
files(id PK, tenant_id, owner_id, blob_path, mime_type, size_bytes, sha256,
      status, scan_result, created_at, released_at)
```

**SQL laut gesagt:**
```
UPDATE files SET status = 'CLEAN', released_at = now()
WHERE id = :id AND status = 'QUARANTINE';
```
„Ich gebe die Datei nur frei, wenn sie noch in Quarantäne ist. Kommt das Scan-Event doppelt, ändert sich nichts.“

```
SELECT id, status FROM files
WHERE owner_id = :user AND tenant_id = :tenant
ORDER BY created_at DESC LIMIT 20;
```
„Der Nutzer sieht nur seine Dateien in seinem Mandanten.“

**Ablauf bei DigiSanté:**
1. JWT (RS256) wird gegen den Public Key aus Key Vault geprüft. Erst dann wird das erste Byte gespeichert.
2. Apache Tika prüft die Byte-Signatur. Eine .exe mit Namen .pdf wird erkannt.
3. Die Function schreibt in den Quarantäne-Blob und antwortet sofort.
4. Defender for Cloud scannt. Das Ergebnis liest eine eigene Function aus Event Hub. *(Prüfen: genauer Weg Event Grid → Event Hub in Ihrem Projekt.)*
5. Sauber → freigeben. Malware → löschen.

## 3min
**Warum asynchron?** Der Scan dauert Sekunden bis Minuten. Der Nutzer soll nicht warten. Darum antwortet der Upload sofort und der Status wechselt später.

**Netzwerk:** Functions, Storage, Key Vault und Event Hub sind nur über Private Endpoints erreichbar. Defender läuft in einer von Microsoft verwalteten Netzwerkgrenze. Für Event Grid gab es eine bewusste Ausnahme beim öffentlichen Zugriff. Diese Ausnahme war dokumentiert und begründet.

**Sicherheit in Schichten:**
- Token-Prüfung vor dem Speichern.
- Dateityp über Bytes, nicht über Endung oder Content-Type-Header.
- Grösse begrenzen, schon im Gateway.
- Quarantäne: Keine Datei ist lesbar, bevor der Scan sauber ist.
- Managed Identity statt Schlüssel. Keine Secrets im Code.

**Grosse Dateien:** Für Dateien über 100 MB würde ich direkt in den Blob hochladen lassen, mit einer kurzen SAS-URL. Dann muss die Token-Prüfung vor der Ausgabe der SAS-URL passieren. Bei DigiSanté ging der Upload durch die Function.

**Skalierung:** Functions skalieren automatisch. Blob Storage skaliert fast ohne Grenze. Engpass ist eher der Scan. Darum ist der Ablauf eventbasiert.

**Fehler:**
- Scan-Event kommt nicht: Ein Job sucht Dateien, die länger als 1 Stunde in Quarantäne sind, und alarmiert.
- Event kommt doppelt: Das UPDATE mit `status = 'QUARANTINE'` ist idempotent.
- Upload bricht ab: Kein Datensatz bleibt hängen, Lifecycle-Regel löscht alte Quarantäne-Blobs.

**Kosten:** Defender kostet pro gescannter Datenmenge. Storage ist günstig. Lifecycle-Regeln verschieben alte Dateien in den Cool Tier.

## Follow-ups
- Warum Tika und nicht die Dateiendung? → Die Endung kann jeder ändern. Tika liest die ersten Bytes, die Magic Number. Das ist File-Type-Spoofing-Schutz.
- Warum Event Hub und nicht direkt Event Grid an die Function? → *(Prüfen: Ihr echter Grund im Projekt.)* Allgemein: Event Hub puffert und erlaubt eigene Consumer im privaten Netz.
- Was passiert mit einer infizierten Datei? → Sie wird gelöscht und der Status wird REJECTED. Der Nutzer bekommt eine Meldung.
- Wie testen Sie den Virenscan? → Mit der EICAR-Testdatei. Sie ist harmlos, aber jeder Scanner erkennt sie.
- Wie prüfen Sie das JWT? → Signatur RS256 mit dem Public Key aus Key Vault, dazu Ablaufzeit, Issuer und Audience.

## Don't say
- „Wir prüfen den Content-Type-Header.“ Den setzt der Client, er ist nicht vertrauenswürdig.
- Nicht „alles öffentlich, aber mit Passwort“. Bei Gesundheitsdaten ist ein privates Netz Standard.

## Words
- **die Quarantäne** = Bereich für ungeprüfte Dateien
- **freigeben** = to release
- **die Byte-Signatur (Magic Number)** = typische erste Bytes eines Dateityps
- **der Private Endpoint** = private IP für einen Azure-Dienst
- **die Netzwerkgrenze** = network boundary
