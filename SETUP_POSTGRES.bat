@echo off
chcp 65001 >nul
echo ============================================
echo   PostgreSQL Setup für Radstation Dashboard
echo ============================================
echo.

REM PostgreSQL Pfad setzen
set PGPATH=C:\Program Files\PostgreSQL\18\bin
set PATH=%PGPATH%;%PATH%

echo [INFO] PostgreSQL Version:
"%PGPATH%\psql.exe" --version
echo.

echo ============================================
echo   Schritt 1: Verbindung testen
echo ============================================
echo.
echo Bitte gib das PostgreSQL Passwort ein (postgres user):
"%PGPATH%\psql.exe" -U postgres -c "SELECT version();"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ FEHLER: Konnte nicht zu PostgreSQL verbinden!
    echo.
    echo Mögliche Gründe:
    echo 1. PostgreSQL Server läuft nicht
    echo 2. Falsches Passwort
    echo 3. PostgreSQL-Dienst ist gestoppt
    echo.
    echo Bitte starte den PostgreSQL-Dienst:
    echo - Windows-Taste + R
    echo - Tippe: services.msc
    echo - Suche: postgresql-x64-18
    echo - Rechtsklick → Starten
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Verbindung erfolgreich!
echo.

echo ============================================
echo   Schritt 2: Datenbank erstellen
echo ============================================
echo.

echo Erstelle Datenbank 'radstation'...
"%PGPATH%\psql.exe" -U postgres -c "CREATE DATABASE radstation;" 2>nul

if %ERRORLEVEL% EQU 0 (
    echo ✅ Datenbank erstellt!
) else (
    echo ℹ️  Datenbank existiert bereits (das ist OK)
)

echo.
echo ============================================
echo   Schritt 3: Vermietungs-Tabelle erstellen
echo ============================================
echo.

if exist "migration_vermietungen.sql" (
    echo Führe Migration aus...
    "%PGPATH%\psql.exe" -U postgres -d radstation -f migration_vermietungen.sql
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Migration erfolgreich!
    ) else (
        echo ⚠️  Migration hatte Fehler (möglicherweise existiert Tabelle schon)
    )
) else (
    echo ⚠️  WARNUNG: migration_vermietungen.sql nicht gefunden!
    echo Bitte stelle sicher, dass die Datei im aktuellen Verzeichnis liegt.
)

echo.
echo ============================================
echo   Schritt 4: Tabellen überprüfen
echo ============================================
echo.

echo Vorhandene Tabellen:
"%PGPATH%\psql.exe" -U postgres -d radstation -c "\dt"

echo.
echo ============================================
echo   Setup abgeschlossen!
echo ============================================
echo.
echo Die PostgreSQL-Datenbank ist bereit!
echo.
echo Nächste Schritte:
echo 1. Führe FIX_DASHBOARD.bat aus (falls noch nicht gemacht)
echo 2. Starte den Server mit START.bat
echo 3. Öffne http://localhost:5173
echo.
echo Datenbank-Verbindung:
echo   Host: localhost
echo   Port: 5432
echo   Datenbank: radstation
echo   User: postgres
echo.
pause
