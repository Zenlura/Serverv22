@echo off
chcp 65001 >nul
cls
echo ============================================
echo   DIAGNOSE - Was ist der aktuelle Status?
echo ============================================
echo.

echo [1] Aktuelles Verzeichnis:
echo %CD%
echo.

echo [2] Prüfe wichtige Dateien...
echo.
if exist "app\routers\dashboard.py" (
    echo ✅ app\routers\dashboard.py existiert
) else (
    echo ❌ app\routers\dashboard.py FEHLT!
)

if exist "fixed_dashboard.py" (
    echo ✅ fixed_dashboard.py existiert
) else (
    echo ❌ fixed_dashboard.py FEHLT! ^(aus ZIP entpacken^)
)

if exist "migration_vermietungen.sql" (
    echo ✅ migration_vermietungen.sql existiert
) else (
    echo ❌ migration_vermietungen.sql FEHLT! ^(aus ZIP entpacken^)
)

if exist "START.bat" (
    echo ✅ START.bat existiert
) else (
    echo ❌ START.bat FEHLT!
)

if exist "STOP.bat" (
    echo ✅ STOP.bat existiert
) else (
    echo ❌ STOP.bat FEHLT!
)

echo.
echo [3] Prüfe Dashboard-Code...
if exist "app\routers\dashboard.py" (
    findstr /C:"VERMIETUNG_AVAILABLE" "app\routers\dashboard.py" >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Dashboard hat bereits den FIX
    ) else (
        echo ❌ Dashboard hat NOCH NICHT den Fix
        echo    ^(fixed_dashboard.py muss kopiert werden^)
    )
) else (
    echo ⚠️  Kann nicht prüfen - Datei fehlt
)
echo.

echo [4] Prüfe PostgreSQL...
set PGPATH=C:\Program Files\PostgreSQL\18\bin
if exist "%PGPATH%\psql.exe" (
    echo ✅ PostgreSQL gefunden in: %PGPATH%
    
    echo.
    echo Teste Verbindung ^(Passwort eingeben^):
    "%PGPATH%\psql.exe" -U postgres -d radstation -c "SELECT 'DB OK' as status;" 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Datenbank 'radstation' erreichbar
        
        echo.
        echo Prüfe Vermietungs-Tabelle:
        "%PGPATH%\psql.exe" -U postgres -d radstation -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'vermietungen';" 2>nul
    ) else (
        echo ❌ Kann nicht zur Datenbank verbinden
    )
) else (
    echo ❌ PostgreSQL nicht gefunden in: %PGPATH%
)

echo.
echo ============================================
echo   ZUSAMMENFASSUNG
echo ============================================
echo.
echo Wenn ALLE Punkte ✅ sind, sollte es funktionieren!
echo Wenn etwas ❌ ist, muss das zuerst behoben werden.
echo.
echo Was zu tun ist:
echo.
echo ❌ Dateien fehlen?
echo    → Entpacke Dashboard_KOMPLETT_FIX.zip komplett
echo.
echo ❌ Dashboard hat keinen Fix?
echo    → Führe KOMPLETTER_FIX_VERBOSE.bat aus
echo.
echo ❌ PostgreSQL nicht gefunden?
echo    → Passe Pfad in Skripten an
echo.
echo ❌ Datenbank nicht erreichbar?
echo    → Prüfe PostgreSQL-Dienst ^(services.msc^)
echo.
echo ============================================
echo.
pause
