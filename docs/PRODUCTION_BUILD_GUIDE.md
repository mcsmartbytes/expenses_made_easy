# Production Build Guide - Expenses Made Easy

## Overview

This guide walks you through building production-ready Android (APK/AAB) and iOS (IPA) builds for submission to Google Play Store and Apple App Store.

**Build System**: Expo Application Services (EAS Build)
**Current Version**: 1.0.0

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [EAS Build Setup](#eas-build-setup)
3. [Environment Configuration](#environment-configuration)
4. [Building for Android](#building-for-android)
5. [Building for iOS](#building-for-ios)
6. [Testing Builds](#testing-builds)
7. [Store Submission](#store-submission)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Accounts Required

**✅ Already Have**:
- [x] Expo account (projectId: 2664d0c4-c677-4c37-a98c-eff69dce2a3d)
- [x] Supabase account (database configured)

**⏭️ Need for Store Submission**:
- [ ] Google Play Console account ($25 one-time fee)
- [ ] Apple Developer account ($99/year) - Only if publishing to iOS

### 2. Software Requirements

```bash
# Check Node.js version (16+ required)
node --version

# Check npm version
npm --version

# Check Expo CLI
npx expo --version
```

### 3. Install EAS CLI

```bash
# Install globally
npm install -g eas-cli

# Verify installation
eas --version

# Login to Expo
eas login
```

---

## EAS Build Setup

### Step 1: Initialize EAS Configuration

```bash
cd /home/mcsmart/projects/active/expenses_made_easy

# Configure EAS for your project
eas build:configure
```

This creates `eas.json` with build profiles.

### Step 2: Verify eas.json Configuration

The file should look like this:

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

**Build Profiles Explained**:
- **development**: For testing with dev tools
- **preview**: For internal testing (APK for easy installation)
- **production**: For store submission (AAB for Play Store, IPA for App Store)

---

## Environment Configuration

### Step 1: Create app.config.js (Dynamic Configuration)

If you need environment-specific settings, replace `app.json` with `app.config.js`:

```javascript
// app.config.js
export default {
  expo: {
    name: "Expenses Made Easy",
    slug: "expenses_made_easy",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow Expenses Made Easy to use your location to track mileage.",
          locationAlwaysPermission: "Allow Expenses Made Easy to use your location in the background for accurate mileage tracking.",
          locationWhenInUsePermission: "Allow Expenses Made Easy to use your location to track mileage.",
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true
        }
      ]
    ],
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#F0FDFA"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mcsmart.expensesmadeeasy",
      infoPlist: {
        NSCameraUsageDescription: "Allow Expenses Made Easy to use your camera to scan receipts.",
        NSPhotoLibraryUsageDescription: "Allow Expenses Made Easy to access your photos to upload receipts."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION"
      ],
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.mcsmart.expensesmadeeasy",
      versionCode: 1
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "2664d0c4-c677-4c37-a98c-eff69dce2a3d"
      }
    }
  }
};
```

### Step 2: Environment Variables (if needed)

Create `.env` file for secrets (never commit this!):

```bash
# .env
SUPABASE_URL=https://vckynnyputrvwjhosryl.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

Add to `.gitignore`:
```
.env
.env.local
.env.production
```

**For EAS Build, add to eas.json**:
```json
{
  "build": {
    "production": {
      "env": {
        "SUPABASE_URL": "https://vckynnyputrvwjhosryl.supabase.co",
        "SUPABASE_ANON_KEY": "your_key_here"
      }
    }
  }
}
```

---

## Building for Android

### Option 1: APK (For Testing)

**APK** = Android Package (easy to install, not for Play Store)

```bash
# Build APK for testing
eas build --platform android --profile preview

# This will:
# 1. Upload your code to EAS servers
# 2. Build the APK in the cloud
# 3. Provide download link when complete
```

**Build Time**: ~10-15 minutes

**Output**: Download link to `.apk` file

**Install APK**:
```bash
# Download from EAS
# Transfer to Android device
# Enable "Install from Unknown Sources"
# Install APK
```

---

### Option 2: AAB (For Play Store)

**AAB** = Android App Bundle (optimized for Play Store)

```bash
# Build AAB for production
eas build --platform android --profile production

# This will:
# 1. Create optimized build
# 2. Sign with keystore
# 3. Generate .aab file for Play Store
```

**Build Time**: ~10-15 minutes

**Output**: Download link to `.aab` file

**What EAS Handles Automatically**:
- ✅ Keystore generation and management
- ✅ App signing
- ✅ Version code incrementation
- ✅ Proguard/R8 optimization
- ✅ Native library stripping

---

### Android Keystore (Important!)

EAS automatically generates and manages your keystore:

```bash
# View keystore details
eas credentials

# Download keystore (for backup)
eas credentials -p android
```

**⚠️ CRITICAL**: Back up your keystore! Without it, you can't update your app.

**Backup Location**:
```
EAS automatically stores in cloud
Download manually: eas credentials -p android
Save to secure location (1Password, LastPass, etc.)
```

---

## Building for iOS

### Prerequisites for iOS

1. **Apple Developer Account** ($99/year)
   - Sign up: https://developer.apple.com

2. **App Store Connect Access**
   - Create app listing
   - Reserve bundle ID: `com.mcsmart.expensesmadeeasy`

### Build iOS App

```bash
# Build for TestFlight/App Store
eas build --platform ios --profile production
```

**Build Time**: ~15-20 minutes

**What You'll Need**:
- Apple Developer credentials
- EAS will guide you through setup
- Automatic code signing

---

## Testing Builds

### Internal Testing

**1. Android APK Testing**:
```bash
# Build preview APK
eas build --platform android --profile preview

# Install on physical device or emulator
adb install path/to/app.apk
```

**2. Internal Distribution (Expo)**:
```bash
# Create internal distribution build
eas build --platform android --profile preview

# Share download link with testers
# They can install via browser
```

### External Testing

**Android - Google Play Internal Testing**:
1. Upload AAB to Play Console
2. Create Internal Testing track
3. Add testers by email
4. They receive invitation via Play Store

**iOS - TestFlight**:
1. Upload IPA to App Store Connect
2. Create Internal Testing group
3. Add testers by email
4. They install via TestFlight app

---

## Store Submission

### Google Play Store Submission

#### Step 1: Create Play Console Listing

1. Go to: https://play.google.com/console
2. Create application
3. Fill out store listing:
   - App name: Expenses Made Easy
   - Short description (80 chars)
   - Full description (4000 chars)
   - Screenshots (at least 2)
   - Feature graphic (1024x500)
   - App icon (512x512)
   - Category: Finance
   - Content rating questionnaire

#### Step 2: Upload AAB

```bash
# Build production AAB
eas build --platform android --profile production

# OR submit directly via EAS
eas submit --platform android
```

#### Step 3: Release

1. Upload AAB to Play Console
2. Create release (Production, Beta, or Internal Testing)
3. Review release notes
4. Submit for review
5. Wait 24-48 hours for approval

**Store Listing Requirements**:
- Privacy Policy URL (required)
- Support email
- Screenshots (2-8 images)
- Feature graphic
- App content rating

---

### Apple App Store Submission

#### Step 1: Create App Store Connect Listing

1. Go to: https://appstoreconnect.apple.com
2. Create new app
3. Fill out metadata:
   - App name: Expenses Made Easy
   - Subtitle (30 chars)
   - Description (4000 chars)
   - Keywords
   - Screenshots (at least 3)
   - App icon (1024x1024)
   - Category: Finance

#### Step 2: Upload Build

```bash
# Build production IPA
eas build --platform ios --profile production

# OR submit directly via EAS
eas submit --platform ios
```

#### Step 3: Submit for Review

1. Upload build to App Store Connect
2. Complete app information
3. Set pricing (Free)
4. Submit for review
5. Wait 24-72 hours for approval

**App Store Requirements**:
- Privacy Policy URL
- Support URL
- Marketing URL (optional)
- App previews (optional)
- App Store screenshots

---

## Version Management

### Updating Version Numbers

**Update version in app.json or app.config.js**:

```json
{
  "expo": {
    "version": "1.0.1",  // User-facing version
    "android": {
      "versionCode": 2    // Internal build number (auto-increments with EAS)
    },
    "ios": {
      "buildNumber": "2"  // Internal build number
    }
  }
}
```

**Version Numbering**:
- **Major**: Breaking changes (1.0.0 → 2.0.0)
- **Minor**: New features (1.0.0 → 1.1.0)
- **Patch**: Bug fixes (1.0.0 → 1.0.1)

**Android versionCode**:
- Must increase with each release
- EAS auto-increments
- Never reuse a version code

---

## Build Commands Reference

```bash
# Check build status
eas build:list

# Build Android APK (testing)
eas build --platform android --profile preview

# Build Android AAB (production)
eas build --platform android --profile production

# Build iOS IPA (production)
eas build --platform ios --profile production

# Build both platforms
eas build --platform all --profile production

# Submit to stores
eas submit --platform android
eas submit --platform ios

# View credentials
eas credentials

# Cancel build
eas build:cancel

# View build logs
eas build:view [BUILD_ID]
```

---

## Troubleshooting

### Build Fails - Common Issues

**1. "JAVA_HOME not set"**
```
Solution: EAS handles this automatically
If building locally: Set JAVA_HOME environment variable
```

**2. "Keystore not found"**
```bash
# Generate new keystore
eas credentials -p android

# Use existing keystore
eas credentials -p android --action upload-keystore
```

**3. "Build timeout"**
```
Solution: Contact Expo support or retry build
Usually happens during peak hours
```

**4. "Out of memory"**
```
Solution: Upgrade EAS plan or optimize assets
Compress images, remove unused dependencies
```

### App Crashes After Install

**1. Check Logs**:
```bash
# Android
adb logcat | grep "expo"

# iOS (with real device)
npx expo run:ios --device
```

**2. Common Causes**:
- Missing environment variables
- Supabase URL/keys incorrect
- Permissions not granted
- Native module configuration

**3. Debug Build**:
```bash
# Create debug build for error messages
eas build --platform android --profile development
```

---

## Production Checklist

### Before First Build
- [ ] All features tested
- [ ] Date formats verified
- [ ] Error boundaries working
- [ ] Database schema finalized
- [ ] Supabase RLS policies verified
- [ ] App icon finalized (optional: can use default)
- [ ] Splash screen configured
- [ ] Package name confirmed (com.mcsmart.expensesmadeeasy)
- [ ] Version set to 1.0.0

### Before Store Submission
- [ ] Privacy policy written and hosted
- [ ] App description written
- [ ] Screenshots captured (2-8 images)
- [ ] Feature graphic created (Android)
- [ ] App icon uploaded to console (512x512)
- [ ] Content rating completed
- [ ] Support email configured
- [ ] Pricing set (Free recommended)
- [ ] Countries/regions selected

### After Approval
- [ ] Monitor crash reports
- [ ] Respond to user reviews
- [ ] Plan next update
- [ ] Back up keystore
- [ ] Document release process

---

## Cost Breakdown

### Free (Development)
- ✅ EAS Build (free tier: limited builds/month)
- ✅ Expo Go testing
- ✅ Supabase (free tier)

### Paid (Production)
- **Google Play Console**: $25 one-time
- **Apple Developer**: $99/year
- **EAS Build (Production Plan)**: $29/month (unlimited builds)
- **Domain for Privacy Policy**: $10-15/year

**Minimum to Launch Android**: $25 (Play Store fee)
**Minimum to Launch iOS**: $99/year + $29/month EAS

---

## Next Steps

### Current Status: ✅ Ready to Build

**Immediate Next Steps**:
1. Run `eas build:configure` to create eas.json
2. Build APK for testing: `eas build -p android --profile preview`
3. Test on physical device
4. Build AAB for production: `eas build -p android --profile production`
5. Create Play Console listing
6. Submit to Google Play Store

**Timeline**:
- Build APK: 15 minutes
- Test app: 1-2 hours
- Build AAB: 15 minutes
- Create store listing: 2-3 hours
- Submit for review: 24-48 hours approval

**Total: 2-3 days from now to published app**

---

## Resources

### Official Documentation
- **Expo EAS Build**: https://docs.expo.dev/build/introduction/
- **Google Play Console**: https://play.google.com/console
- **App Store Connect**: https://appstoreconnect.apple.com
- **EAS Submit**: https://docs.expo.dev/submit/introduction/

### Support
- **Expo Forums**: https://forums.expo.dev
- **Discord**: https://chat.expo.dev
- **Stack Overflow**: Tag "expo"

---

*Last Updated: October 2025*
*Status: Ready for Production Build* ✅
