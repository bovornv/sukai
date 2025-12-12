# How to Preview SukAI Mobile App

## Prerequisites

1. **Flutter SDK** (3.0 or higher)
   - Download: https://flutter.dev/docs/get-started/install
   - Verify: `flutter --version`

2. **Development Environment**
   - **iOS**: macOS with Xcode
   - **Android**: Android Studio or VS Code with Flutter extension

## Quick Start

### Step 1: Install Dependencies

```bash
cd mobile
flutter pub get
```

### Step 2: Check Setup

```bash
flutter doctor
```

Make sure you see:
- ✅ Flutter (Channel stable, version 3.x)
- ✅ Android toolchain (for Android)
- ✅ Xcode (for iOS on macOS)

### Step 3: Run the App

#### Option A: iOS Simulator (macOS only)

```bash
# List available simulators
flutter devices

# Run on iOS simulator
flutter run -d ios

# Or specify a device
flutter run -d "iPhone 15 Pro"
```

#### Option B: Android Emulator

```bash
# List available devices
flutter devices

# Run on Android emulator
flutter run -d android

# Or specify a device
flutter run -d "Pixel_7_API_33"
```

#### Option C: Physical Device

**iOS (iPhone/iPad):**
1. Connect device via USB
2. Trust computer on device
3. Run: `flutter run -d ios`

**Android:**
1. Enable USB debugging on device
2. Connect via USB
3. Run: `flutter run -d android`

### Step 4: Hot Reload

While app is running:
- Press `r` in terminal to hot reload
- Press `R` to hot restart
- Press `q` to quit

## Preview Options

### 1. Web Preview (Fastest)

```bash
flutter run -d chrome
# or
flutter run -d web-server --web-port 8080
```

Then open: `http://localhost:8080`

### 2. iOS Simulator

```bash
# Start iOS Simulator first (optional)
open -a Simulator

# Run app
flutter run -d ios
```

### 3. Android Emulator

```bash
# Start Android Studio
# Open AVD Manager
# Start an emulator

# Run app
flutter run -d android
```

## Troubleshooting

### "No devices found"

**iOS:**
```bash
# Install Xcode command line tools
xcode-select --install

# Open Xcode and accept license
sudo xcodebuild -license accept
```

**Android:**
```bash
# Check Android SDK is installed
flutter doctor --android-licenses

# Start emulator from Android Studio AVD Manager
```

### "Command not found: flutter"

Add Flutter to PATH:
```bash
# Add to ~/.zshrc or ~/.bash_profile
export PATH="$PATH:/path/to/flutter/bin"

# Reload
source ~/.zshrc
```

### Build Errors

```bash
# Clean build
flutter clean
flutter pub get

# Rebuild
flutter run
```

### iOS Build Issues

```bash
# Install CocoaPods dependencies
cd ios
pod install
cd ..

# Try again
flutter run -d ios
```

### Android Build Issues

```bash
# Check Java version (need Java 17+)
java -version

# Update Gradle if needed
cd android
./gradlew --version
```

## Development Tips

### Hot Reload vs Hot Restart

- **Hot Reload (`r`)**: Fast, preserves state
- **Hot Restart (`R`)**: Slower, resets state
- **Full Restart**: Stop and run again

### Debug Mode

```bash
# Run in debug mode (default)
flutter run

# Run in release mode (faster, no debugging)
flutter run --release
```

### View Logs

```bash
# iOS
flutter logs

# Android
flutter logs
```

### Check for Errors

```bash
flutter analyze
```

## Preview Without Backend

The app has **mock fallbacks** built-in, so you can preview it without the backend running:

1. Start the app: `flutter run`
2. The app will use mock responses if backend is unavailable
3. All features work for preview/testing

## Preview With Backend

1. **Terminal 1**: Start backend
   ```bash
   cd backend
   npm start
   ```

2. **Terminal 2**: Start mobile app
   ```bash
   cd mobile
   flutter run
   ```

3. App will connect to `http://localhost:3000/api`

## Common Commands

```bash
# List all devices
flutter devices

# Run on specific device
flutter run -d <device-id>

# Build APK (Android)
flutter build apk

# Build iOS app
flutter build ios

# Run tests
flutter test

# Check code
flutter analyze
```

## Recommended Setup

### VS Code
1. Install Flutter extension
2. Open `mobile/` folder
3. Press `F5` to run
4. Select device when prompted

### Android Studio
1. Open `mobile/` folder
2. Click Run button
3. Select device/emulator

## Quick Test Flow

1. ✅ `flutter pub get` - Install dependencies
2. ✅ `flutter doctor` - Check setup
3. ✅ `flutter devices` - See available devices
4. ✅ `flutter run` - Start app
5. ✅ Test features:
   - Home page → Start symptom check
   - Chat → Enter symptom
   - Summary → View results
   - Follow-up → Track symptoms
   - Billing → View plans

## Need Help?

- Flutter docs: https://flutter.dev/docs
- Troubleshooting: `flutter doctor -v`
- Check logs: `flutter logs`
