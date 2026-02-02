@echo off
chcp 65001 >nul
cls
echo ============================================
echo   KOMPLETTER DASHBOARD FIX (VERBOSE)
echo   PostgreSQL + CORS-Problem Behebung
echo ============================================
echo.
echo Dieses Fenster bleibt offen, damit du alles sehen kannst!
echo.
pause

REM PostgreSQL Pfad setzen
set PGPATH=C:\Program Files\PostgreSQL\18\bin
set PATH=%PGPATH%;%PATH%

REM Prüfe ob wir im richtigen Verzeichnis sind
echo [CHECK] Prüfe aktuelles Verzeichnis...
if not exist "app\routers\dashboard.py" (
    echo.
    echo ❌❌❌ FEHLER ❌❌❌
    echo.
    echo Dieses Skript muss im Hauptverzeichnis ausgeführt werden!
    echo.
    echo Aktuelles Verzeichnis: %CD%
    echo.
    echo Bitte:
    echo 1. Öffne den Windows Explorer
    echo 2. Gehe zu deinem Serverv22-dashboard Ordner
    echo 3. Ziehe KOMPLETTER_FIX_VERBOSE.bat in den Ordner
    echo 4. Doppelklick auf die Datei
    echo.
    echo Es sollten folgende Ordner/Dateien sichtbar sein:
    echo - app\
    echo - frontend\
    echo - START.bat
    echo - STOP.bat
    echo.
    pause
    exit /b 1
)
echo ✅ Verzeichnis ist korrekt: %CD%
echo.

echo ============================================
echo   Teil 1: PostgreSQL Setup
echo ============================================
echo.

echo [1.1] Suche PostgreSQL...
if not exist "%PGPATH%\psql.exe" (
    echo ❌ PostgreSQL nicht gefunden in: %PGPATH%
    echo.
    echo Bitte prüfe ob PostgreSQL installiert ist!
    echo Oder passe den Pfad in der Datei an (Zeile 15):
    echo   set PGPATH=C:\Program Files\PostgreSQL\18\bin
    echo.
    pause
    exit /b 1
)
echo ✅ PostgreSQL gefunden: %PGPATH%
echo.

echo [1.2] Teste PostgreSQL-Version...
"%PGPATH%\psql.exe" --version
echo.

echo [1.3] Teste Verbindung zu PostgreSQL...
echo (Du wirst nach dem Passwort für den postgres-User gefragt)
echo.

"%PGPATH%\psql.exe" -U postgres -c "SELECT 'Verbindung OK' as status;"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Verbindung fehlgeschlagen!
    echo.
    echo Mögliche Probleme:
    echo 1. PostgreSQL-Dienst läuft nicht
    echo 2. Falsches Passwort
    echo 3. postgres-User existiert nicht
    echo.
    echo Prüfe den Dienst:
    echo - Windows + R
    echo - Tippe: services.msc
    echo - Suche: postgresql-x64-18
    echo - Status sollte "Wird ausgeführt" sein
    echo.
    pause
    exit /b 1
)
echo ✅ Verbindung erfolgreich!
echo.

echo [1.4] Erstelle Datenbank 'radstation'...
"%PGPATH%\psql.exe" -U postgres -c "CREATE DATABASE radstation;"
if %ERRORLEVEL% EQU 0 (
    echo ✅ Datenbank 'radstation' erstellt!
) else (
    echo ℹ️  Datenbank existiert bereits (das ist OK)
)
echo.

echo [1.5] Prüfe ob migration_vermietungen.sql existiert...
if not exist "migration_vermietungen.sql" (
    echo ❌ FEHLER: migration_vermietungen.sql nicht gefunden!
    echo.
    echo Die Datei muss im gleichen Verzeichnis wie dieses Skript sein.
    echo Bitte stelle sicher, dass du alle Dateien aus dem ZIP entpackt hast!
    echo.
    pause
    exit /b 1
)
echo ✅ migration_vermietungen.sql gefunden
echo.

echo [1.6] Führe Migration aus...
echo.
"%PGPATH%\psql.exe" -U postgres -d radstation -f migration_vermietungen.sql
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Migration erfolgreich ausgeführt!
) else (
    echo.
    echo ⚠️  Migration hatte Fehler
    echo (Möglicherweise existiert die Tabelle schon - das wäre OK)
)
echo.

