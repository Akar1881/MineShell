@echo off
echo Starting MineShell 1.0.0...

REM Load config values
for /f "tokens=*" %%a in ('node -e "console.log(require('yamljs').load('./config.yaml').server.backend.port)"') do set BACKEND_PORT=%%a
for /f "tokens=*" %%a in ('node -e "console.log(require('yamljs').load('./config.yaml').server.frontend.port)"') do set FRONTEND_PORT=%%a

REM Start backend server
start cmd /k "cd backend && npm start"

REM Wait a moment for backend to start
timeout /t 5

REM Start frontend server
start cmd /k "cd frontend && npm run preview"

echo.
echo MineShell is starting up...
echo Backend: http://localhost:%BACKEND_PORT%
echo Frontend: http://localhost:%FRONTEND_PORT%
echo.
echo Press Ctrl+C in the terminal windows to stop the servers
echo.
pause 