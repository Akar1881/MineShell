@echo off
echo Starting MineShell...

REM Start backend server
start cmd /k "cd backend && npm start"

REM Wait a moment for backend to start
timeout /t 5

REM Start frontend server
start cmd /k "cd frontend && npm run dev"

echo MineShell is starting...
echo Backend will be available at: http://localhost:3000
echo Frontend will be available at: http://localhost:8080
pause 