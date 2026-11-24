---
id: data-airflow
round: data
tech: [airflow]
tier: 2
proof: study
project: ElCom MATCH (demand-driven worker as comparison)
q: Wie orchestrieren Sie Pipelines? Kennen Sie Airflow?
en: How do you orchestrate pipelines? Do you know Airflow?
---
## 30s
Airflow ist ein Orchestrator. Pipelines sind DAGs in Python: Tasks mit Abhängigkeiten.
Der Scheduler startet die Tasks nach Zeitplan oder wenn Daten da sind.
Airflow kümmert sich um Retries, Backfills, Logs und eine UI.
Produktiv habe ich das noch nicht eingesetzt. Das Prinzip kenne ich von MATCH.
Dort startet ein .NET-Worker die Spark-Jobs, aber nur wenn Arbeit da ist. Status, Retries und Recovery stehen in SQL Server.
Soll ich vergleichen, wann Airflow besser wäre?

## 90s
**Ein einfacher DAG:**
```
from airflow.sdk import dag, task        # Airflow 3; in Airflow 2: from airflow.decorators import dag, task
from datetime import datetime

@dag(schedule="@daily", start_date=datetime(2026, 1, 1), catchup=False)
def trades_pipeline():
    @task(retries=3)
    def ingest(): ...
    @task
    def build_silver(): ...
    @task
    def build_gold(): ...
    ingest() >> build_silver() >> build_gold()

trades_pipeline()
```
Laut gesagt: „Drei Tasks hintereinander, einmal pro Tag. Ingest darf dreimal neu versuchen.“

**Begriffe:**
- **DAG Run:** ein Lauf für ein Datenintervall, zum Beispiel einen Tag.
- **Operator:** Baustein, zum Beispiel SparkSubmitOperator oder KubernetesPodOperator.
- **Sensor:** wartet auf etwas, zum Beispiel eine Datei.
- **Backfill:** alte Intervalle nachträglich laufen lassen.
- **Assets** (früher Datasets): ein DAG startet, wenn ein anderer eine Tabelle aktualisiert hat.

## 3min
**Vergleich mit MATCH:**
| | MATCH-Worker | Airflow |
|---|---|---|
| Start | nur wenn Meldungen Pending sind | Zeitplan oder Asset-Event |
| Einheit | eine Meldung | ein Zeitintervall |
| Status | in SQL Server pro Meldung | in der Airflow-Datenbank pro Task |
| Recovery | Stale-Job-Recovery per Timeout | Retries, manuell Task neu starten |
| UI | Grafana-Metriken | Airflow-UI mit Graph und Logs |

**Warum bei MATCH kein Airflow?** *(Prüfen: der echte Grund im Projekt.)* Ein sachlicher Punkt: Unsere Arbeit kommt pro Meldung, nicht pro Zeitintervall. Ein demand-driven Worker passt dazu. Und es ist eine Komponente weniger im Betrieb.

**Wann ich Airflow wählen würde:**
- Viele Pipelines mit Abhängigkeiten zwischen Teams.
- Backfills über Monate.
- Eine zentrale UI für Betrieb und Fehler.

**Gute Praxis:**
- Tasks sind idempotent. Ein Task-Retry darf keine Duplikate machen. Pro Intervall überschreiben, wie unser Gold-Job pro Tag.
- Airflow orchestriert, rechnet aber nicht. Die Arbeit macht Spark, dbt oder ein Pod.
- Keine schweren Imports im DAG-Code. Der Scheduler parst die Dateien oft.

**Alternativen:** Dagster (Asset-zentriert), Prefect, Argo Workflows auf Kubernetes.

## Follow-ups
- Was ist `catchup`? → Mit `catchup=True` startet Airflow alle verpassten Intervalle seit `start_date`. Oft schaltet man es aus und macht Backfills bewusst.
- Wie geben Tasks Daten weiter? → Über XCom nur kleine Werte, zum Beispiel einen Pfad. Grosse Daten liegen im Storage.
- Wie starten Sie Spark aus Airflow auf Kubernetes? → Mit dem SparkKubernetesOperator oder einem KubernetesPodOperator. Bei MATCH nutzt der Worker die Spark REST API.
- Was passiert, wenn ein Task hängt? → `execution_timeout` setzen. Dann scheitert er und der Retry greift.
- Airflow oder Argo Workflows? → Argo ist Kubernetes-nativ, mit YAML. Airflow hat Python und mehr Operatoren für Daten.

## Don't say
- „Airflow verarbeitet die Daten.“ Airflow steuert nur. Die Arbeit macht ein anderes System.
- Nicht behaupten, Sie hätten Airflow produktiv betrieben.

## Words
- **der Orchestrator** = startet und überwacht Jobs in der richtigen Reihenfolge
- **die Abhängigkeit** = dependency
- **der Backfill** = alte Zeiträume nachträglich verarbeiten
- **der Sensor** = Task, der auf ein Ereignis wartet
- **demand-driven** = nur bei Bedarf starten
