@echo off
echo ========================================
echo  RADSTATION - NETZWERK-MODUS
echo  Server-IP: 192.168.178.53
echo ========================================
echo.

cd /d %~dp0

echo [1/2] Starte Backend (Port 8000)...
echo      Erreichbar unter: http://192.168.178.53:8000
start "Radstation Backend" cmd /k "call venv\Scripts\activate.bat && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Starte Frontend (Port 3000)...
echo      Erreichbar unter: http://192.168.178.53:3000
cd frontend
start "Radstation Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo  SERVER LAEUFT!
echo ========================================
echo  Lokal:     http://localhost:3000
echo  Netzwerk:  http://192.168.178.53:3000
echo  API Docs:  http://192.168.178.53:8000/docs
echo ========================================
echo.
echo Zum Beenden beide Fenster schliessen
echo oder STOP.bat ausfuehren
echo.
pause
