# App Branding Guide - Expenses Made Easy

## Overview

This guide explains the app's visual identity, branding assets, and how to customize them for production release.

**Current Status**: ✅ Default branding configured and functional

---

## Current Branding Setup

### App Identity
- **App Name**: Expenses Made Easy
- **Package Name**: com.mcsmart.expensesmadeeasy
- **Version**: 1.0.0
- **Slug**: expenses_made_easy

### Branding Assets Location
All assets are in `/assets/` directory:
```
assets/
├── icon.png (21KB) - Main app icon
├── adaptive-icon.png (21KB) - Android adaptive icon
├── splash-icon.png (35KB) - Splash screen
└── favicon.png (1.5KB) - Web favicon
```

### Color Scheme (From Theme)
```
Primary: Orange (#ea580c, #f97316, #fb923c)
Secondary: Teal (#14b8a6, #2dd4bf, #5eead4)
Background: Light (#f9fafb, #ffffff, #f3f4f6)
Text: Dark (#1f2937, #4b5563, #9ca3af)
Accent: Amber/Orange tones
```

---

## Current Assets

### 1. App Icon (icon.png)
- **Size**: 1024x1024px required
- **Current**: Default Expo icon
- **Purpose**: iOS App Store, Home screen icon
- **Format**: PNG with transparency

**Requirements**:
- Square (1024x1024px)
- No transparency on iOS (use solid background)
- Simple, recognizable at small sizes
- Represents expense tracking concept

### 2. Adaptive Icon (adaptive-icon.png)
- **Size**: 1024x1024px required
- **Current**: Default Expo adaptive icon
- **Purpose**: Android home screens (adapts to different shapes)
- **Format**: PNG with transparency

