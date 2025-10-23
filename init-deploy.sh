#!/bin/bash

#######################################
# Qi Learning App - Initial Deployment Script
# For AWS EC2 Free Tier (Amazon Linux 2 / Ubuntu)
#######################################

set -e  # Exit on any error

echo "========================================="
echo "  Qi Learning App - Initial Deployment"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="$(pwd)"
APP_USER="$(whoami)"
PORT=80

echo -e "${BLUE}Starting deployment at: ${APP_DIR}${NC}"
echo -e "${BLUE}Running as user: ${APP_USER}${NC}"
echo ""

#######################################
# 1. Check Node.js Installation
#######################################
echo -e "${YELLOW}[1/8] Checking Node.js...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found!${NC}"
    echo "Installing Node.js 18 LTS..."
    
    # Detect OS
    if [ -f /etc/redhat-release ]; then
        # Amazon Linux 2 / CentOS
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    elif [ -f /etc/lsb-release ]; then
        # Ubuntu
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
        sudo apt-get install -y nodejs
    else
        echo -e "${RED}✗ Unsupported OS. Please install Node.js manually.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Node.js $(node --version) installed${NC}"
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found!${NC}"
    exit 1
else
    echo -e "${GREEN}✓ npm $(npm --version) installed${NC}"
fi
echo ""

#######################################
# 2. Install Dependencies
#######################################
echo -e "${YELLOW}[2/8] Installing dependencies...${NC}"

npm install --production
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

#######################################
# 3. Create Directories
#######################################
echo -e "${YELLOW}[3/8] Creating directories...${NC}"

mkdir -p data
mkdir -p public
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

#######################################
# 4. Setup Environment File
#######################################
echo -e "${YELLOW}[4/8] Setting up environment...${NC}"

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        
        # Generate random session secret
        SESSION_SECRET=$(openssl rand -base64 32)
        sed -i "s/your-secret-key-here-change-this-in-production/$SESSION_SECRET/g" .env
        sed -i "s/PORT=3000/PORT=$PORT/g" .env
        sed -i "s/NODE_ENV=development/NODE_ENV=production/g" .env
        
        echo -e "${GREEN}✓ .env file created with random SESSION_SECRET${NC}"
    else
        echo -e "${RED}✗ .env.example not found!${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi
echo ""

#######################################
# 5. Initialize Database
#######################################
echo -e "${YELLOW}[5/8] Initializing database...${NC}"

if [ -f data/quizlet.db ]; then
    echo -e "${YELLOW}! Database already exists. Creating backup...${NC}"
    cp data/quizlet.db data/quizlet.db.backup-$(date +%Y%m%d-%H%M%S)
    echo -e "${GREEN}✓ Backup created${NC}"
fi

npm run init-db
echo -e "${GREEN}✓ Database initialized${NC}"
echo ""

#######################################
# 6. Install PM2 (Process Manager)
#######################################
echo -e "${YELLOW}[6/8] Installing PM2...${NC}"

if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo -e "${GREEN}✓ PM2 installed${NC}"
else
    echo -e "${GREEN}✓ PM2 already installed${NC}"
fi
echo ""

#######################################
# 7. Configure Firewall (Port 80)
#######################################
echo -e "${YELLOW}[7/8] Configuring firewall...${NC}"

# Check if firewall is active
if command -v firewall-cmd &> /dev/null; then
    # CentOS/Amazon Linux with firewalld
    sudo firewall-cmd --permanent --add-port=$PORT/tcp
    sudo firewall-cmd --reload
    echo -e "${GREEN}✓ Firewall configured (firewalld)${NC}"
elif command -v ufw &> /dev/null; then
    # Ubuntu with ufw
    sudo ufw allow $PORT/tcp
    echo -e "${GREEN}✓ Firewall configured (ufw)${NC}"
else
    echo -e "${YELLOW}! No firewall detected (manual configuration may be needed)${NC}"
fi

echo -e "${BLUE}Note: Make sure AWS Security Group allows inbound traffic on port $PORT${NC}"
echo ""

#######################################
# 8. Start Application with PM2
#######################################
echo -e "${YELLOW}[8/8] Starting application...${NC}"

# Stop existing process if any
pm2 delete qi-app 2>/dev/null || true

# Start app with PM2
sudo pm2 start src/server.js --name qi-app

# Save PM2 process list
sudo pm2 save

# Setup PM2 to start on boot
sudo pm2 startup systemd -u $APP_USER --hp /home/$APP_USER

echo -e "${GREEN}✓ Application started with PM2${NC}"
echo ""

#######################################
# Deployment Complete
#######################################
echo "========================================="
echo -e "${GREEN}  ✓ Deployment Complete!${NC}"
echo "========================================="
echo ""
echo -e "${BLUE}Application Information:${NC}"
echo "  URL: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):$PORT"
echo "  Port: $PORT"
echo "  Environment: production"
echo ""
echo -e "${BLUE}Default Admin Credentials:${NC}"
echo "  Username: admin"
echo "  Password: admin123"
echo -e "${RED}  ⚠️  CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN!${NC}"
echo ""
echo -e "${BLUE}Useful PM2 Commands:${NC}"
echo "  pm2 status          - Check app status"
echo "  pm2 logs qi-app     - View logs"
echo "  pm2 restart qi-app  - Restart app"
echo "  pm2 stop qi-app     - Stop app"
echo "  pm2 monit           - Monitor resources"
echo ""
echo -e "${BLUE}Database Location:${NC}"
echo "  Main DB: ${APP_DIR}/data/quizlet.db"
echo "  Sessions: ${APP_DIR}/data/sessions.db"
echo ""
echo -e "${BLUE}Backup Database:${NC}"
echo "  cp data/quizlet.db data/backup-\$(date +%Y%m%d).db"
echo ""
echo -e "${YELLOW}Don't forget to:${NC}"
echo "  1. Configure AWS Security Group to allow port $PORT"
echo "  2. Login and change admin password"
echo "  3. Setup MFA for admin account"
echo "  4. Setup daily database backups (see DEPLOYMENT.md)"
echo ""
echo -e "${GREEN}Happy learning! 🚀${NC}"
echo ""
