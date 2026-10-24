#!/bin/bash
# Agent Edu 1-Click Startup Script

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "=========================================="
echo " Starting Agent Edu Platform..."
echo "=========================================="

# 1. Check & start Backend (FastAPI on port 8000)
if ! curl -s http://127.0.0.1:8000/api/v1/health > /dev/null 2>&1; then
    echo "Starting Backend on http://127.0.0.1:8000..."
    nohup "$PROJECT_DIR/run_backend.sh" > "$PROJECT_DIR/backend.log" 2>&1 &
    sleep 3
fi

# 2. Check & start Frontend (Next.js on port 3000)
if ! curl -s http://127.0.0.1:3000 > /dev/null 2>&1; then
    echo "Starting Frontend on http://localhost:3000..."
    nohup "$PROJECT_DIR/run_frontend.sh" > "$PROJECT_DIR/frontend.log" 2>&1 &
    sleep 3
fi

echo "=========================================="
echo " Everything is RUNNING!"
echo " Opening http://localhost:3000 in your browser..."
echo "=========================================="

open "http://localhost:3000/student/dashboard"
