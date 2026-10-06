@echo off
setlocal
cd /d "%~dp0"

if not exist backend\.venv\Scripts\python.exe (
    echo Backend environment not found. Run setup-demo.bat first.
    pause
    exit /b 1
)

if not exist frontend\node_modules (
    echo Frontend dependencies not found. Run setup-demo.bat first.
    pause
    exit /b 1
)

start "CoastLink API" cmd /k "cd /d %~dp0backend && .venv\Scripts\python.exe app.py"
start "CoastLink Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo CoastLink demo is starting in two terminal windows.
echo Open the Vite URL shown in the frontend terminal.
pause
