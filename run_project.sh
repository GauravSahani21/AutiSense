#!/bin/zsh
# AutiSense — Full Project Startup Script
# Launches all 3 services in separate Terminal windows

PROJECT_DIR="/Users/gauravsahani/Desktop/Al based system for Early detection of autism in preschool children"

echo "🚀 Starting AutiSense project..."

# ── 1. Node.js Backend (Port 5000) ───────────────────────────────────────────
osascript <<EOF
tell application "Terminal"
  activate
  set backendTab to do script "echo '=== 🟢 AutiSense Node.js Backend (Port 5000) ===' && cd \"$PROJECT_DIR/autisense-backend\" && node server.js"
  set custom title of backendTab to "AutiSense Backend"
end tell
EOF

sleep 2

# ── 2. React Frontend (Port 5173) ────────────────────────────────────────────
osascript <<EOF
tell application "Terminal"
  activate
  set frontendTab to do script "echo '=== 🔵 AutiSense React Frontend (Port 5173) ===' && cd \"$PROJECT_DIR/autisense\" && npm run dev"
  set custom title of frontendTab to "AutiSense Frontend"
end tell
EOF

sleep 2

# ── 3. Python ML Backend (Port 5001) ─────────────────────────────────────────
osascript <<EOF
tell application "Terminal"
  activate
  set mlTab to do script "echo '=== 🟣 AutiSense Python ML API (Port 5001) ===' && cd \"$PROJECT_DIR/backend\" && python3 -m pip install flask flask-cors scikit-learn numpy pandas --quiet && python3 api.py"
  set custom title of mlTab to "AutiSense ML API"
end tell
EOF

echo ""
echo "✅ All services launched in separate Terminal windows!"
echo ""
echo "   🟢 Node.js Backend  → http://localhost:5000"
echo "   🔵 React Frontend   → http://localhost:5173"  
echo "   🟣 Python ML API    → http://localhost:5001"
echo ""
echo "Opening browser in 5 seconds..."
sleep 5
open http://localhost:5173
