---
id: tech-grpc
round: tech
tech: [grpc]
tier: 4
project: CARIAD
q: Was ist gRPC und wann ist es besser als REST?
en: What is gRPC and when is it better than REST?
---
## 30s
gRPC ist ein Framework für Remote Procedure Calls.
Der Vertrag steht in einer `.proto`-Datei mit Protobuf.
Daraus generiert man Client- und Server-Code für viele Sprachen.
Die Daten sind binär und laufen über HTTP/2. Das ist schnell und kompakt.
Bei CARIAD haben wir gRPC mit Protobuf für die Kommunikation zwischen Services in der Pipeline genutzt.
Diese Pipeline hat Sensordaten aus der VW-Flotte für HD-Karten verarbeitet.
Soll ich zeigen, wie ein Vertrag aussieht?

## 90s
```proto
syntax = "proto3";
package maplearning.v1;

service TileQuality {
  rpc GetScore (TileRequest) returns (TileScore);
  rpc StreamScores (RegionRequest) returns (stream TileScore);
}

message TileRequest { string tile_id = 1; }
message TileScore  { string tile_id = 1; double score = 2; }
message RegionRequest { string region = 1; }
```
*(Beispiel, nicht der echte CARIAD-Vertrag.)*

**Vier Arten von Calls:**
1. Unary: eine Anfrage, eine Antwort.
2. Server Streaming: eine Anfrage, viele Antworten.
3. Client Streaming: viele Anfragen, eine Antwort.
4. Bidirectional Streaming: beide Seiten senden.

**Die Feldnummern** (`= 1`, `= 2`) stehen im Binärformat, nicht die Namen.

## 3min
**gRPC vs. REST:**
| | gRPC | REST |
|---|---|---|
| Format | binär, Protobuf | meist JSON |
| Vertrag | `.proto`, Pflicht | OpenAPI, optional |
| Streaming | eingebaut | schwer |
| Browser | nur mit gRPC-Web oder Proxy | direkt |
| Debuggen | Tools nötig (grpcurl) | curl, Browser |

**Wann gRPC:** Service zu Service, viele Calls, kleine Latenz, Streaming, mehrere Sprachen.
**Wann REST:** öffentliche APIs, Browser-Clients, einfache Integration.

**Schema-Evolution:**
- Feldnummern nie wiederverwenden. Gelöschte Felder mit `reserved` markieren.
- Neue Felder sind kompatibel. Alte Clients ignorieren sie.
- Paket mit Version, zum Beispiel `v1`.

**Fehler und Betrieb:**
- Immer Deadlines setzen. Ohne Deadline wartet ein Call ewig.
- gRPC-Statuscodes nutzen, zum Beispiel `UNAVAILABLE` für Retry, `INVALID_ARGUMENT` ohne Retry.
- HTTP/2 hält lange Verbindungen. Ein normaler Layer-4-Load-Balancer verteilt darum schlecht. In Kubernetes braucht man einen L7-Proxy oder Client-seitiges Load Balancing.

## Follow-ups
- Warum ist gRPC schneller? → Binäres Format, kleine Nachrichten, HTTP/2 mit vielen Streams auf einer Verbindung.
- Was passiert, wenn ich ein Feld lösche? → Alte Clients bekommen den Default-Wert. Die Nummer muss `reserved` werden.
- Wie machen Sie Authentifizierung? → TLS und ein Token in den Metadaten, ähnlich wie ein HTTP-Header.
- Geht gRPC im Browser? → Nicht direkt. Man braucht gRPC-Web und einen Proxy wie Envoy.
- Wie testen Sie? → Mit grpcurl manuell. Im Code mit einem In-Process-Server.

## Don't say
- „gRPC ersetzt REST überall.“ Für Browser und öffentliche APIs ist REST meist besser.
- „Ich kann Feldnummern ändern.“ Das bricht alle alten Clients.

## Words
- **der Remote Procedure Call** = Aufruf einer Funktion auf einem anderen Server
- **binär** = nicht als Text
- **die Feldnummer** = ID eines Felds in Protobuf
- **die Deadline** = maximale Zeit für einen Call
- **kompakt** = klein
