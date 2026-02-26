#!/bin/bash

# Script tắt app trên EC2 để tiết kiệm memory
# Sử dụng: ./shutdown-ec2.sh

EC2_HOST="16.176.182.214"
EC2_USER="ec2-user"
PEM_FILE="/Users/tuan200/2_LOCAL_NO_PUSH/Qi-app/Qi-app.pem"

echo "========================================="
echo "  Shutting down Qi Learning App on EC2"
echo "========================================="
echo ""

ssh -i "$PEM_FILE" "$EC2_USER@$EC2_HOST" << 'ENDSSH'

echo "1. Stopping PM2 processes..."
if command -v pm2 &> /dev/null; then
    pm2 stop quizlet-app 2>/dev/null || true
    pm2 delete quizlet-app 2>/dev/null || true
    pm2 kill 2>/dev/null || true
    echo "✓ PM2 processes stopped and deleted"
else
    echo "! PM2 not found, skipping..."
fi

echo ""
echo "2. Killing processes on port 80..."
if sudo fuser 80/tcp >/dev/null 2>&1; then
    sudo fuser -k -9 80/tcp
    echo "✓ Port 80 cleared"
else
    PORT_80_PIDS=$(sudo lsof -t -i:80 2>/dev/null)
    if [ -n "$PORT_80_PIDS" ]; then
        sudo kill -9 $PORT_80_PIDS
        echo "✓ Port 80 cleared"
    else
        echo "✓ Port 80 is already free"
    fi
fi

echo ""
echo "3. Killing processes on port 3000..."
if sudo fuser 3000/tcp >/dev/null 2>&1; then
    sudo fuser -k -9 3000/tcp
    echo "✓ Port 3000 cleared"
else
    PORT_3000_PIDS=$(sudo lsof -t -i:3000 2>/dev/null)
    if [ -n "$PORT_3000_PIDS" ]; then
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

ENDSSH

echo ""
echo "✓ App đã được tắt thành công trên EC2!"
echo ""
