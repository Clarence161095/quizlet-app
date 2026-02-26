#!/bin/bash

#######################################
# Qi Learning App - Update Deployment Script
#######################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

echo "========================================="
echo "  Qi Learning App - Update Deployment"
echo "========================================="
echo ""
echo -e "${BLUE}Updating application at: ${APP_DIR}${NC}"
echo ""

#######################################
# 1. Backup Database
#######################################
echo -e "${YELLOW}[1/6] Backing up database...${NC}"

if [ -f data/quizlet.db ]; then
    BACKUP_FILE="data/quizlet.db.backup-$(date +%Y%m%d-%H%M%S)"
    cp data/quizlet.db "$BACKUP_FILE"
    echo -e "${GREEN}✓ Database backed up to: $BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}! No database found (will be created on first start)${NC}"
fi
echo ""

#######################################
# 2. Stop all & kill port
#######################################
echo -e "${YELLOW}[2/6] Shutting down existing processes...${NC}"

# Determine app port from .env (default 80)
APP_PORT=80
if [ -f .env ]; then
    DOTENV_PORT=$(grep -E '^PORT=' .env | cut -d'=' -f2 | tr -d '[:space:]')
    if [ -n "$DOTENV_PORT" ]; then
        APP_PORT="$DOTENV_PORT"
    fi
fi

# Stop PM2 from BOTH current user AND root (two separate pm2 daemons)
pm2 delete qi-app > /dev/null 2>&1 && echo "  ✓ PM2 (user) process stopped" || true
sudo pm2 delete qi-app > /dev/null 2>&1 && echo "  ✓ PM2 (root) process stopped" || true

# Kill ALL node processes running this app (both user and root)
sudo pkill -9 -f "src/server.js" > /dev/null 2>&1 && echo "  ✓ Killed node server processes" || true

sleep 1

# Hard kill anything still on the port
if sudo fuser -k -9 "${APP_PORT}/tcp" > /dev/null 2>&1; then
    echo "  ✓ Killed remaining processes on port $APP_PORT"
else
    echo "  i Port $APP_PORT was already free"
fi

# Wait and double-verify port is free
sleep 2
if sudo fuser "${APP_PORT}/tcp" > /dev/null 2>&1; then
    echo -e "${RED}  ✗ Port $APP_PORT still in use - forcing kill...${NC}"
    sudo fuser -k -9 "${APP_PORT}/tcp" > /dev/null 2>&1 || true
    sleep 2
fi

echo -e "${GREEN}✓ Shutdown complete${NC}"
echo ""

#######################################
# 3. Pull Latest Code
#######################################
echo -e "${YELLOW}[3/6] Syncing code with remote...${NC}"

if [ -d .git ]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo "Current branch: $BRANCH"
    git fetch origin
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse "origin/$BRANCH")
    if [ "$LOCAL" = "$REMOTE" ]; then
        echo -e "${BLUE}i Already up to date ($(git rev-parse --short HEAD))${NC}"
    fi
    git reset --hard "origin/$BRANCH"
    echo -e "${GREEN}✓ Code synced to: $(git rev-parse --short HEAD) - $(git log -1 --pretty=%s)${NC}"
else
    echo -e "${YELLOW}! Not a git repository (manual update)${NC}"
fi
echo ""

#######################################
# 4. Install Dependencies
#######################################
echo -e "${YELLOW}[4/6] Updating dependencies...${NC}"

npm install --omit=dev 2>&1 | grep -v "^npm warn"
echo -e "${GREEN}✓ Dependencies updated${NC}"
echo ""

#######################################
# 5. Check Database
#######################################
echo -e "${YELLOW}[5/6] Checking database...${NC}"

if [ ! -f data/quizlet.db ]; then
    echo "Database not found. Initializing..."
    node src/database/init.js
    echo -e "${GREEN}✓ Database initialized${NC}"
else
    echo -e "${GREEN}✓ Database exists - data preserved${NC}"
fi
echo ""

#######################################
# 6. Start Application
#######################################
echo -e "${YELLOW}[6/6] Starting application on port $APP_PORT...${NC}"

if command -v pm2 &> /dev/null; then
    # Clear old logs so "Recent logs" shows only fresh output
    sudo rm -f data/pm2.log /root/.pm2/logs/qi-app-out.log /root/.pm2/logs/qi-app-error.log 2>/dev/null || true

    # Pass PORT explicitly so app always starts on the right port regardless of .env
    sudo PORT="$APP_PORT" pm2 start src/server.js \
        --name qi-app \
        --cwd "$APP_DIR" \
        --log data/pm2.log \
        --merge-logs \
        --restart-delay=2000 \
        --max-restarts=5

    sudo pm2 save
    echo -e "${GREEN}✓ Application started with PM2${NC}"

    # Wait for app to be ready (up to 15s)
    echo -n "Waiting for app to be ready"
    for i in $(seq 1 15); do
        sleep 1
        echo -n "."
        STATUS=$(sudo pm2 jlist 2>/dev/null | python3 -c "
import sys, json
try:
    procs = json.load(sys.stdin)
    p = next((x for x in procs if x['name']=='qi-app'), None)
    print(p['pm2_env']['status'] if p else 'not_found')
except:
    print('unknown')
" 2>/dev/null || echo "unknown")
        if [ "$STATUS" = "online" ]; then
            echo ""
            echo -e "${GREEN}✓ App is online!${NC}"
            break
        fi
    done

    # Verify port is actually listening
    sleep 1
    if sudo fuser "${APP_PORT}/tcp" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Port $APP_PORT is listening - deploy successful!${NC}"
    else
        echo -e "${RED}✗ Port $APP_PORT is NOT listening - check logs below${NC}"
    fi

    echo ""
    echo -e "${BLUE}Final PM2 status:${NC}"
    sudo pm2 status

    echo ""
    echo -e "${BLUE}Recent logs:${NC}"
    sudo pm2 logs qi-app --lines 8 --nostream 2>/dev/null || true
else
    echo -e "${YELLOW}! PM2 not found. Starting directly...${NC}"
    nohup node src/server.js > data/app.log 2>&1 &
    echo -e "${GREEN}✓ App started (PID: $!)${NC}"
fi
echo ""

#######################################
# Done
#######################################
echo "========================================="
echo -e "${GREEN}  ✓ Update Complete!${NC}"
echo "========================================="
echo ""
echo -e "${BLUE}App is running on port: ${APP_PORT}${NC}"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  sudo pm2 logs qi-app      - View logs"
echo "  sudo pm2 monit            - Monitor resources"  
echo "  sudo pm2 restart qi-app   - Restart app"
echo "  sh update-deploy.sh       - Deploy again"
echo ""
echo -e "${BLUE}Backup Files:${NC}"
echo "  Location: ${APP_DIR}/data/"
echo "  Pattern: quizlet.db.backup-*"
echo ""
if [ -n "$BACKUP_FILE" ]; then
    echo -e "${YELLOW}To restore DB if needed:${NC}"
    echo "  cp $BACKUP_FILE data/quizlet.db && sudo pm2 restart qi-app"
    echo ""
fi
echo -e "${GREEN}Done! 🚀${NC}"
echo ""

