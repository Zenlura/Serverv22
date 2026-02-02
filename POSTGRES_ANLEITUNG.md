# 🐘 PostgreSQL Setup - Kurzanleitung

## 📍 Dein PostgreSQL liegt hier:
```
C:\Program Files\PostgreSQL\18\bin
```

## 🚀 Schnellstart (Wähle eine Option):

### ⚡ Option A: Alles auf einmal (EMPFOHLEN)
```batch
KOMPLETTER_FIX.bat
```
→ Macht alles automatisch: PostgreSQL-Setup + Dashboard-Fix + Überprüfung

---

### 🔧 Option B: Nur PostgreSQL Setup
```batch
SETUP_POSTGRES.bat
```
→ Erstellt nur die Datenbank und Tabellen

---

### 📝 Option C: Manuell mit pgAdmin

1. **Öffne pgAdmin** (sollte mit PostgreSQL installiert sein)

2. **Verbinde zu PostgreSQL:**
   - Rechtsklick auf "Servers"
   - Register/Create → Server
   - Name: Radstation
   - Connection → Host: localhost
   - Port: 5432
   - Username: postgres
   - Passwort: (dein PostgreSQL-Passwort)

3. **Erstelle Datenbank:**
   - Rechtsklick auf "Databases"
   - Create → Database
   - Name: `radstation`
   - Save

4. **Führe Migration aus:**
   - Öffne `radstation` Datenbank
   - Tools → Query Tool
   - Öffne `migration_vermietungen.sql`
   - Klick auf ▶️ Execute
   - Fertig!

---

## 🔍 Häufige Probleme

### Problem: "psql: command not found"
**Lösung:** PostgreSQL ist nicht im PATH.

**Quick-Fix:** Die bereitgestellten `.bat` Dateien setzen den Pfad automatisch!

**Permanent:** Füge zum Windows PATH hinzu:
1. Windows + Pause
2. Erweiterte Systemeinstellungen
3. Umgebungsvariablen
4. PATH bearbeiten
5. Neu hinzufügen: `C:\Program Files\PostgreSQL\18\bin`

---

### Problem: "PostgreSQL-Dienst läuft nicht"
**Lösung:**
1. Windows + R
2. Tippe: `services.msc`
3. Suche: `postgresql-x64-18`
4. Rechtsklick → Starten
5. Optional: Starttyp → Automatisch

---

### Problem: "Passwort falsch"
**Lösung:** Das Passwort wurde bei der PostgreSQL-Installation gesetzt.

**Passwort vergessen?**
1. Finde `pg_hba.conf`: `C:\Program Files\PostgreSQL\18\data\pg_hba.conf`
2. Öffne mit Editor (als Administrator)
3. Ändere alle `md5` zu `trust`
4. Speichern
5. PostgreSQL-Dienst neu starten
6. Verbinde ohne Passwort
7. Setze neues Passwort:
   ```sql
   ALTER USER postgres PASSWORD 'neues_passwort';
   ```
8. Ändere `trust` zurück zu `md5` in `pg_hba.conf`
9. PostgreSQL-Dienst neu starten

---

## ✅ Verifikation

Nach dem Setup solltest du folgendes sehen können:

### In pgAdmin:
```
Databases
  └─ radstation
       └─ Schemas
            └─ public
                 └─ Tables
                      ├─ artikel
                      ├─ bestellungen
                      ├─ kategorien
                      ├─ leihraeder
                      ├─ lieferanten
                      ├─ reparaturen
                      └─ vermietungen ← NEU!
```

### Mit psql:
```batch
psql -U postgres -d radstation -c "\dt"
```

Sollte alle Tabellen auflisten, inkl. `vermietungen`.

---

## 🎯 Was passiert im Setup?

1. **Verbindung testen** → Prüft ob PostgreSQL läuft
2. **Datenbank erstellen** → `CREATE DATABASE radstation`
3. **Tabelle erstellen** → Führt `migration_vermietungen.sql` aus
4. **Überprüfung** → Zeigt alle Tabellen an

---

## 📊 Standard-Verbindungsdaten

Für deine `.env` Datei:
```
DATABASE_URL=postgresql://postgres:DEIN_PASSWORT@localhost:5432/radstation
```

Ersetze `DEIN_PASSWORT` mit deinem echten PostgreSQL-Passwort!

---

## 🆘 Hilfe benötigt?

**PostgreSQL läuft nicht:**
```batch
# Prüfe Status
sc query postgresql-x64-18

# Starte manuell
net start postgresql-x64-18
```

**Kann nicht verbinden:**
```batch
# Teste Verbindung
psql -U postgres -c "SELECT version();"
```

**Tabellen fehlen:**
```batch
# Zeige alle Tabellen
psql -U postgres -d radstation -c "\dt"

# Führe Migration nochmal aus
psql -U postgres -d radstation -f migration_vermietungen.sql
```

---

**Erstellt:** 2026-02-02
**PostgreSQL Version:** 18
**Datenbank:** radstation

Viel Erfolg! 🚀
