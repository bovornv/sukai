# Update Mobile App After Deployment

## After You Deploy Backend

Once Railway gives you a backend URL (e.g., `https://sukai-backend-production.up.railway.app`):

### Step 1: Update API Config

Edit `mobile/lib/config/api_config.dart`:

```dart
class ApiConfig {
  // Development
  static const String devBaseUrl = 'http://localhost:3000/api';
  
  // Production - UPDATE THIS with your Railway URL
  static const String prodBaseUrl = 'https://your-backend-url.railway.app/api';
  
  // Current environment - SET TO TRUE for production
  static const bool isProduction = true; // ← Change this to true
  
  /// Get the current base URL based on environment
  static String get baseUrl {
    return isProduction ? prodBaseUrl : devBaseUrl;
  }
  
  /// Get the full backend URL (without /api)
  static String get backendUrl {
    final url = baseUrl.replaceAll('/api', '');
    return url;
  }
}
```

**Important**: 
- Replace `your-backend-url.railway.app` with your actual Railway URL
- Set `isProduction = true`

### Step 2: Test Connection

```bash
cd mobile
flutter run
```

Test the app:
1. Try triage feature
2. Try chat feature
3. Try billing feature

All should connect to your production backend!

### Step 3: Verify

Check that API calls are going to production:
- Look at Railway logs: `railway logs`
- You should see requests coming in
- Check Supabase dashboard for data being saved

## Quick Update Script

After deployment, run:

```bash
# Get your Railway URL
railway domain

# Then update mobile/lib/config/api_config.dart manually
# Or use this template:
```

Replace in `api_config.dart`:
- `prodBaseUrl` = `https://YOUR-RAILWAY-URL/api`
- `isProduction` = `true`

## Troubleshooting

**App can't connect?**
- Check Railway URL is correct
- Verify backend is running: `curl https://your-url/health`
- Check Railway logs: `railway logs`

**Still using localhost?**
- Make sure `isProduction = true`
- Rebuild app: `flutter clean && flutter pub get && flutter run`

**CORS errors?**
- Backend CORS is already configured
- If issues, check Railway logs

## Done!

Your mobile app is now connected to production backend! 🎉

