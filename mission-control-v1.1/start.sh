#!/bin/bash
# Start Mission Control Server
# Usage: ./start.sh [port]
# Default port: 8088

cd "$(dirname "$0")/server"

PORT="${1:-8088}"
export MC_PORT="$PORT"

echo "Starting Mission Control Server on port $PORT..."
echo "Dashboard: http://localhost:$PORT"
echo "Press Ctrl+C to stop"
echo ""

node mission-control-server.js
