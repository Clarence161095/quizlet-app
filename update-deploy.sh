#!/bin/bash

#######################################
# Qi Learning App - Update Deployment Script
# Quick update for code changes
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
echo -e "${YELLOW}[1/5] Backing up database...${NC}"

if [ -f data/quizlet.db ]; then
    BACKUP_FILE="data/quizlet.db.backup-$(date +%Y%m%d-%H%M%S)"
    cp data/quizlet.db "$BACKUP_FILE"
    echo -e "${GREEN}✓ Database backed up to: $BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}! No database found (will be created on first start)${NC}"
fi
echo ""

#######################################
# 2. Pull Latest Code (force sync with remote)
#######################################
echo -e "${YELLOW}[2/5] Syncing code with remote...${NC}"

if [ -d .git ]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo "Current branch: $BRANCH"

    git fetch origin
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse "origin/$BRANCH")

    if [ "$LOCAL" = "$REMOTE" ]; then
        echo -e "${BLUE}i Already up to date ($(git rev-parse --short HEAD))${NC}"
    else
        echo "Changes found - updating..."
    fi

    # Hard reset to ensure working directory exactly matches remote
    # (removes any untracked/modified files that shouldn't be there)
    git reset --hard "origin/$BRANCH"
    echo -e "${GREEN}✓ Code synced to: $(git rev-parse --short HEAD) - $(git log -1 --pretty=%s)${NC}"
else
    echo -e "${YELLOW}! Not a git repository (manual update)${NC}"
fi
echo ""

#######################################
# 3. Install/Update Dependencies
#######################################
echo -e "${YELLOW}[3/5] Updating dependencies...${NC}"

npm install --omit=dev 2>&1 | grep -v "^npm warn"
echo -e "${GREEN}✓ Dependencies updated${NC}"
echo ""

#######################################
# 4. Check Database
#######################################
echo -e "${YELLOW}[4/5] Checking database...${NC}"

if [ ! -f data/quizlet.db ]; then
    echo "Database not found. Initializing..."
    node src/database/init.js
    echo -e "${GREEN}✓ Database initialized${NC}"
else
    echo -e "${GREEN}✓ Database exists - data preserved${NC}"
fi
echo ""

#######################################
# 5. Restart Application & Verify
#######################################
echo -e "${YELLOW}[5/5] Restarting application...${NC}"

if command -v pm2 &> /dev/null; then
    # Stop old process completely first to ensure fresh code load
    if sudo pm2 describe qi-app > /dev/null 2>&1; then
        sudo pm2 delete qi-app > /dev/null 2>&1
        echo "Stopped old process."
    fi

    # Start fresh with updated code
    sudo pm2 start src/server.js \
        --name qi-app \
        --log data/pm2.log \
        --merge-logs \
        --restart-delay=1000 \
        --max-restarts=5

    sudo pm2 save
    echo -e "${GREEN}✓ Application started with PM2${NC}"

    # Wait for app to be ready
    echo -n "Waiting for app to be ready"
    for i in $(seq 1 10); do
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

    echo ""
    echo -e "${BLUE}Final status:${NC}"
    sudo pm2 status

    # Show last few log lines to confirm no errors
    echo ""
    echo -e "${BLUE}Recent logs:${NC}"
    sudo pm2 logs qi-app --lines 5 --nostream 2>/dev/null || true
else
    echo -e "${YELLOW}! PM2 not found${NC}"
    echo "Please restart the application manually: npm start"
fi
echo ""

#######################################
# Update Complete
#######################################
echo "========================================="
echo -e "${GREEN}  ✓ Update Complete!${NC}"
echo "========================================="
echo ""
echo -e "${BLUE}What was updated:${NC}"
echo "  ✓ Database backed up"
echo "  ✓ Code updated (if using git)"
echo "  ✓ Dependencies updated"
echo "  ✓ Application restarted"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  pm2 logs qi-app     - View application logs"
echo "  pm2 monit           - Monitor resources"
echo "  pm2 restart qi-app  - Restart if needed"
echo ""
echo -e "${BLUE}Backup Files:${NC}"
echo "  Location: ${APP_DIR}/data/"
echo "  Pattern: quizlet.db.backup-*"
echo ""
echo -e "${YELLOW}If you encounter issues:${NC}"
echo "  1. Check logs: pm2 logs qi-app"
echo "  2. Restore backup if needed: cp $BACKUP_FILE data/quizlet.db"
echo "  3. Restart: pm2 restart qi-app"
echo ""
echo -e "${GREEN}Done! 🚀${NC}"
echo ""
