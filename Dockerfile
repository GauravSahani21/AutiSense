# ==============================================================================
# AutiSense — Unified Production Dockerfile for Render Web Service
# Combines:
#   1. React (Vite) Frontend Build (served statically by Node.js)
#   2. Node.js + Express Backend API (auth, database, NVIDIA AI, static assets)
#   3. Python + Flask ML Microservice (scikit-learn Random Forest model)
# Runs as a single unified service on Render on $PORT
# ==============================================================================

FROM node:20-bookworm-slim

# Install Python3, pip, and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Install Python ML dependencies
COPY backend/requirements.txt ./backend/
RUN pip3 install --no-cache-dir --break-system-packages -r backend/requirements.txt

# 2. Install Node.js backend dependencies
COPY autisense-backend/package*.json ./autisense-backend/
RUN cd autisense-backend && npm ci --omit=dev

# 3. Install React frontend dependencies and build production bundle
COPY autisense/package*.json ./autisense/
RUN cd autisense && npm ci
COPY autisense/ ./autisense/
RUN cd autisense && npm run build

# 4. Copy backend source codes and models
COPY backend/ ./backend/
COPY autisense-backend/ ./autisense-backend/

# 5. Copy startup script
COPY start.sh ./
RUN chmod +x start.sh

# Render injects $PORT (default 5000 locally)
ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

CMD ["./start.sh"]
