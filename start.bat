@echo off
echo Starting MineShell 1.0.0...

REM Start backend server
start cmd /k "cd backend && npm start"

REM Wait a moment for backend to start
timeout /t 5

REM Start frontend server
start cmd /k "cd frontend && npm run preview"

echo.
echo MineShell is starting up...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Press Ctrl+C in the terminal windows to stop the servers
echo.
pause 