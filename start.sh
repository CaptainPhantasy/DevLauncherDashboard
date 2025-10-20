#!/bin/bash

# Dev Launcher Startup Script
echo "🚀 Starting Dev Launcher..."
echo ""

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  cd backend && npm install --legacy-peer-deps && cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd frontend && npm install --legacy-peer-deps && cd ..
fi

echo ""
echo "✓ Dependencies ready"
echo ""
echo "Starting servers..."
echo "  Backend:  http://localhost:4500"
echo "  Frontend: http://localhost:4501"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start both servers using npm script from each directory
trap 'kill 0' SIGINT

cd backend && node server.js &
cd frontend && npm run dev &

wait
