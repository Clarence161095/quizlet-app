#!/bin/bash

echo "=================================="
echo "  Qi App - Structure Check"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js: $(node --version)"
else
    echo -e "${RED}✗${NC} Node.js not found"
fi

# Check npm
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓${NC} npm: $(npm --version)"
else
    echo -e "${RED}✗${NC} npm not found"
fi

echo ""
echo "Checking directory structure..."
echo ""

# Check directories
dirs=(
    "src"
    "src/config"
    "src/database"
    "src/middleware"
    "src/models"
    "src/routes"
    "src/views"
    "src/views/auth"
    "src/views/dashboard"
    "src/views/admin"
    "src/views/folders"
    "src/views/sets"
    "src/views/flashcards"
    "src/views/study"
    "data"
    "public"
)

for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $dir/"
    else
        echo -e "${RED}✗${NC} $dir/ (missing)"
    fi
done

echo ""
echo "Checking key files..."
echo ""

# Check files
files=(
    "package.json"
    ".env"
    ".gitignore"
    "boot.sh"
    "README.md"
    "src/server.js"
    "src/database/init.js"
    "src/config/passport.js"
    "src/models/User.js"
    "src/models/Set.js"
    "src/models/Flashcard.js"
    "src/routes/auth.js"
    "src/routes/sets.js"
    "src/views/layout.ejs"
    "src/views/auth/login.ejs"
    "src/views/dashboard/index.ejs"
    "src/views/study/session.ejs"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (missing)"
    fi
done

echo ""
echo "Checking package.json dependencies..."
echo ""

if [ -f "package.json" ]; then
    if grep -q "express" package.json; then
        echo -e "${GREEN}✓${NC} Express.js"
    fi
    if grep -q "better-sqlite3" package.json; then
        echo -e "${GREEN}✓${NC} SQLite3"
    fi
    if grep -q "passport" package.json; then
        echo -e "${GREEN}✓${NC} Passport.js"
    fi
    if grep -q "speakeasy" package.json; then
        echo -e "${GREEN}✓${NC} Speakeasy (MFA)"
    fi
fi

echo ""
echo "Checking node_modules..."
echo ""

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Dependencies not installed. Run: npm install"
fi

echo ""
echo "Checking database..."
echo ""

if [ -f "data/quizlet.db" ]; then
    echo -e "${GREEN}✓${NC} Database exists"
else
    echo -e "${YELLOW}⚠${NC} Database not initialized. Run: npm run init-db"
fi

echo ""
echo "=================================="
echo "  Summary"
echo "=================================="
echo ""

# Count files
total_files=$(find src -type f -name "*.js" | wc -l)
total_views=$(find src/views -type f -name "*.ejs" 2>/dev/null | wc -l)

echo "JavaScript files: $total_files"
echo "EJS views: $total_views"

echo ""
echo "Next steps:"
echo "  1. Run 'npm install' if not done"
echo "  2. Run 'npm run init-db' to create database"
echo "  3. Run 'npm start' to start the server"
echo "  4. Open http://localhost:3000 in browser"
echo "  5. Login with admin/admin123"
echo ""
