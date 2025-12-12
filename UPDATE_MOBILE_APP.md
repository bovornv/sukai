# Step 8: Update Mobile App

## Option 1: If You Have the Backend URL

Run this command with your Railway URL:

```bash
cd backend
./update-mobile-app.sh https://your-backend-url.railway.app
```

Replace `https://your-backend-url.railway.app` with your actual Railway URL.

## Option 2: Manual Update

If you prefer to update manually, edit `mobile/lib/config/api_config.dart`:

```dart
// Change this line:
static const String prodBaseUrl = 'https://your-backend-url.com/api';

// To your Railway URL:
static const String prodBaseUrl = 'https://your-backend-url.railway.app/api';

// And change:
static const bool isProduction = false;

// To:
static const bool isProduction = true;
```

## Option 3: Find URL First

If you don't have the URL yet:

1. Go to Railway → Service "sukai" → Settings
2. Scroll to "Networking" section
3. Under "Public Domain", copy the URL
4. If no URL, click "Generate Domain"

## After Updating

Rebuild your Flutter app:

```bash
cd mobile
flutter clean
flutter pub get
flutter run
```

## Test

Test your backend:
```bash
curl https://your-backend-url.railway.app/health
```

Should return: `{"status":"ok","timestamp":"..."}`
