#!/bin/bash
# Push code to GitHub for Railway deployment

set -e

echo "🚀 Pushing code to GitHub"
echo "========================"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    echo "✅ Git initialized"
    echo ""
fi

# Add all files
echo "Adding files..."
git add .
echo "✅ Files added"
echo ""

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "⚠️  No changes to commit"
    echo "Checking if remote exists..."
else
    echo "Committing changes..."
    git commit -m "Initial commit - SukAI backend and mobile app"
    echo "✅ Changes committed"
    echo ""
fi

# Check if remote exists
if git remote get-url origin &>/dev/null; then
    echo "✅ Remote 'origin' already exists"
    REMOTE_URL=$(git remote get-url origin)
    echo "   URL: $REMOTE_URL"
else
    echo "⚠️  No remote configured"
    echo ""
    echo "Please add your GitHub remote:"
    echo "  git remote add origin https://github.com/bovornv/ukai.git"
    echo ""
    read -p "Enter your GitHub repository URL (or press Enter to skip): " REPO_URL
    
    if [ ! -z "$REPO_URL" ]; then
        git remote add origin "$REPO_URL"
        echo "✅ Remote added"
    else
        echo "⚠️  Skipping remote setup"
        echo "Please add remote manually:"
        echo "  git remote add origin https://github.com/bovornv/ukai.git"
        exit 1
    fi
fi

echo ""
echo "Pushing to GitHub..."
echo ""

# Get current branch name
BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

# Push to GitHub
if git push -u origin "$BRANCH" 2>&1; then
    echo ""
    echo "✅ Code pushed to GitHub!"
    echo ""
    echo "Next steps:"
    echo "1. Go back to Railway dashboard"
    echo "2. Refresh the page or redeploy"
    echo "3. Railway will detect your code and deploy"
else
    echo ""
    echo "⚠️  Push failed"
    echo ""
    echo "Possible reasons:"
    echo "- Repository doesn't exist on GitHub"
    echo "- Authentication required"
    echo "- Branch name mismatch"
    echo ""
    echo "Try manually:"
    echo "  git push -u origin main"
fi

