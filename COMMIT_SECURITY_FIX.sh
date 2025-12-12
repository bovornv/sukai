#!/bin/bash
# Commit security fix - Remove exposed Supabase keys

echo "🔒 Committing Security Fix"
echo "=========================="
echo ""

# Add all changes
echo "Adding files..."
git add .

# Commit
echo ""
echo "Committing changes..."
git commit -m "Security: Remove exposed Supabase keys from repository

- Replaced all actual keys with placeholders
- Updated .gitignore to prevent future leaks
- Keys must be rotated in Supabase dashboard
- See SECURITY_FIX.md for instructions"

echo ""
echo "✅ Changes committed!"
echo ""
echo "⚠️  IMPORTANT: Before pushing, you MUST:"
echo "   1. Rotate keys in Supabase Dashboard"
echo "   2. Update Railway environment variables with NEW keys"
echo "   3. Update backend/.env with NEW keys"
echo ""
echo "Then push with: git push origin main"
echo ""
echo "See SECURITY_FIX.md for detailed instructions"

