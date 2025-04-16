#!/bin/bash
# Startup script for Trading Bot System

# Get absolute path to script directory
SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
cd "$SCRIPT_DIR" || exit 1

# Define base directories
BOT_DIR=$(dirname "$SCRIPT_DIR")
FRONTEND_DIR="$BOT_DIR/frontend"
BACKEND_DIR="$BOT_DIR/backend"

# Clean up existing processes
./shutdown.sh

# Build frontend first
npm --prefix "$FRONTEND_DIR" run build

# Start backend server
export FLASK_APP="$BACKEND_DIR/app/main.py"
export FLASK_ENV=development
export FLASK_DEBUG=1

mkdir -p "$BOT_DIR/logs"
nohup uvicorn app.main:app --host 0.0.0.0 --port 5001 > "$BOT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$BOT_DIR/backend.pid"
echo "Backend PID: $BACKEND_PID"
# Function to kill process on port 3000 based on OS
kill_port_3000() {
  if [[ "$(uname -s)" == *"NT"* || "$(uname -s)" == *"MINGW"* || "$(uname -s)" == *"CYGWIN"* ]]; then
    # Windows environment
    echo "Killing process on port 3000 using Windows commands"
    pid=$(netstat -ano | grep ':3000' | awk '{print $5}' | head -n 1)
    if [[ -n "$pid" ]]; then
      taskkill /PID $pid /F
    fi
  else
    # Unix/Linux environment
    lsof -ti:3000 | xargs -r kill -9
  fi
}

# Kill any process using port 3000 before starting frontend
kill_port_3000
# Start frontend server
npm --prefix "$FRONTEND_DIR" start > "$BOT_DIR/logs/frontend.log" 2>&1 & FRONTEND_PID=$!
echo $FRONTEND_PID > "$FRONTEND_DIR/frontend.pid"
echo Frontend PID: $FRONTEND_PID

# Give services a moment to start
sleep 2

# Verify backend
if ! curl -s "http://localhost:5001/api/v1/status/backend" > /dev/null 2>&1; then
    echo "Backend failed to start. Check logs for details."
    exit 1
fi

# Verify frontend
if ! curl -s "http://localhost:3000" > /dev/null 2>&1; then
    echo "Frontend failed to start. Check logs for details."
    exit 1
fi

echo ""
echo "Frontend is running at http://localhost:3000"
echo "Backend is running at http://localhost:5001"
echo ""
echo "  - cat logs/frontend.log  (for frontend logs)"
echo "  - cat logs/backend.log   (for backend logs)"
exit 0