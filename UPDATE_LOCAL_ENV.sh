#!/bin/bash
# Helper script to update local .env file with new Supabase keys

echo "💾 Update Local .env File"
echo "========================="
echo ""

ENV_FILE="backend/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  .env file not found at $ENV_FILE"
    echo "Creating new .env file..."
    mkdir -p backend
fi

echo "⚠️  IMPORTANT: Rotate keys in Supabase FIRST!"
echo "   Get NEW keys from: https://supabase.com/dashboard/project/uuuqpiaclmleclsylfqh/settings/api"
echo ""

# Prompt for new keys
read -p "Enter NEW Supabase Anon Key: " NEW_ANON_KEY
read -p "Enter NEW Supabase Service Role Key: " NEW_SERVICE_KEY

if [ -z "$NEW_ANON_KEY" ] || [ -z "$NEW_SERVICE_KEY" ]; then
    echo "❌ Keys cannot be empty!"
    exit 1
fi

# Create/update .env file
cat > "$ENV_FILE" << EOF
# Server Configuration
PORT=3000

# Supabase Configuration
SUPABASE_URL=https://uuuqpiaclmleclsylfqh.supabase.co
SUPABASE_ANON_KEY=$NEW_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$NEW_SERVICE_KEY

# Environment
NODE_ENV=development
EOF

echo ""
echo "✅ .env file updated at $ENV_FILE"
echo ""
echo "⚠️  Remember: .env is in .gitignore and won't be committed"
echo ""

