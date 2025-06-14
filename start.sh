#!/bin/bash

echo "Starting MineShell 1.0.0..."

# Start backend server
cd backend
npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 5

# Start frontend server
cd ../frontend
npm run preview &
FRONTEND_PID=$!

echo
echo "MineShell is starting up..."
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo
echo "Press Ctrl+C to stop the servers"
echo

# Function to handle cleanup on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

# Keep script running
wait 