---
id: data-python-generators
round: data
tech: [python]
tier: 2
project: ElCom MATCH (PySpark ETL)
q: Sie müssen eine 50-GB-Datei mit Python verarbeiten. Der Rechner hat 4 GB RAM. Wie gehen Sie vor?
en: You must process a 50 GB file in Python on a machine with 4 GB RAM. How do you do it?
---
## 30s
Ich lese die Datei nie ganz in den Speicher.
Ich lese Zeile für Zeile, oder in kleinen Paketen.
Dafür nutze ich Generatoren mit `yield`. Ein Generator gibt immer nur ein Element zurück.
So bleibt der Speicher fast konstant, egal wie gross die Datei ist.
Ich verbinde mehrere Generatoren zu einer Pipeline: lesen, filtern, umwandeln, schreiben.
Bei MATCH nutzen wir für grosse Daten PySpark. Für ein Skript auf einem Rechner reicht oft ein Generator.
Soll ich den Code zeigen?

## 90s
**Pipeline mit Generatoren:**
```
import csv
from collections import defaultdict
from itertools import islice

def read_rows(path):
    with open(path, newline="", encoding="utf-8") as f:
        yield from csv.DictReader(f)          # eine Zeile nach der anderen

def valid(rows):
    for r in rows:
        if r["customer_id"] and r["amount_rappen"]:
            yield r

def sum_per_customer(rows):
    totals = defaultdict(int)
    for r in rows:
        totals[r["customer_id"]] += int(r["amount_rappen"])
    return totals

totals = sum_per_customer(valid(read_rows("trades.csv")))
```
Laut gesagt: „Jede Funktion gibt einen Generator weiter. Im Speicher ist immer nur eine Zeile, plus das Dictionary mit den Summen.“

**In Paketen schreiben:**
```
def batches(rows, size=10_000):
    it = iter(rows)
    while batch := list(islice(it, size)):
        yield batch
```
„Ich schreibe 10 000 Zeilen auf einmal in die Datenbank. Das ist viel schneller als einzeln.“ (Ab Python 3.12 gibt es dafür `itertools.batched`.)

## 3min
**Warum Generatoren?**
- `readlines()` oder `list(...)` lädt alles. 50 GB passen nicht in 4 GB.
- Ein Generator ist lazy, wie Spark. Er rechnet erst, wenn jemand das nächste Element will.

**Aufpassen:**
- Das Ergebnis selbst kann gross werden. Eine Summe pro Kunde ist klein. Eine Liste aller Zeilen nicht. Bei sehr vielen Kunden: extern sortieren oder in SQLite/DuckDB aggregieren.
- Ein Generator kann nur einmal gelesen werden. Danach ist er leer.
- Fehlerhafte Zeilen: nicht abbrechen. Zählen, loggen, weitermachen.

**Andere Wege:**
- `pandas.read_csv(..., chunksize=100_000)`: liefert DataFrames in Paketen.
- DuckDB oder Polars mit Streaming: SQL direkt auf der Datei, ohne alles zu laden.
- XML: `xml.etree.ElementTree.iterparse` und nach jedem Element `elem.clear()`. Sonst wächst der Baum im Speicher.
- Bei sehr grossen Daten oder vielen Dateien: Spark. Bei MATCH parsen wir die XML-Meldungen mit PySpark. *(Prüfen: welchen XML-Parser Sie im Spark-Job nutzen.)*

**Geld:** Beträge als Integer in Rappen oder als `Decimal`, nie als float.

**Komplexität:** Zeit O(n), Speicher O(Anzahl Kunden) statt O(n).

## Follow-ups
- Was ist der Unterschied zwischen `return` und `yield`? → `return` beendet die Funktion. `yield` gibt einen Wert und pausiert. Beim nächsten Aufruf geht es weiter.
- Was ist ein Generator Expression? → Wie eine List Comprehension, aber mit runden Klammern: `(x * 2 for x in rows)`. Sie erzeugt keine Liste.
- Wie parallelisieren Sie das? → Die Datei in Byte-Bereiche teilen und mit `multiprocessing` verarbeiten. Oder gleich Spark nehmen.
- Wie testen Sie das? → Mit einer kleinen Datei und erwarteten Summen. Dazu ein Test mit kaputten Zeilen.
- Was macht `yield from`? → Es gibt alle Elemente eines anderen Iterables weiter, eines nach dem anderen.

## Don't say
- „Ich lade die Datei mit pandas und rechne dann.“ Ohne `chunksize` scheitert das bei 50 GB.
- „Ich kaufe mehr RAM.“ Das löst das Problem nicht im Interview.

## Words
- **der Generator** = Funktion, die Werte einzeln liefert
- **lazy** = erst rechnen, wenn nötig
- **das Paket (Batch)** = Gruppe von Zeilen
- **konstanter Speicher** = Speicher wächst nicht mit der Datei
- **pausieren** = anhalten und später weitermachen
