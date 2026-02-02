# 🚨 CORS-Problem Fix - SCHNELLSTART

## 📋 Was ist passiert?
Dein Dashboard zeigt CORS-Fehler und "500 Internal Server Error" weil:
1. Die Vermietungs-Tabelle in der Datenbank fehlt
2. Der Dashboard-Router keine Fehlerbehandlung hat

## ✅ Schnelle Lösung (2 Minuten)

### Variante A: Automatisch (EMPFOHLEN) 

1. **Doppelklick auf:**
   ```
   FIX_DASHBOARD.bat
   ```

2. **Warte bis fertig**, dann:
   ```
   STOP.bat
   START.bat
   ```

3. **Fertig!** 🎉

---

### Variante B: Manuell

1. **Ersetze die Dashboard-Datei:**
   - Kopiere `fixed_dashboard.py` 
   - Nach `app/routers/dashboard.py`

2. **Führe SQL-Migration aus:**
   ```batch
   psql -U postgres -d radstation -f migration_vermietungen.sql
   ```
   
   *Oder mit pgAdmin: Query Tool → SQL einfügen → Ausführen*

3. **Server neu starten:**
   ```batch
   STOP.bat
   START.bat
   ```

---

## 🔍 Verifikation

**Das Dashboard sollte jetzt laufen ohne:**
- ❌ CORS-Fehler
- ❌ "NetworkError when attempting to fetch"
- ❌ "500 Internal Server Error"
- ❌ "relation does not exist"

**Stattdessen:**
- ✅ Dashboard zeigt Statistiken
- ✅ Keine roten Fehler in der Browser-Konsole
- ✅ API-Calls erfolgreich

---

## 📚 Mehr Infos

Siehe `ANLEITUNG_CORS_FIX.md` für:
- Detaillierte Erklärung
- Troubleshooting
- Technische Details

---

**Erstellt:** 2026-02-02  
**Fix-Version:** 1.0

Viel Erfolg! 🚀
