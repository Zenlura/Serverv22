@echo off
echo ============================================
echo   Dashboard CORS Fix - Automatische Reparatur
echo ============================================
echo.

REM Prüfe ob wir im richtigen Verzeichnis sind
if not exist "app\routers\dashboard.py" (
    echo FEHLER: Bitte fuehre dieses Skript im Hauptverzeichnis aus!
    echo Du solltest die Dateien app\routers\dashboard.py sehen koennen.
    pause
    exit /b 1
)

echo [1/4] Backup der alten Dateien...
if exist "app\routers\dashboard.py" (
    copy /Y "app\routers\dashboard.py" "app\routers\dashboard.py.backup" >nul
    echo    - Backup erstellt: dashboard.py.backup
)

echo.
echo [2/4] Ersetze Dashboard Router mit fixer Version...
if exist "fixed_dashboard.py" (
    copy /Y "fixed_dashboard.py" "app\routers\dashboard.py"
    echo    - Dashboard Router aktualisiert!
) else (
    echo    WARNUNG: fixed_dashboard.py nicht gefunden!
    echo    Bitte stelle sicher, dass die Datei im Hauptverzeichnis liegt.
)

echo.
echo [3/4] Pruefe PostgreSQL Verbindung...
psql -U postgres -d radstation -c "SELECT version();" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    - PostgreSQL Verbindung OK!
    
    echo.
    echo [4/4] Fuehre Vermietungs-Migration aus...
    if exist "migration_vermietungen.sql" (
        psql -U postgres -d radstation -f migration_vermietungen.sql
        echo    - Migration ausgefuehrt!
    ) else (
        echo    WARNUNG: migration_vermietungen.sql nicht gefunden!
    )
) else (
    echo    WARNUNG: PostgreSQL nicht erreichbar!
    echo    Bitte stelle sicher, dass PostgreSQL laeuft und die Datenbank existiert.
    echo    Du kannst die Migration spaeter manuell ausfuehren mit:
    echo    psql -U postgres -d radstation -f migration_vermietungen.sql
)

echo.
echo ============================================
echo   Installation abgeschlossen!
echo ============================================
echo.
echo Naechste Schritte:
echo 1. Starte den Backend-Server neu (STOP.bat, dann START.bat)
echo 2. Starte den Frontend-Server neu
echo 3. Oeffne das Dashboard im Browser
echo.
echo Das CORS-Problem sollte jetzt behoben sein!
echo.
pause