**Android Adaptive Icon**:
- Foreground: Your icon (can have transparency)
- Background: Solid color (#ffffff currently)
- Safe zone: Center 66% of image (outer 17% may be cropped)

### 3. Splash Screen (splash-icon.png)
- **Size**: 1284x2778px recommended
- **Current**: Default Expo splash
- **Purpose**: First screen users see while app loads
- **Background Color**: #F0FDFA (light teal)

**Splash Screen Design**:
- Icon should be centered
- Keep minimal - just logo/icon
- Use brand colors
- Fast loading

### 4. Favicon (favicon.png)
- **Size**: 48x48px minimum
- **Current**: Default Expo favicon
- **Purpose**: Web version browser tab icon
- **Format**: PNG

---

## Customizing Your Branding

### Option 1: Use Icon Generation Service (Recommended)

**1. Create Master Icon (1024x1024px)**

Use these free tools:
- **Canva**: canva.com (easiest)
- **Figma**: figma.com (professional)
- **GIMP**: gimp.org (open-source)

**Design Tips**:
- Simple, bold shapes
- High contrast
- Recognizable at 44x44px (iPhone size)
- Use brand colors (orange primary)
- Avoid small text or details

**Icon Ideas for Expenses Made Easy**:
1. 📊 Chart icon with dollar sign
2. 💰 Wallet with checkmark
3. 📱 Phone with receipt
4. 🧾 Receipt with dollar
5. 💳 Card with analytics graph

**2. Generate All Sizes with EAS**

Expo's build service automatically generates all required sizes:

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build will generate all icon sizes automatically
```

**OR Use Online Tools**:

- **App Icon Generator**: appicon.co
- **MakeAppIcon**: makeappicon.com
- **Icon Kitchen**: icon.kitchen

Upload your 1024x1024px master icon, download all sizes.

---

### Option 2: Manual Icon Creation

#### Step 1: Design Your Icon

**Master Icon Specs**:
```
Size: 1024x1024px
Format: PNG
DPI: 72
Color Mode: RGB
Transparency: Yes (for adaptive icon)
```

**Design Guidelines**:
- Use primary color (#ea580c orange)
- Simple geometric shapes
- 2-3 colors maximum
- Flat or minimal depth
- No gradients (they don't scale well)

#### Step 2: Create icon.png (iOS Main Icon)
```
Resolution: 1024x1024px
Background: Solid (no transparency)
Format: PNG-24
```

Save to: `/assets/icon.png`

#### Step 3: Create adaptive-icon.png (Android)
```
Resolution: 1024x1024px
Background: Transparent
Safe Zone: Keep important content in center 66%
Format: PNG-32 (with alpha channel)
```

Save to: `/assets/adaptive-icon.png`

#### Step 4: Update app.json Background Color
```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#ea580c"  // Change to your primary color
  }
}
```

---

### Creating a Custom Splash Screen

#### Design Specifications
```
Resolution: 1284x2778px (iPhone 14 Pro Max)
Format: PNG
Safe Zone: Center 1170x2532px
```

#### Splash Screen Options

**Option A: Simple Icon (Recommended)**
```
- Solid background color (#F0FDFA or your brand color)
- Centered app icon/logo
- Minimal text (optional: "Expenses Made Easy")
- Loading indicator (system provides this)
```

**Option B: Branded Splash**
```
- Gradient background
- Larger logo/wordmark
- Tagline: "Track. Save. Succeed."
- Still keep it simple and fast-loading
```

#### Implementation

1. **Create Splash Image** (1284x2778px)
   - Use Canva splash screen template
   - Or create in Figma/Photoshop

2. **Save to** `/assets/splash-icon.png`

3. **Update app.json**:
```json
"splash": {
  "image": "./assets/splash-icon.png",
  "resizeMode": "contain",  // or "cover"
  "backgroundColor": "#F0FDFA"  // Match your splash background
}
```

---

## Color Psychology for Expense Tracking

**Current Colors**:
- **Orange** (#ea580c): Energy, enthusiasm, affordable
- **Teal** (#14b8a6): Trust, calm, professional

**Why These Colors Work**:
- ✅ Orange: Action-oriented (expense tracking is active)
- ✅ Teal: Financial stability (trust with money)
- ✅ High contrast: Easy to see/tap
- ✅ Modern: Aligns with fintech apps

**Alternative Color Schemes**:

**Professional Finance**:
- Primary: Navy Blue (#1e3a8a)
- Secondary: Green (#10b981)
- Background: White

**Friendly/Approachable**:
- Primary: Purple (#8b5cf6)
- Secondary: Yellow (#fbbf24)
- Background: Light gray

**Corporate/Enterprise**:
- Primary: Dark Gray (#374151)
- Secondary: Blue (#3b82f6)
- Background: White

---

## Brand Asset Requirements by Platform

### iOS App Store
| Asset | Size | Format | Notes |
|-------|------|--------|-------|
| App Icon | 1024x1024 | PNG | No transparency, no alpha channel |
| Screenshots (6.7") | 1290x2796 | PNG/JPG | iPhone 14 Pro Max |
| Screenshots (5.5") | 1242x2208 | PNG/JPG | iPhone 8 Plus |

### Google Play Store
| Asset | Size | Format | Notes |
|-------|------|--------|-------|
| Hi-res icon | 512x512 | PNG | With transparency |
| Feature graphic | 1024x500 | PNG/JPG | Landscape banner |
| Screenshots | 1080x1920+ | PNG/JPG | Portrait recommended |
| Promo video | - | YouTube | Optional |

### Expo Build
| Asset | Size | Format | Notes |
|-------|------|--------|-------|
| icon.png | 1024x1024 | PNG | Auto-generates all sizes |
| adaptive-icon.png | 1024x1024 | PNG | Android only |
| splash-icon.png | 1284x2778 | PNG | Loading screen |

---

## Testing Your Branding

### Preview Before Building

**1. Expo Go App**:
```bash
npx expo start
# Scan QR code - see icon in Expo Go
```

**2. Development Build**:
```bash
eas build --profile development --platform android
# Install on device to see real icon
```

**3. Simulator/Emulator**:
```bash
# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android
```

### Check Icon on Different Backgrounds
- Light theme home screen
- Dark theme home screen
- iOS folder view
- Android app drawer
- Search results

---

## Brand Guidelines Template

### Logo Usage
```
Primary Logo: [Your icon/logo]
Minimum Size: 44x44px (mobile)
Clear Space: 1/4 icon height on all sides
Don't: Stretch, rotate, add effects, change colors
```

### Typography (App UI)
```
Primary Font: System (SF Pro on iOS, Roboto on Android)
Headings: Bold, 24-32px
Body: Regular, 16px
Small: Regular, 14px
```

### Color Palette
```
Primary: #ea580c (Orange)
  - Light: #fb923c
  - Dark: #c2410c

Secondary: #14b8a6 (Teal)
  - Light: #5eead4
  - Dark: #0f766e

Neutral: #1f2937 to #f9fafb
Error: #dc2626
Success: #10b981
Warning: #f59e0b
```

---

## Quick Branding Checklist

### Before Production Release:
- [ ] Custom app icon designed (1024x1024px)
- [ ] Adaptive icon created for Android
- [ ] Splash screen customized
- [ ] Favicon updated for web
- [ ] Brand colors match across all assets
- [ ] Tested on real devices (iOS & Android)
- [ ] Icon visible at small sizes
- [ ] No copyright issues with design elements
- [ ] App Store screenshots prepared
- [ ] App Store description matches branding

---

## Tools & Resources

### Icon Design
- **Canva**: https://canva.com (Templates: "App Icon")
- **Figma**: https://figma.com (Free, professional)
- **Adobe Express**: https://adobe.com/express (Free tier)
- **Sketch**: https://sketch.com (Mac only, paid)

### Icon Generators
- **App Icon Generator**: https://appicon.co
- **MakeAppIcon**: https://makeappicon.com
- **Icon Kitchen**: https://icon.kitchen

### Stock Icons (Free)
- **Flaticon**: https://flaticon.com
- **Icons8**: https://icons8.com
- **FontAwesome**: https://fontawesome.com

### Color Tools
- **Coolors**: https://coolors.co (Palette generator)
- **Adobe Color**: https://color.adobe.com
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/

### Inspiration
- **Dribbble**: https://dribbble.com/search/app-icon
- **Behance**: https://behance.net/search/projects?search=app%20icon
- **App Icon Gallery**: https://appicons.design

---

## Next Steps

### Current Status: ✅ Functional with default assets

### To Customize:

**Quick Path (30 minutes)**:
1. Create 1024x1024px icon in Canva
2. Replace `/assets/icon.png`
3. Replace `/assets/adaptive-icon.png`
4. Update splash screen background color
5. Test with `npx expo start`

**Professional Path (2-3 hours)**:
1. Design complete brand identity
2. Create master icon in Figma
3. Design custom splash screen
4. Create app store screenshots
5. Document brand guidelines
6. Test on multiple devices

**Current Setup Works For**:
- ✅ Development testing
- ✅ Internal beta testing
- ✅ Personal use
- ⚠️ Public release (should customize for brand identity)

---

## Summary

✅ **Current Status**:
- App branding configured
- Default assets present and functional
- All required assets exist
- Ready for development/testing

⏭️ **For Production**:
- Create custom icon (recommended)
- Design splash screen (optional)
- Update colors to match brand (optional)
- Test on real devices

🎨 **Brand Identity**:
- Orange primary (#ea580c) - Energy, action
- Teal secondary (#14b8a6) - Trust, finance
- Modern, professional aesthetic
- Clean, minimal design

---

*Last Updated: October 2025*
*Branding Status: Functional with default assets, ready for customization*
