#!/bin/bash

#######################################
# Qi Learning App - Update Deployment Script
# Quick update for code changes
#######################################

set -e  # Exit on any error

echo "========================================="
echo "  Qi Learning App - Update Deployment"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

APP_DIR="$(pwd)"

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
    echo -e "${YELLOW}! No database found (will be created)${NC}"
fi
echo ""

#######################################
# 2. Pull Latest Code (if using git)
#######################################
echo -e "${YELLOW}[2/5] Checking for updates...${NC}"

if [ -d .git ]; then
    echo "Pulling latest changes from git..."
    git pull
    echo -e "${GREEN}✓ Code updated${NC}"
else
    echo -e "${YELLOW}! Not a git repository (manual update)${NC}"
fi
echo ""

#######################################
# 3. Install/Update Dependencies
#######################################
echo -e "${YELLOW}[3/5] Updating dependencies...${NC}"

npm install --production
echo -e "${GREEN}✓ Dependencies updated${NC}"
echo ""

#######################################
# 4. Run Database Migrations (if any)
#######################################
echo -e "${YELLOW}[4/5] Checking database...${NC}"

# Check if database exists, if not initialize
if [ ! -f data/quizlet.db ]; then
    echo "Database not found. Initializing..."
    npm run init-db
    echo -e "${GREEN}✓ Database initialized${NC}"
else
    echo -e "${GREEN}✓ Database exists${NC}"
    echo -e "${BLUE}Note: If schema changed, run migrations manually${NC}"
fi
echo ""

#######################################
# 5. Restart Application
#######################################
echo -e "${YELLOW}[5/5] Restarting application...${NC}"

if command -v pm2 &> /dev/null; then
    # Using PM2
    sudo pm2 restart qi-app
    echo -e "${GREEN}✓ Application restarted with PM2${NC}"
    
    echo ""
    echo -e "${BLUE}Checking status...${NC}"
    sudo pm2 status
else
    echo -e "${YELLOW}! PM2 not found${NC}"
    echo "Please restart the application manually:"
    echo "  npm start"
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
