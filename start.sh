#!/bin/bash

# Dev Launcher Startup Script
echo "🚀 Starting Dev Launcher..."
echo ""

# Kill all common development ports to avoid conflicts
echo "🧹 Cleaning up running development servers..."
PORTS_TO_KILL=($(seq 3000 3020) $(seq 4500 4510) $(seq 5173 5180) $(seq 8000 8010))

for port in "${PORTS_TO_KILL[@]}"; do
  pid=$(lsof -ti:$port 2>/dev/null)
  if [ ! -z "$pid" ]; then
    echo "  ✓ Killing process on port $port (PID: $pid)"
    kill -9 $pid 2>/dev/null
  fi
done

echo "✓ Port cleanup complete"
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
BACKEND_PID=$!

cd frontend && npm run dev &
FRONTEND_PID=$!

# Wait for servers to start, then open browser
(
  sleep 5
  echo ""
  echo "🌐 Opening Dev Launcher in browser..."
  open http://localhost:4501
) &

wait
