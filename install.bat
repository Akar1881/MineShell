@echo off
echo Installing MineShell 1.0.0...

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed! Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Java is installed
where java >nul 2>nul
if %errorlevel% neq 0 (
    echo Java is not installed! Please install Java first.
    echo Download from: https://adoptium.net/
    pause
    exit /b 1
)

echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies!
    pause
    exit /b 1
)

REM Setup environment file if it doesn't exist
if not exist "../.env" (
    echo Creating .env file from example.env...
    copy ..\example.env ..\.env
    echo Please update the .env file with secure credentials!
)

echo Installing frontend dependencies...
cd ../frontend
call npm install
call npm install dotenv --save-dev
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies!
    pause
    exit /b 1
)

echo Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo Failed to build frontend!
    pause
    exit /b 1
)

cd ..
echo Installation completed successfully!
echo.
echo To start MineShell, run start.bat
echo.
pause 