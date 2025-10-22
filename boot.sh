#!/bin/bash

echo "========================================="
echo "  Quizlet Learning App - Boot Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed!${NC}"
    echo "Please install Node.js first:"
    echo "  curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -"
    echo "  sudo yum install -y nodejs"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version: $(node --version)${NC}"
echo -e "${GREEN}✓ NPM version: $(npm --version)${NC}"
echo ""

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p data
mkdir -p public
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Check if .env exists, if not create from example
if [ ! -f .env ]; then
    echo -e "${YELLOW}! .env file not found, creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ .env file created${NC}"
        echo -e "${YELLOW}! Please edit .env file and set your SESSION_SECRET${NC}"
        echo ""
    else
        echo -e "${RED}✗ .env.example not found!${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env file exists${NC}"
    echo ""
fi

# Install dependencies
echo "Installing dependencies..."
if npm install --production; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi
echo ""

# Initialize database
echo "Initializing database..."
if npm run init-db; then
    echo -e "${GREEN}✓ Database initialized successfully${NC}"
else
    echo -e "${RED}✗ Failed to initialize database${NC}"
    exit 1
fi
echo ""

# Start the application
echo "========================================="
echo "  Starting Quizlet Learning App..."
echo "========================================="
echo ""
echo -e "${GREEN}Default admin credentials:${NC}"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo -e "${YELLOW}Please change the admin password after first login!${NC}"
echo ""

# Check if PORT is set in .env
PORT=$(grep -E "^PORT=" .env | cut -d '=' -f2)
if [ -z "$PORT" ]; then
    PORT=3000
fi

echo -e "${GREEN}App will be available at: http://localhost:$PORT${NC}"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start
