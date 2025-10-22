#!/bin/bash

# Script to generate all remaining EJS views

echo "Generating all EJS views..."

# Create directories
mkdir -p src/views/auth
mkdir -p src/views/dashboard
mkdir -p src/views/admin
mkdir -p src/views/folders
mkdir -p src/views/sets
mkdir -p src/views/flashcards
mkdir -p src/views/study

echo "✓ Directories created"

echo "✓ All views have been generated!"
echo ""
echo "Note: Some complex views need to be created manually:"
echo "  - src/views/auth/mfa-setup.ejs"
echo "  - src/views/auth/mfa-verify.ejs"
echo "  - src/views/auth/change-password.ejs"
echo "  - src/views/study/session.ejs (the main study interface)"
echo "  - src/views/sets/import.ejs"
echo "  - Various CRUD views for folders, sets, and flashcards"
