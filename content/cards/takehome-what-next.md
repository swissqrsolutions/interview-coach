---
id: takehome-what-next
round: takehome
tech: [spring, observability, security, k8s]
tier: 1
q: Was fehlt noch, und was würden Sie mit mehr Zeit machen? Wie skaliert das?
en: What is still missing, and what would you do with more time? How does it scale?
---
## 30s
Ich nenne drei Dinge, nach Wichtigkeit.
1. **Sicherheit:** Authentifizierung mit OAuth2 und JWT. Heute ist die API offen.
2. **Betrieb:** Metriken, Health Checks und strukturierte Logs.
3. **Skalierung:** Paging für Listen und Indizes für die häufigsten Abfragen.
Das habe ich bewusst weggelassen, weil die Zeit begrenzt war. Es steht im README.
Zur Skalierung: Der Service ist zustandslos. Ich kann mehrere Instanzen starten. Der Engpass ist dann die Datenbank.

## 90s
**Meine Liste mit Aufwand:**
| Punkt | Warum | Aufwand |
|---|---|---|
| OAuth2 Resource Server | API ist offen | klein |
| Paging + Index | Listen werden gross | klein |
| Actuator, Micrometer, JSON-Logs | Betrieb sieht nichts | klein |
| CI-Pipeline mit Tests und SonarQube | Qualität automatisch | mittel |
| Lasttest | Grenzen kennen | mittel |
| Helm-Chart, Deployment | Produktion | mittel |

**Skalierung in Schritten, laut gesagt:**
1. „Der Service hat keinen Zustand im Speicher. Ich starte drei Instanzen hinter einem Load Balancer.“
2. „Dann wird die Datenbank der Engpass. Zuerst Indizes und Paging. Dann ein Connection Pool mit Limit.“
3. „Viele Lesezugriffe? Eine Read Replica oder ein Cache für Daten, die sich selten ändern.“
4. „Lange Arbeit, zum Beispiel PDF oder E-Mail, kommt aus dem Request heraus. In eine Queue mit einem Worker.“

**Paging-Beispiel:**
```java
@GetMapping
Page<OrderResponse> list(@PageableDefault(size = 20) Pageable pageable) {
    return service.list(pageable);
}
```

## 3min
**Wie ich die Grenze finde:** Messen, nicht raten. Ein Lasttest, zum Beispiel mit Gatling oder k6. Ich steigere die Last, bis die p99-Latenz oder die Fehlerrate steigt. Dann sehe ich in den Metriken, was voll ist: CPU, DB-Verbindungen oder Sperren.

**Typische Engpässe in der Reihenfolge:**
1. N+1-Queries und fehlende Indizes.
2. Zu kleiner oder zu grosser Connection Pool.
3. Synchrone Aufrufe an langsame Dienste.
4. Grosse JSON-Antworten ohne Paging.

**Was ich nicht vorschnell mache:** Kein Kafka, kein Caching, keine Microservices, bevor die Messung es zeigt. Jede dieser Lösungen hat Kosten: Komplexität, Konsistenz, Betrieb.

**Aus meiner Praxis:**
- Bei MATCH skaliert Karpenter Nodes für Spark-Spitzen hoch und wieder runter. Partition Pruning auf `days(received_date)` hält Abfragen bei 250M+ Zeilen schnell.
- Bei MATCH lief der Go-Live parallel zum alten System hinter einem Feature-Switch. So kann man auch eine Take-Home-Lösung schrittweise einführen.
- Bei DigiSanté antwortet der Upload direkt nach dem Schreiben. Die Prüfung läuft danach über Events. Das ist Punkt 4 oben.

**Ehrlich bleiben:** „Mein Code ist für die Aufgabe gebaut, nicht für eine Million Nutzer. Ich weiss aber, wo ich anfangen würde.“

## Follow-ups
- Was ist das grösste Risiko in Ihrem Code? → *(Ihr echtes Beispiel aus der Aufgabe.)* Zum Beispiel fehlende Authentifizierung oder keine Idempotenz bei POST.
- Wie machen Sie POST idempotent? → Der Client schickt einen `Idempotency-Key`. Der Server speichert ihn mit dem Ergebnis und liefert bei einer Wiederholung dasselbe Ergebnis.
- Cache, und wenn ja, wo? → Erst nach einer Messung. Für selten geänderte Daten ein lokaler Cache mit kurzer Zeit, zum Beispiel Caffeine. Bei mehreren Instanzen Redis.
- Wie würden Sie das deployen? → Container-Image in eine Registry, Helm-Chart, GitOps mit ArgoCD. So haben wir es bei MATCH auf AKS gemacht.
- Wie gross darf der Connection Pool sein? → Nicht zu gross. Die Datenbank hat eine maximale Zahl Verbindungen. Alle Instanzen zusammen müssen darunter bleiben.

## Don't say
- „Es fehlt nichts.“ Jede Lösung hat Lücken.
- „Es skaliert unendlich, wir nehmen Kubernetes.“ Die Datenbank skaliert nicht von allein.

## Words
- **Engpass** = bottleneck
- **zustandslos** = stateless
- **Lasttest** = load test
- **Aufwand** = effort
- **schrittweise einführen** = roll out step by step
