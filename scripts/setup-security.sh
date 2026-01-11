#!/bin/bash

# Security Setup Script for Derivative Calculator AI
# This script sets up the D1 database tables for the unified security layer

set -e

echo "🔒 Setting up Security Layer for Derivative Calculator AI"
echo "======================================================"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler is not installed"
    echo "Please install it with: npm install -g wrangler"
    exit 1
fi

# Get database ID from wrangler.toml
DB_NAME=$(grep "database_name" wrangler.toml | head -1 | cut -d'"' -f2)
DB_ID=$(grep "database_id" wrangler.toml | head -1 | cut -d'"' -f2)

echo ""
echo "📊 Database Configuration:"
echo "  Database Name: $DB_NAME"
echo "  Database ID: $DB_ID"
echo ""

# Check if user wants to proceed
read -p "Do you want to proceed with the security setup? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled"
    exit 1
fi

echo ""
echo "🔧 Step 1: Creating security tables..."

# Execute the SQL script
wrangler d1 execute "$DB_NAME" --file=./scripts/security_tables.sql --local

if [ $? -eq 0 ]; then
    echo "✅ Security tables created successfully"
else
    echo "❌ Failed to create security tables"
    exit 1
fi

echo ""
echo "🔧 Step 2: Verifying tables..."

# List tables to verify
echo "Created tables:"
wrangler d1 execute "$DB_NAME" --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" --local

echo ""
echo "✅ Security setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "  1. Deploy your application: npm run build"
echo "  2. Test the security layer: curl https://your-domain.com/api/derivative?equation=x^2"
echo "  3. Monitor abuse: wrangler d1 execute $DB_NAME --command=\"SELECT * FROM ip_blacklist;\" --local"
echo ""
echo "🔒 Security Features Enabled:"
echo "  ✅ IP-based rate limiting (D1 database)"
echo "  ✅ IP blacklist/blocklist for persistent offenders"
echo "  ✅ Enhanced bot detection"
echo "  ✅ Abuse scoring and auto-blocking"
echo "  ✅ Turnstile verification support"
echo ""
