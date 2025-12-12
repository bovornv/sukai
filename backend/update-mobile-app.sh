#!/bin/bash
# Update Mobile App with Production URL
# Usage: ./update-mobile-app.sh https://your-backend-url.railway.app

if [ -z "$1" ]; then
    echo "Usage: ./update-mobile-app.sh https://your-backend-url.railway.app"
    exit 1
fi

BACKEND_URL="$1"
# Remove trailing slash if present
BACKEND_URL="${BACKEND_URL%/}"
# Add /api if not present
if [[ ! "$BACKEND_URL" == *"/api" ]]; then
    BACKEND_URL="${BACKEND_URL}/api"
fi

MOBILE_CONFIG="../mobile/lib/config/api_config.dart"

if [ ! -f "$MOBILE_CONFIG" ]; then
    echo "❌ Mobile config file not found: $MOBILE_CONFIG"
    exit 1
fi

echo "📱 Updating mobile app configuration..."
echo "Backend URL: $BACKEND_URL"
echo ""

# Create backup
cp "$MOBILE_CONFIG" "${MOBILE_CONFIG}.backup"
echo "✅ Backup created: ${MOBILE_CONFIG}.backup"

# Update the file
sed -i '' "s|static const String prodBaseUrl = 'https://your-backend-url.com/api';|static const String prodBaseUrl = '$BACKEND_URL';|g" "$MOBILE_CONFIG"
sed -i '' "s|static const bool isProduction = false;|static const bool isProduction = true;|g" "$MOBILE_CONFIG"

echo "✅ Updated prodBaseUrl: $BACKEND_URL"
echo "✅ Set isProduction = true"
echo ""
echo "📱 Next steps:"
echo "   cd ../mobile"
echo "   flutter clean"
echo "   flutter pub get"
echo "   flutter run"

