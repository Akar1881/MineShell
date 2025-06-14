#!/bin/bash

echo "Installing MineShell 1.0.0..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed! Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "Java is not installed! Please install Java first."
    echo "Visit: https://adoptium.net/"
    exit 1
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install backend dependencies!"
    exit 1
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install frontend dependencies!"
    exit 1
fi

# Build frontend
echo "Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "Failed to build frontend!"
    exit 1
fi

cd ..
echo "Installation completed successfully!"
echo
echo "To start MineShell, run ./start.sh"
echo
read -p "Press Enter to continue..."