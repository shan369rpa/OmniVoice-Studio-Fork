#!/bin/zsh
# ──────────────────────────────────────────────────────────
# OmniVoice Clone Mode — Server Launcher (M2 Ultra)
# Double-click this file to:
#   1. Kill any old server on port 3900
#   2. Build the frontend
#   3. Start the backend server on LAN (port 3900)
#   4. Auto-open the Clone Mode URL in your browser
# ──────────────────────────────────────────────────────────

PROJECT_DIR="/Users/sonpc/Documents/GitHub/OminiVoice"
PORT=3900

cd "$PROJECT_DIR"

echo "╔══════════════════════════════════════════╗"
echo "║   🎙️  OmniVoice Clone Mode — Starting   ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Step 0: Kill old server if port is occupied ──
# Chỉ kill process đang LISTEN (server), không kill Chrome helper
OLD_PID=$(lsof -ti :$PORT -sTCP:LISTEN 2>/dev/null)
if [ -n "$OLD_PID" ]; then
  echo "⚠️  Port $PORT occupied by server (PID: $OLD_PID). Force killing..."
  kill -9 $OLD_PID 2>/dev/null
  sleep 2
  echo "✅ Old server killed"
fi

# ── Detect LAN IP ──
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "127.0.0.1")
CLONE_URL="http://${LAN_IP}:${PORT}/?mode=clone"

echo "📡 LAN IP detected: $LAN_IP"
echo "🔗 Clone Mode URL: $CLONE_URL"
echo ""

# ── Step 1: Build frontend ──
echo "🔨 Building frontend..."
cd frontend
npm run build
cd "$PROJECT_DIR"
echo "✅ Frontend build complete"
echo ""

# ── Step 2: Start backend ──
echo "🚀 Starting backend server on 0.0.0.0:${PORT}..."
echo ""
echo "══════════════════════════════════════════"
echo "  URL: $CLONE_URL"
echo "  Press Ctrl+C to stop the server"
echo "══════════════════════════════════════════"
echo ""

# Run in foreground so Ctrl+C works directly
OMNIVOICE_BIND_HOST=0.0.0.0 OMNIVOICE_LAN_MODE=1 \
  uv run uvicorn main:app --app-dir backend --host 0.0.0.0 --port $PORT &
SERVER_PID=$!

# Wait for server to boot, then open browser
sleep 4
echo "🌐 Opening Clone Mode in browser..."
open "$CLONE_URL"

# Keep Terminal open — wait for the server process
wait $SERVER_PID
