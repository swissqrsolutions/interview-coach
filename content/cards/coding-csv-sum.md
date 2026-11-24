---
id: coding-csv-sum
round: coding
tech: [python, java]
tier: 1
project: ElCom MATCH (parsing differences)
q: Lesen Sie diese CSV-Datei und summieren Sie den Betrag pro Kunde.
en: Read this CSV file and sum the amount per customer.
---
## 30s
Die Datei sieht so aus:
```
customer_id,date,amount
C1,2024-05-01,120.50
C2,2024-05-01,80.00
C1,2024-05-02,10.25
```
Ich wiederhole: Ich lese jede Zeile und summiere `amount` pro `customer_id`.
Meine Fragen: Gibt es einen Header? Welches Trennzeichen? Wie gross ist die Datei? Was mache ich mit kaputten Zeilen?
Die Idee: eine Map von Kunde → Summe. Ich lese Zeile für Zeile.
Für Geld nehme ich `Decimal` oder `BigDecimal`, nicht `float`.
Soll ich mit Python anfangen?

## 90s
**Python:**
```python
import csv
from collections import defaultdict
from decimal import Decimal, InvalidOperation

def sum_per_customer(path: str) -> dict[str, Decimal]:
    totals = defaultdict(Decimal)
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            try:
                amount = Decimal(row["amount"])
            except (InvalidOperation, KeyError, TypeError):
                print(f"skip bad row: {row}")
                continue
            totals[row["customer_id"]] += amount
    return dict(totals)
```

**Java:**
```java
static Map<String, BigDecimal> sumPerCustomer(Path path) throws IOException {
    Map<String, BigDecimal> totals = new HashMap<>();
    try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
        reader.readLine(); // Header überspringen
        String line;
        while ((line = reader.readLine()) != null) {
            String[] parts = line.split(",");
            if (parts.length < 3) continue;
            try {
                totals.merge(parts[0], new BigDecimal(parts[2].trim()), BigDecimal::add);
            } catch (NumberFormatException e) {
                // kaputte Zeile: loggen und weiter
            }
        }
    }
    return totals;
}
```

**Test von Hand:** C1 = 120.50 + 10.25 = 130.75. C2 = 80.00.

## 3min
**Warum kein `float`?** `0.1 + 0.2` ist nicht genau `0.3`. Bei Geld ist das ein echter Fehler. Darum `Decimal` oder `BigDecimal`.

**Warum nicht einfach `split(",")` in Python?** Ein Feld kann ein Komma in Anführungszeichen haben: `"Müller, AG"`. Das `csv`-Modul versteht das. In Java sage ich offen: `split` ist die einfache Version. Produktiv nehme ich eine Bibliothek, zum Beispiel Apache Commons CSV.

**Kleines Detail:** Ich lese den Betrag zuerst. Erst dann schreibe ich in die Map. Sonst legt `defaultdict` bei einer kaputten Zeile einen Kunden mit 0 an.

**Kaputte Zeilen:** Ich breche nicht ab. Ich überspringe die Zeile, logge sie und zähle sie. Am Ende sage ich: „1000 Zeilen gelesen, 3 übersprungen.“ Ich frage, ob das fachlich okay ist oder ob die ganze Datei abgelehnt werden soll.

**Aus meiner Praxis:** Bei MATCH haben .NET und Spark Zahlen und Datumswerte unterschiedlich gelesen. Gründe waren Ländereinstellungen, null gegen leeren String und Zeitzonen. Darum frage ich immer: Dezimalpunkt oder Komma? Welche Zeitzone?

**Grosse Datei:** Beide Lösungen lesen Zeile für Zeile. Der Speicher hängt von der Anzahl Kunden ab, nicht von der Dateigrösse. Ist auch die Map zu gross, nehme ich SQL oder Spark: `GROUP BY customer_id`.

**Test:**
```python
def test_sum(tmp_path):
    f = tmp_path / "data.csv"
    f.write_text("customer_id,date,amount\nC1,2024-05-01,1.10\nC1,2024-05-02,2.20\nC2,2024-05-01,x\n")
    assert sum_per_customer(str(f)) == {"C1": Decimal("3.30")}
```

**Komplexität:** Zeit O(n) Zeilen. Speicher O(Anzahl Kunden).

## Follow-ups
- Wie sortieren Sie das Ergebnis nach Summe? → `sorted(totals.items(), key=lambda kv: kv[1], reverse=True)`.
- Wie machen Sie das mit pandas? → `pd.read_csv(path).groupby("customer_id")["amount"].sum()`. Kurz, aber die ganze Datei ist im Speicher, und `float` ist der Standardtyp.
- Und in SQL? → `SELECT customer_id, SUM(amount) FROM sales GROUP BY customer_id;` Die Spalte hat den Typ `numeric`.
- Wie geht es mit Java Streams? → `Files.lines(path).skip(1).map(l -> l.split(",")).collect(groupingBy(p -> p[0], reducing(BigDecimal.ZERO, p -> new BigDecimal(p[2]), BigDecimal::add)))`, mit try-with-resources für den Stream.

## Don't say
- Nicht `float` oder `double` für Geld.
- Nicht die ganze Datei mit `readAllLines` laden, ohne die Grösse zu kennen.

## Words
- **Trennzeichen** = delimiter
- **Kopfzeile / Header** = header row
- **überspringen** = to skip
- **Betrag** = amount
- **Ländereinstellung** = locale
