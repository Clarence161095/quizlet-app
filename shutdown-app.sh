#!/bin/bash

echo "========================================="
echo "  Shutting down Qi Learning App"
echo "========================================="
echo ""

# 1. Stop PM2 processes
if command -v pm2 &> /dev/null; then
    echo "Stopping PM2 processes..."
    pm2 stop quizlet-app 2>/dev/null || true
    pm2 delete quizlet-app 2>/dev/null || true
    
    # Optional: kill PM2 daemon completely to save more memory
    pm2 kill 2>/dev/null || true
    echo "✓ PM2 processes stopped and deleted"
else
    echo "! PM2 not found, skipping..."
fi

# 2. Kill processes on port 80
echo "Checking port 80..."
if sudo fuser 80/tcp >/dev/null 2>&1; then
    echo "Killing processes on port 80..."
    sudo fuser -k -9 80/tcp
    echo "✓ Port 80 cleared"
else
    # Fallback to lsof if fuser is not available
    PORT_80_PIDS=$(sudo lsof -t -i:80 2>/dev/null)
    if [ -n "$PORT_80_PIDS" ]; then
        echo "Killing processes on port 80 (PIDs: $PORT_80_PIDS)..."
        sudo kill -9 $PORT_80_PIDS
        echo "✓ Port 80 cleared"
    else
        echo "✓ Port 80 is already free"
    fi
fi

# 3. Kill processes on port 3000
echo "Checking port 3000..."
if sudo fuser 3000/tcp >/dev/null 2>&1; then
    echo "Killing processes on port 3000..."
    sudo fuser -k -9 3000/tcp
    echo "✓ Port 3000 cleared"
else
    # Fallback to lsof if fuser is not available
    PORT_3000_PIDS=$(sudo lsof -t -i:3000 2>/dev/null)
    if [ -n "$PORT_3000_PIDS" ]; then
        echo "Killing processes on port 3000 (PIDs: $PORT_3000_PIDS)..."
        sudo kill -9 $PORT_3000_PIDS
        echo "✓ Port 3000 cleared"
    else
        echo "✓ Port 3000 is already free"
    fi
fi

echo ""
echo "========================================="
echo "  ✓ Shutdown Complete! Memory freed."
echo "========================================="
