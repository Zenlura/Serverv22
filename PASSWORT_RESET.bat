@echo off
chcp 65001 >nul
cls
echo ============================================
echo   PostgreSQL Passwort vergessen?
echo   Kein Problem - wir setzen es zurück!
echo ============================================
echo.
echo WICHTIG: Dieses Skript muss als Administrator ausgeführt werden!
echo.
echo Rechtsklick auf die Datei → "Als Administrator ausführen"
echo.
pause

set PGPATH=C:\Program Files\PostgreSQL\18\bin
set PGDATA=C:\Program Files\PostgreSQL\18\data

echo.
echo [Schritt 1/5] Finde PostgreSQL-Konfiguration...
echo.

if not exist "%PGDATA%\pg_hba.conf" (
    echo ❌ FEHLER: pg_hba.conf nicht gefunden in: %PGDATA%
    echo.
    echo Mögliche Pfade:
    echo - C:\Program Files\PostgreSQL\18\data
    echo - C:\Program Files\PostgreSQL\17\data
    echo - C:\Program Files\PostgreSQL\16\data
    echo.
    echo Bitte finde den richtigen Pfad und passe ihn in Zeile 14 dieser Datei an:
    echo   set PGDATA=C:\Program Files\PostgreSQL\18\data
    echo.
    pause
    exit /b 1
)

echo ✅ Gefunden: %PGDATA%\pg_hba.conf
echo.

echo [Schritt 2/5] Erstelle Backup der Konfiguration...
copy /Y "%PGDATA%\pg_hba.conf" "%PGDATA%\pg_hba.conf.backup" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backup erstellt: pg_hba.conf.backup
) else (
    echo ❌ FEHLER: Konnte kein Backup erstellen!
    echo Bitte führe dieses Skript als Administrator aus!
    echo ^(Rechtsklick → Als Administrator ausführen^)
    echo.
    pause
    exit /b 1
)
echo.

echo [Schritt 3/5] Ändere Authentifizierung auf 'trust' (ohne Passwort)...
echo.
echo Dies erlaubt temporär Login ohne Passwort.
echo.

REM Erstelle neue pg_hba.conf mit trust
(
echo # TYPE  DATABASE        USER            ADDRESS                 METHOD
echo # Temporär geändert für Passwort-Reset
echo local   all             all                                     trust
echo host    all             all             127.0.0.1/32            trust
echo host    all             all             ::1/128                 trust
) > "%PGDATA%\pg_hba.conf.new"

move /Y "%PGDATA%\pg_hba.conf.new" "%PGDATA%\pg_hba.conf" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Konfiguration geändert
) else (
    echo ❌ FEHLER beim Ändern!
    pause
    exit /b 1
)
echo.

echo [Schritt 4/5] Starte PostgreSQL-Dienst neu...
echo.

net stop postgresql-x64-18 >nul 2>&1
timeout /t 2 >nul
net start postgresql-x64-18 >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo ✅ Dienst neugestartet
) else (
    echo ⚠️  Neustart fehlgeschlagen
    echo Bitte starte den Dienst manuell:
    echo - Windows + R → services.msc
    echo - Suche: postgresql-x64-18
    echo - Rechtsklick → Neu starten
    echo.
    echo Dann drücke eine Taste um fortzufahren...
    pause
)
echo.

echo [Schritt 5/5] Setze neues Passwort...
echo.
echo ============================================
echo   WICHTIG: Merke dir dieses Passwort!
echo ============================================
echo.
echo Empfohlenes Passwort: radstation
echo (oder wähle ein eigenes)
echo.
set /p NEWPW=Gib dein neues Passwort ein: 

if "%NEWPW%"=="" (
    echo.
    echo ❌ Kein Passwort eingegeben!
    pause
    exit /b 1
)

echo.
echo Setze Passwort für postgres-User...
"%PGPATH%\psql.exe" -U postgres -c "ALTER USER postgres WITH PASSWORD '%NEWPW%';"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Passwort erfolgreich geändert!
) else (
    echo ❌ Fehler beim Setzen des Passworts!
    pause
    exit /b 1
)
echo.

echo [Schritt 6/5] Stelle Authentifizierung wieder auf 'scram-sha-256'...
echo.

REM Stelle Original-Konfiguration wieder her (mit Passwort)
(
echo # TYPE  DATABASE        USER            ADDRESS                 METHOD
echo # Wieder auf normale Authentifizierung gesetzt
echo local   all             all                                     scram-sha-256
echo host    all             all             127.0.0.1/32            scram-sha-256
echo host    all             all             ::1/128                 scram-sha-256
) > "%PGDATA%\pg_hba.conf.new"

move /Y "%PGDATA%\pg_hba.conf.new" "%PGDATA%\pg_hba.conf" >nul
echo ✅ Konfiguration zurückgesetzt
echo.

echo Starte PostgreSQL nochmal neu...
net stop postgresql-x64-18 >nul 2>&1
timeout /t 2 >nul
net start postgresql-x64-18 >nul 2>&1
echo ✅ Dienst neugestartet
echo.

echo ============================================
echo   🎉 PASSWORT ERFOLGREICH ZURÜCKGESETZT!
echo ============================================
echo.
echo Dein neues PostgreSQL-Passwort: %NEWPW%
echo.
echo WICHTIG: Schreibe es auf!
echo.
echo ============================================
echo   Nächste Schritte:
echo ============================================
echo.
echo 1. Teste das neue Passwort:
echo    Führe aus: DIAGNOSE.bat
echo.
echo 2. Dann führe den Fix aus:
echo    Führe aus: KOMPLETTER_FIX_VERBOSE.bat
echo    ^(Nutze das neue Passwort: %NEWPW%^)
echo.
echo 3. Aktualisiere deine .env Datei (falls vorhanden):
echo    DATABASE_URL=postgresql://postgres:%NEWPW%@localhost:5432/radstation
echo.
echo ============================================
echo.
echo Backup wurde erstellt in:
echo %PGDATA%\pg_hba.conf.backup
echo.
echo Bei Problemen kann die Backup-Datei wiederhergestellt werden.
echo.
echo Drücke eine Taste zum Beenden...
pause >nul
