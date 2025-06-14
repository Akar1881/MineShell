#!/bin/bash

echo "🚀 Installing MineShell..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."

# Install root dependencies
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build
cd ..

# Create servers directory
mkdir -p servers

echo "✅ Installation complete!"
echo ""
echo "🎯 To start MineShell:"
echo "   npm run dev    (Development mode)"
echo "   npm start      (Production mode)"
echo ""
echo "📱 Default access: http://localhost:8080"
echo "👤 Default login: admin / mineshell123"
echo ""
echo "⚠️  Remember to:"
echo "   1. Change default password in backend/config.yaml"
echo "   2. Upload server JAR files to your server directories"
echo "   3. Ensure Java is installed for Minecraft servers"