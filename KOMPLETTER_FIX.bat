@echo off
chcp 65001 >nul
echo ============================================
echo   KOMPLETTER DASHBOARD FIX
echo   PostgreSQL + CORS-Problem Behebung
echo ============================================
echo.

REM PostgreSQL Pfad setzen
set PGPATH=C:\Program Files\PostgreSQL\18\bin
set PATH=%PGPATH%;%PATH%

REM Prüfe ob wir im richtigen Verzeichnis sind
if not exist "app\routers\dashboard.py" (
    echo ❌ FEHLER: Bitte führe dieses Skript im Hauptverzeichnis aus!
    echo Du solltest die Dateien app\routers\dashboard.py sehen können.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Teil 1: PostgreSQL Setup
echo ============================================
echo.

echo [1.1] Teste PostgreSQL-Verbindung...
"%PGPATH%\psql.exe" --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL nicht gefunden in: %PGPATH%
    echo Bitte passe den Pfad in diesem Skript an!
    pause
    exit /b 1
)
echo ✅ PostgreSQL gefunden!

echo.
echo [1.2] Verbinde zur Datenbank...
echo (Bitte gib dein PostgreSQL-Passwort ein)
echo.

"%PGPATH%\psql.exe" -U postgres -c "SELECT 1;" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Kann nicht verbinden. Versuche mit Passwort-Eingabe...
    "%PGPATH%\psql.exe" -U postgres -c "SELECT 1;"
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ PostgreSQL-Verbindung fehlgeschlagen!
        echo.
        echo Bitte prüfe:
        echo 1. PostgreSQL-Dienst läuft (services.msc)
        echo 2. Richtiges Passwort
        echo.
        pause
        exit /b 1
    )
)
echo ✅ Verbindung OK!

echo.
echo [1.3] Erstelle Datenbank 'radstation'...
"%PGPATH%\psql.exe" -U postgres -c "CREATE DATABASE radstation;" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Datenbank erstellt!
) else (
    echo ℹ️  Datenbank existiert bereits
)

echo.
echo [1.4] Führe Vermietungs-Migration aus...
if exist "migration_vermietungen.sql" (
    "%PGPATH%\psql.exe" -U postgres -d radstation -f migration_vermietungen.sql >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Migration erfolgreich!
    ) else (
        echo ℹ️  Migration übersprungen (Tabelle existiert möglicherweise)
    )
) else (
    echo ⚠️  migration_vermietungen.sql nicht gefunden
)

echo.
echo ============================================
echo   Teil 2: Dashboard-Fix
echo ============================================
echo.

echo [2.1] Backup der alten Dateien...
if exist "app\routers\dashboard.py" (
    copy /Y "app\routers\dashboard.py" "app\routers\dashboard.py.backup" >nul 2>&1
    echo ✅ Backup erstellt: dashboard.py.backup
)

echo.
echo [2.2] Ersetze Dashboard Router...
if exist "fixed_dashboard.py" (
    copy /Y "fixed_dashboard.py" "app\routers\dashboard.py" >nul
    echo ✅ Dashboard Router aktualisiert!
) else (
    echo ❌ FEHLER: fixed_dashboard.py nicht gefunden!
    echo Bitte stelle sicher, dass alle Fix-Dateien vorhanden sind.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Teil 3: Überprüfung
echo ============================================
echo.

echo [3.1] Prüfe Tabellen in der Datenbank...
"%PGPATH%\psql.exe" -U postgres -d radstation -c "\dt" 2>nul | findstr /C:"vermietungen" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Vermietungs-Tabelle existiert
) else (
    echo ⚠️  Vermietungs-Tabelle nicht gefunden
)

echo.
echo [3.2] Prüfe Dashboard-Datei...
if exist "app\routers\dashboard.py" (
    findstr /C:"VERMIETUNG_AVAILABLE" "app\routers\dashboard.py" >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Dashboard-Fix korrekt installiert
    ) else (
        echo ⚠️  Dashboard-Fix möglicherweise nicht korrekt
    )
) else (
    echo ❌ Dashboard-Datei fehlt!
)

echo.
echo ============================================
echo   🎉 SETUP ABGESCHLOSSEN!
echo ============================================
echo.
echo Nächste Schritte:
echo.
echo 1. Server neu starten:
echo    STOP.bat
echo    START.bat
echo.
echo 2. Frontend im Browser öffnen:
echo    http://localhost:5173
echo.
echo 3. API-Dokumentation prüfen:
echo    http://localhost:8000/docs
echo.
echo ============================================
echo.
echo Datenbank-Info:
echo   Host: localhost:5432
echo   DB: radstation
echo   User: postgres
echo.
echo Bei Problemen:
echo - Siehe ANLEITUNG_CORS_FIX.md
echo - Prüfe Browser-Konsole (F12)
echo - Prüfe Server-Logs
echo.
pause
