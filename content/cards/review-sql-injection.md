---
id: review-sql-injection
round: review
tech: [security, java, postgres]
tier: 1
q: Was ist falsch an diesem Code?
en: What is wrong with this code?
---
## 30s
```java
public List<User> findByName(String name) throws SQLException {
    String sql = "SELECT * FROM users WHERE name = '" + name + "'";
    Statement st = connection.createStatement();
    ResultSet rs = st.executeQuery(sql);
    List<User> users = new ArrayList<>();
    while (rs.next()) users.add(map(rs));
    return users;
}
```
Das grösste Problem ist SQL Injection. Die Eingabe wird direkt in das SQL geklebt.
Mit `' OR '1'='1` bekommt ein Angreifer alle Nutzer.
Die Lösung: ein PreparedStatement mit Parameter.
Dazu kommen zwei kleinere Punkte: Ressourcen werden nicht geschlossen, und `SELECT *`.
Soll ich den Fix zeigen?

## 90s
**Der Fix:**
```java
public List<User> findByName(String name) throws SQLException {
    String sql = "SELECT id, name, email FROM users WHERE name = ?";
    try (PreparedStatement ps = connection.prepareStatement(sql)) {
        ps.setString(1, name);
        try (ResultSet rs = ps.executeQuery()) {
            List<User> users = new ArrayList<>();
            while (rs.next()) users.add(map(rs));
            return users;
        }
    }
}
```
**Laut gesagt:** „Die Datenbank bekommt SQL und Wert getrennt. Der Wert wird nie als SQL gelesen. Darum ist Injection nicht möglich.“

**In meiner Reihenfolge:**
1. **Korrekt?** Ja, für normale Namen.
2. **Sicher?** Nein: SQL Injection. Das ist Punkt eins in jedem Review.
3. **Schnell?** `SELECT *` lädt alle Spalten. Ein Index auf `name` fehlt vielleicht.
4. **Lesbar?** Okay.
5. **Design:** SQL im Code ist okay in einem Repository. Mit Spring Data JPA: `List<User> findByName(String name)`.

## 3min
**Wo Parameter nicht helfen:** Tabellen- oder Spaltennamen kann man nicht als `?` übergeben. Zum Beispiel `ORDER BY` + Eingabe. Dann nehme ich eine Allowlist:
```java
String column = switch (sortField) {
    case "name" -> "name";
    case "created" -> "created_at";
    default -> throw new IllegalArgumentException("bad sort field");
};
```

**Auch mit JPA möglich:** String-Verkettung in JPQL oder `createNativeQuery` ist genauso gefährlich. Immer `:name` als Parameter.

**Schichten der Abwehr:**
- Parameter in jeder Abfrage.
- Der DB-User hat nur die Rechte, die er braucht. Kein Owner, kein `DROP`.
- Eingabe prüfen, zum Beispiel Länge und Format.
- SonarQube und SAST finden String-Verkettung in SQL. In meinen Projekten lief SonarQube in der Pipeline.

**Wie ich es im Review schreibe:** „Blocker: SQL Injection über `name`. Bitte PreparedStatement mit Parameter. Beispiel siehe unten.“ Sachlich, mit Fix, ohne Vorwurf.

**Pattern:** Das ist ein Repository bzw. DAO. Die Datenbank-Logik ist von der Fachlogik getrennt. Das ist gut.

## Follow-ups
- Schützt Escaping auch? → Teilweise, aber es ist fehleranfällig. Parameter sind der Standard.
- Ist Hibernate automatisch sicher? → Nur mit Parametern. HQL mit String-Verkettung ist auch angreifbar.
- Wie finden Sie solche Fehler im ganzen Projekt? → SonarQube-Regeln, Suche nach `createStatement` und `+` in SQL, und Code-Reviews.
- Was ist die OWASP Top 10? → Eine Liste der häufigsten Web-Risiken. Injection ist seit Jahren darin.
- Was ist mit `LIKE`-Suchen? → Auch mit Parameter: `WHERE name LIKE ?` und den Wert mit `%` im Java-Code bauen.

## Don't say
- „Das Frontend prüft die Eingabe schon.“ Der Angreifer ruft die API direkt auf.
- Nicht nur „unsicher“ sagen. Den Angriff und den Fix konkret nennen.

## Words
- **SQL Injection** = attacker input runs as SQL
- **PreparedStatement** = SQL with parameters
- **Allowlist** = list of allowed values
- **Angreifer** = attacker
- **Blocker** = must fix before merge
