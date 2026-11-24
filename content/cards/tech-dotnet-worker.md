---
id: tech-dotnet-worker
round: tech
tech: [dotnet]
tier: 4
project: ElCom MATCH
q: Wie funktioniert ein .NET Background Worker? Wie haben Sie ihn bei MATCH genutzt?
en: How does a .NET background worker work? How did you use it in MATCH?
---
## 30s
Ein Background Worker in .NET ist ein `BackgroundService`. Er läuft im Hintergrund im gleichen Host.
Er startet mit der App und stoppt sauber mit einem CancellationToken.
Bei MATCH, der Reporting-Plattform für Energiehandelsdaten der ElCom, hat ein .NET Worker die Spark-Jobs gestartet.
Er startet einen Job über die Spark REST API nur, wenn Arbeit da ist.
Das läuft so täglich in Produktion, ohne Duplikate bei Neustarts.
Soll ich den Ablauf genauer erklären?

## 90s
**Grundgerüst:**
```csharp
public class IngestionWorker(IServiceScopeFactory scopes, ILogger<IngestionWorker> log) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(30));
        while (await timer.WaitForNextTickAsync(ct))
        {
            using var scope = scopes.CreateScope();
            var jobs = scope.ServiceProvider.GetRequiredService<IJobService>();
            if (await jobs.HasPendingAsync(ct))
                await jobs.SubmitSparkJobAsync(ct);
        }
    }
}
```
*(Allgemeines Beispiel, nicht der echte MATCH-Code. Prüfen: Intervall und Struktur.)*

**Ablauf bei MATCH:**
1. Eine ZIP-Datei landet in MinIO. Eine Zeile in MSSQL bekommt `LakehouseStatus = Pending`.
2. Der Worker prüft: Gibt es Pending-Nachrichten? Nur dann startet er einen Spark-Job.
3. Der Spark-Job claimt die Nachrichten atomar mit `UPDATE ... OUTPUT INSERTED.*`: Pending → Processing.
4. Danach Completed oder Failed.
5. Nachrichten, die zu lange in Processing hängen, gehen zurück auf Pending (Stale-Job-Recovery).

## 3min
**Warum demand-driven:** Kein Spark-Job ohne Arbeit. Das spart Ressourcen. Mit Karpenter skalieren die Nodes nur bei Bedarf.

**Warum keine Duplikate:**
- Das Claimen ist atomar in SQL. Zwei Läufe bekommen nie die gleiche Nachricht.
- Das Schreiben ist idempotent: `DELETE WHERE message_id = X`, dann `APPEND`, in einer Iceberg-Transaktion.
- Bei Statistiken rechnen wir den ganzen Tag neu und überschreiben. Ein Retry gibt das gleiche Ergebnis.

**Vorher:** Ein .NET Timer-Job mit einem „Bookmark“-Datum. Das war schwer neu zu starten und nicht sicher bei Fehlern.

**Typische Fallen bei Workern:**
- Scoped Services wie ein `DbContext` direkt injizieren. Der Worker ist ein Singleton. Darum `IServiceScopeFactory` und pro Runde einen Scope.
- Eine Exception in `ExecuteAsync` stoppt den Host (Standard seit .NET 6). Fehler pro Runde fangen und loggen.
- Mehrere Instanzen laufen gleichzeitig. Ohne atomaren Claim gibt es doppelte Arbeit.

**Monitoring:** Grafana und Prometheus zeigen den Backlog der Pending-Nachrichten und die Job-Dauer.

## Follow-ups
- Was passiert bei einem Neustart mitten im Job? → Die Nachricht bleibt in Processing. Nach dem Timeout setzt die Recovery sie auf Pending zurück. Der nächste Lauf schreibt sie idempotent neu.
- Warum nicht Hangfire oder Quartz? → *(Ihr echter Grund.)* Allgemein: Der Worker macht nur einen Check und einen REST-Call. Eine Scheduler-Library wäre zu viel.
- Warum zwei Status pro Nachricht? → Einer für Ingestion, einer für Statistiken. Die Statistik startet erst, wenn die Ingestion Completed ist.
- Was ist der Unterschied zwischen IHostedService und BackgroundService? → `BackgroundService` ist eine Basisklasse für `IHostedService`. Man schreibt nur `ExecuteAsync`.
- Wie testen Sie den Worker? → Die Logik in einem Service, mit Unit Tests. Dazu Komponenten-Tests mit Testcontainers gegen einen echten SQL Server. *(Prüfen: Welche Tests deckten den Worker genau ab?)*

## Don't say
- „Der Worker macht die Verarbeitung.“ Nein. Er startet nur den Spark-Job. Spark verarbeitet.
- „Doppelte Verarbeitung ist unmöglich.“ Besser: Sie ist harmlos, weil alles idempotent ist.

## Words
- **der Hintergrund-Dienst** = background service
- **claimen** = eine Aufgabe für sich reservieren
- **atomar** = alles oder nichts, in einem Schritt
- **bei Bedarf** = on demand
- **hängen bleiben** = to get stuck
