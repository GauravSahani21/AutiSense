#!/bin/sh
set -e

echo "🚀 Starting AutiSense Unified Web Service..."

# Start Python Flask ML API on internal port 5001
echo "🟣 Launching Python ML Microservice on internal port 5001..."
python3 backend/api.py &

# Wait briefly for Flask to bind
sleep 2

# Start Node.js Express Server on $PORT (or 5000)
echo "🟢 Launching Node.js Express Web Server on port ${PORT:-5000}..."
exec node autisense-backend/server.js