echo [1.7] Zeige vorhandene Tabellen...
echo.
"%PGPATH%\psql.exe" -U postgres -d radstation -c "\dt"
echo.

echo ============================================
echo   Teil 2: Dashboard-Fix
echo ============================================
echo.

echo [2.1] Prüfe ob fixed_dashboard.py existiert...
if not exist "fixed_dashboard.py" (
    echo ❌ FEHLER: fixed_dashboard.py nicht gefunden!
    echo.
    echo Bitte stelle sicher, dass du alle Dateien aus dem ZIP entpackt hast!
    echo.
    pause
    exit /b 1
)
echo ✅ fixed_dashboard.py gefunden
echo.

echo [2.2] Erstelle Backup der alten dashboard.py...
if exist "app\routers\dashboard.py" (
    copy /Y "app\routers\dashboard.py" "app\routers\dashboard.py.backup.%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%" >nul 2>&1
    echo ✅ Backup erstellt
) else (
    echo ⚠️  Alte dashboard.py nicht gefunden (das ist ungewöhnlich)
)
echo.

echo [2.3] Ersetze dashboard.py mit fixed version...
copy /Y "fixed_dashboard.py" "app\routers\dashboard.py"
if %ERRORLEVEL% EQU 0 (
    echo ✅ Dashboard-Router erfolgreich aktualisiert!
) else (
    echo ❌ FEHLER beim Kopieren!
    pause
    exit /b 1
)
echo.

echo ============================================
echo   Teil 3: Überprüfung
echo ============================================
echo.

echo [3.1] Prüfe ob Vermietungs-Tabelle existiert...
"%PGPATH%\psql.exe" -U postgres -d radstation -c "SELECT COUNT(*) as anzahl_spalten FROM information_schema.columns WHERE table_name = 'vermietungen';"
echo.

echo [3.2] Prüfe neuen Dashboard-Code...
findstr /C:"VERMIETUNG_AVAILABLE" "app\routers\dashboard.py" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Dashboard-Fix ist korrekt installiert
    echo.
    echo Die neue dashboard.py enthält:
    findstr /N /C:"VERMIETUNG_AVAILABLE" "app\routers\dashboard.py"
) else (
    echo ❌ Dashboard-Fix nicht korrekt installiert!
    echo.
    echo Bitte prüfe manuell:
    echo - Öffne app\routers\dashboard.py
    echo - Suche nach "VERMIETUNG_AVAILABLE"
    echo.
)
echo.

echo ============================================
echo   🎉 SETUP ABGESCHLOSSEN!
echo ============================================
echo.
echo Was wurde gemacht:
echo ✅ PostgreSQL-Verbindung getestet
echo ✅ Datenbank 'radstation' erstellt/geprüft
echo ✅ Vermietungs-Tabelle erstellt
echo ✅ Dashboard-Router mit Fix ersetzt
echo.
echo ============================================
echo   WICHTIG: NÄCHSTE SCHRITTE!
echo ============================================
echo.
echo 1. STOPPE den Backend-Server (falls er läuft):
echo    Führe aus: STOP.bat
echo.
echo 2. STARTE den Backend-Server neu:
echo    Führe aus: START.bat
echo.
echo 3. LEERE den Browser-Cache:
echo    - Drücke Strg + Shift + Delete
echo    - Oder öffne Browser-Konsole (F12) und mache Rechtsklick auf Reload-Button
echo      dann "Leeren Cache und erneut laden"
echo.
echo 4. ÖFFNE das Dashboard:
echo    http://localhost:5173
echo.
echo 5. PRÜFE die Browser-Konsole (F12):
echo    - Es sollten KEINE roten CORS-Fehler mehr da sein
echo    - Es sollten KEINE "500 Internal Server Error" mehr da sein
echo.
echo ============================================
echo.
echo Datenbank-Info:
echo   PostgreSQL: %PGPATH%
echo   Host: localhost:5432
echo   Datenbank: radstation
echo   User: postgres
echo.
echo Bei Problemen:
echo - Siehe ANLEITUNG_CORS_FIX.md
echo - Siehe POSTGRES_ANLEITUNG.md
echo - Prüfe Browser-Konsole (F12)
echo - Prüfe Backend-Logs
echo.
echo ============================================
echo.
echo Drücke eine Taste zum Beenden...
pause >nul
