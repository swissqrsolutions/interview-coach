---
id: tech-plsql-basics
round: tech
tech: [oracle]
tier: 3
proof: study
project: PostgreSQL (CARIAD, NABODAT), SQL Server (MATCH) als Vergleich
q: Was ist PL/SQL? Was sind Packages, Cursors und Bulk-Operationen?
en: What is PL/SQL? What are packages, cursors and bulk operations?
---
## 30s
PL/SQL ist die prozedurale Sprache von Oracle in der Datenbank.
Man schreibt damit Prozeduren, Funktionen, Trigger und Packages.
Die Logik läuft direkt neben den Daten. Das spart Netzwerk-Wege.
Ein Package bündelt zusammengehörige Prozeduren, mit Spezifikation und Body.
Produktiv habe ich das noch nicht eingesetzt, nur die Grundlagen. Das Prinzip kenne ich von meiner SQL-Arbeit mit PostgreSQL bei CARIAD und NABODAT und mit SQL Server bei MATCH.

## 90s
**Block-Struktur:**
```sql
DECLARE
  v_count NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM orders WHERE status = 'PENDING';
  DBMS_OUTPUT.PUT_LINE('Pending: ' || v_count);
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
```

**Package:** Spec = öffentliche Schnittstelle. Body = Implementierung.
```sql
CREATE OR REPLACE PACKAGE order_pkg AS
  PROCEDURE close_order(p_id IN orders.id%TYPE);
END order_pkg;
```
- `%TYPE` und `%ROWTYPE`: Der Typ kommt aus der Tabelle. Ändert sich die Spalte, passt sich der Code an.

**Cursor:** Eine Abfrage, durch die man Zeile für Zeile geht. Am einfachsten mit einer Cursor-FOR-Schleife.

## 3min
**Bulk-Operationen:** Jeder Wechsel zwischen PL/SQL und SQL kostet Zeit (Context Switch).
```sql
SELECT id BULK COLLECT INTO l_ids FROM orders WHERE status = 'OLD' FETCH FIRST 1000 ROWS ONLY;
FORALL i IN 1 .. l_ids.COUNT
  UPDATE orders SET status = 'ARCHIVED' WHERE id = l_ids(i);
```
- `BULK COLLECT` holt viele Zeilen auf einmal. Mit `LIMIT` in einer Schleife, sonst ist der Speicher voll.
- `FORALL` schickt viele DML-Befehle auf einmal.
- Noch besser: ein einziges SQL-Statement, wenn es geht. Set-basiert schlägt Zeile für Zeile.

**Trade-offs von Logik in der Datenbank:**
- Pro: schnell bei Datenmengen, Daten verlassen die DB nicht.
- Contra: schwer zu testen und zu versionieren, Bindung an Oracle, schwer zu skalieren.
- Heute: Fachlogik eher im Service, PL/SQL für datennahe Batch-Arbeit.

**Fehler:**
- `WHEN OTHERS THEN NULL` verschluckt alle Fehler. Immer loggen und weiterwerfen.
- Commit in jeder Schleife. Langsam und bricht die Transaktion.

**Mein Bezug:** Bei MATCH hatten wir die alte Logik: Statistiken Zeile für Zeile in .NET. Das hat bei 250M+ Zeilen nicht skaliert. Die Lektion ist die gleiche wie bei PL/SQL: set-basiert rechnen.

## Follow-ups
- Prozedur oder Funktion? → Eine Funktion gibt einen Wert zurück und kann in SQL stehen. Eine Prozedur führt eine Aktion aus.
- Was ist ein Trigger und wann nicht? → Code, der bei INSERT, UPDATE oder DELETE läuft. Vorsicht, versteckte Logik ist schwer zu debuggen.
- Was ist ein Mutating Table Error? → Ein Row-Trigger liest die Tabelle, die er gerade ändert. Oracle verbietet das.
- Wie würden Sie sich einarbeiten? → Bestehende Packages lesen, mit utPLSQL Tests schreiben, und erst kleine Änderungen machen.
- Gibt es das in PostgreSQL? → Ja, PL/pgSQL ist sehr ähnlich. Packages gibt es dort aber nicht, man nutzt Schemas.

## Don't say
- „Ich bin PL/SQL-Experte.“ Ehrlich: Grundlagen, kein Produktiveinsatz.
- „Cursor-Schleifen sind immer gut.“ Set-basiertes SQL ist meist viel schneller.

## Words
- **prozedural** = Schritt für Schritt
- **das Package** = Paket von Prozeduren und Funktionen
- **der Cursor** = Zeiger auf eine Ergebnismenge
- **set-basiert** = auf ganzen Mengen arbeiten, nicht Zeile für Zeile
- **verschlucken** = einen Fehler ignorieren
