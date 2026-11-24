---
id: tech-rest-design
round: tech
tech: [rest]
tier: 1
project: Flaconi, CARIAD, DigiSanté (PDF-Service)
q: Wie entwerfen Sie eine gute REST-API? Ressourcen, Status-Codes, Pagination?
en: How do you design a good REST API? Resources, status codes, pagination?
---
## 30s
Eine REST-API ist um Ressourcen gebaut, nicht um Aktionen.
URLs sind Nomen im Plural, zum Beispiel `/orders/42`.
Die HTTP-Methode sagt die Aktion: GET liest, POST erstellt, PUT ersetzt, PATCH ändert teilweise, DELETE löscht.
Status-Codes sagen das Ergebnis klar und ehrlich.
Grosse Listen gebe ich immer mit Pagination zurück.
REST-Services habe ich bei Flaconi, CARIAD und DigiSanté gebaut, zum Beispiel den PDF-Service bei DigiSanté.
Soll ich die Status-Codes oder die Pagination genauer erklären?

## 90s
**Ressourcen:**
```
GET    /orders?status=PAID&page=0&size=20   Liste, gefiltert
GET    /orders/42                           eine Bestellung
POST   /orders                              neu → 201 + Location: /orders/42
PUT    /orders/42                           ganz ersetzen
PATCH  /orders/42                           teilweise ändern
DELETE /orders/42                           → 204
GET    /orders/42/items                     Unter-Ressource
```

**Status-Codes, die ich nutze:**
- `200` OK, `201` Created, `202` Accepted (Arbeit läuft asynchron), `204` No Content.
- `400` ungültige Eingabe, `401` nicht angemeldet, `403` keine Rechte, `404` nicht gefunden.
- `409` Konflikt (zum Beispiel Version veraltet), `422` fachlich ungültig, `429` zu viele Requests.
- `500` Fehler bei uns, `503` vorübergehend nicht verfügbar.

**Fehlerformat:** `ProblemDetail` (RFC 9457) mit `type`, `title`, `status`, `detail`. Einheitlich für alle Endpoints.

## 3min
**Pagination:**
- **Offset** (`page`, `size`): einfach, Sprung auf Seite 7 möglich. Aber langsam bei grossen Offsets, weil die DB alle Zeilen davor überspringen muss. Und Einträge können "verrutschen", wenn neue Daten kommen.
- **Cursor / Keyset** (`after=<letzte ID>`): stabil und schnell, auch bei Millionen Zeilen. `WHERE id > :last ORDER BY id LIMIT 20`. Aber kein Sprung auf eine beliebige Seite.
- Bei grossen oder sich schnell ändernden Daten nehme ich Keyset.

**Weitere Regeln:**
- Nie Entities direkt zurückgeben. Eigene DTOs, damit die DB-Struktur nicht die API wird.
- Lange Aufgaben: `202 Accepted` mit einer Status-URL. Der Client fragt dort nach.
- Filter und Sortierung als Query-Parameter, mit einer erlaubten Liste von Feldern.
- Konsistente Namen: entweder camelCase oder snake_case, nicht beides.

**Fehler, die ich in Reviews sehe:**
- `200 OK` mit `{"error": ...}` im Body. Dann können Clients und Monitoring Fehler nicht erkennen.
- Verben in URLs: `/createOrder`. Ausnahme: echte Aktionen, die keine Ressource sind, zum Beispiel `POST /orders/42/cancel`. Das ist ok, wenn bewusst.
- Keine Grenze für `size`. Ein Client fragt 1 Million Zeilen ab. Ich setze ein Maximum.

**Bei DigiSanté:** Der PDF-Service ist ein REST-Wrapper um OpenHTMLtoPDF und erzeugt PDF/A und PDF/UA-1. Er läuft nur im privaten VNet.

## Follow-ups
- Was ist der Unterschied zwischen PUT und PATCH? → PUT ersetzt die ganze Ressource. PATCH ändert nur die gesendeten Felder.
- 400 oder 422? → 400 für kaputte Syntax, zum Beispiel ungültiges JSON. 422 für fachlich ungültige Daten, zum Beispiel ein Enddatum vor dem Startdatum.
- Was ist HATEOAS? → Die Antwort enthält Links zu möglichen nächsten Aktionen. In der Praxis selten voll genutzt.
- Wie liefern Sie die Gesamtzahl bei Pagination? → Als Feld `totalElements` oder Header. Aber `COUNT(*)` ist bei grossen Tabellen teuer. Bei Keyset lasse ich es oft weg.
- Wie verhindern Sie verlorene Updates? → Mit Optimistic Locking: ETag oder Versionsfeld. Bei Konflikt `409` oder `412`.

## Don't say
- „Ich gebe immer 200 zurück und schreibe den Fehler in den Body.“
- „REST heisst JSON über HTTP.“ REST ist ein Stil mit Ressourcen und einheitlicher Schnittstelle.

## Words
- **die Ressource** = resource, ein Ding mit einer URL
- **teilweise** = partially
- **die Seitennummerierung (Pagination)** = Daten in Seiten liefern
- **verrutschen** = to shift (Einträge auf der falschen Seite)
- **einheitlich** = consistent
