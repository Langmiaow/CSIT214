@echo off
setlocal
cd /d "%~dp0"

echo [1/2] Setting up Flask backend...
cd backend
if not exist .venv py -m venv .venv
call .venv\Scripts\activate.bat
python -m pip install -r requirements.txt
if errorlevel 1 goto :error

cd ..\frontend
echo [2/2] Installing React dependencies...
call npm install
if errorlevel 1 goto :error

echo.
echo Setup complete. Run start-demo.bat to launch the prototype.
pause
exit /b 0

:error
echo.
echo Setup failed. Check that Python, Node.js and internet access are available.
pause
exit /b 1
