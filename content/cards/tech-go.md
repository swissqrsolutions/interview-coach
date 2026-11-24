---
id: tech-go
round: tech
tech: [go]
tier: 4
project: Flaconi
q: Welche Erfahrung haben Sie mit Go?
en: What experience do you have with Go?
---
## 30s
Go ist eine einfache, kompilierte Sprache von Google.
Sie baut eine einzige Binary ohne Runtime. Das ist ideal für kleine Container und Tools.
Parallelität ist eingebaut, mit Goroutines und Channels.
Bei Flaconi habe ich in Go einen SQL-Exporter für Betriebsmetriken gebaut.
Er hat Zahlen aus der Datenbank für Prometheus bereitgestellt. In Grafana haben wir sie angezeigt.
Soll ich zeigen, wie so ein Exporter funktioniert?

## 90s
**Prinzip Exporter:** Prometheus holt die Metriken (Pull). Der Exporter bietet einen HTTP-Endpoint `/metrics`.

```go
var openOrders = prometheus.NewGauge(prometheus.GaugeOpts{
    Name: "shop_open_orders",
    Help: "Number of open orders",
})

func main() {
    prometheus.MustRegister(openOrders)
    go func() {
        for range time.Tick(30 * time.Second) {
            var n float64
            if err := db.QueryRow("SELECT count(*) FROM orders WHERE status='OPEN'").Scan(&n); err != nil {
                log.Println("query failed:", err)
                continue
            }
            openOrders.Set(n)
        }
    }()
    http.Handle("/metrics", promhttp.Handler())
    log.Fatal(http.ListenAndServe(":9100", nil))
}
```
*(Prüfen: Welche Metriken hat Ihr Exporter bei Flaconi gelesen? Das Beispiel ist nur allgemein.)*

- `go func()` startet eine Goroutine.
- Fehler sind normale Rückgabewerte. Kein `try/catch`.

## 3min
**Stärken von Go:**
- Schneller Start, wenig Speicher, eine statische Binary. Images oft nur ein paar MB.
- Einfache Sprache, wenig Magie. Neue Leute lesen den Code schnell.
- Viele Cloud-Tools sind in Go: Kubernetes, Docker, Prometheus, Terraform.

**Schwächen:**
- Fehlerbehandlung ist lang: viele `if err != nil`.
- Weniger Frameworks als Java. Für große Fach-Anwendungen mit viel Domänenlogik nehme ich eher Java und Spring.

**Fallen bei einem Exporter:**
- Teure SQL-Abfragen bei jedem Scrape belasten die Datenbank. Besser cachen oder in einem festen Intervall lesen.
- Zu viele Labels (hohe Kardinalität), zum Beispiel eine User-ID als Label. Das macht Prometheus langsam.
- Goroutine-Leaks: eine Goroutine wartet ewig auf einen Channel. Mit `context.Context` und Timeout abbrechen.

**Heute:** Die gleiche Monitoring-Idee nutze ich bei MATCH: Grafana und Prometheus beobachten Job-Dauer, Backlog und Pod-Restarts.

## Follow-ups
- Was ist eine Goroutine? → Eine sehr leichte Ausführung, vom Go-Runtime verwaltet. Man kann tausende starten.
- Was ist ein Channel? → Eine Leitung zwischen Goroutines. Eine schreibt, eine andere liest.
- Gauge oder Counter? → Ein Counter steigt nur. Ein Gauge kann steigen und fallen, wie offene Bestellungen.
- Warum Pull und nicht Push bei Prometheus? → Prometheus weiß, ob ein Ziel nicht antwortet. Für kurze Jobs gibt es das Pushgateway.
- Hat Go Generics? → Ja, seit Go 1.18.

## Don't say
- „Go ist objektorientiert wie Java.“ Es gibt keine Klassen und keine Vererbung, nur Structs, Methoden und Interfaces.
- „Ich bin Go-Entwickler.“ Ehrlich: ein Tool gebaut, Hauptsprache ist Java.

## Words
- **kompiliert** = in Maschinencode übersetzt
- **die Goroutine** = leichter Ausführungsstrang in Go
- **der Exporter** = Programm, das Metriken für Prometheus anbietet
- **die Kardinalität** = Anzahl verschiedener Werte
- **der Scrape** = Prometheus holt die Metriken
