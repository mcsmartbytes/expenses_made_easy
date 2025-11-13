# Start Here – Expenses Made Easy

This is a quick, reliable path to run, test, and build the app.

## Overview
- Tech: Expo SDK 54, React Native 0.81, React 19
- Cloud: EAS Build, Supabase (auth, DB, storage)
- Status: Builds fixed, icons set, env configured in `eas.json`, mileage auto‑start implemented (foreground + background)

## Prerequisites
- Node.js 18+ and npm 9+
- Expo CLI (installed automatically via `npx`)
- EAS CLI (login required for cloud builds): `npm i -g eas-cli`
- Android device/emulator for testing (or iOS with Apple Developer account)

## 1) Install & Verify
```
npm ci
npx expo doctor
```

Notes
- Supabase credentials are provided via `eas.json` build profiles.
- Local `npx expo start` doesn’t require `.env` for most features, but if needed use `.env`/`EXPO_PUBLIC_…` vars.

## 2) Run Locally
```
npx expo start
# or with platform shortcut
npm run android
npm run ios
npm run web
```

## 3) Build with EAS
Login once:
```
eas login
eas whoami
```

Start builds:
```
# Android APK (internal testing)
npm run build:android:preview

# Android AAB (Play Store)
npm run build:android:prod

# Submit latest AAB to Play
npm run submit:android:prod
```

Monitor builds:
```
eas build:list
eas build:view <BUILD_ID>
```

## Mileage Auto‑Start (Driving Detection)
- Foreground: When the Mileage tab is open, driving > ~7 mph for a few seconds auto‑starts a trip and navigates to Active Trip.
- Background: App requests background location and starts a background task that auto‑starts a Business trip when movement is detected.

Permissions to accept on device
- Android: Allow location “All the time” and allow foreground service notification.
- iOS: Allow “Always” for Location (Background Location enabled in config).

## Troubleshooting
- expo doctor errors:
  - Icons must be square; already fixed with 1280×1280 PNGs in `assets/`.
  - If anything else appears: `npx expo doctor --verbose`.
- Supabase env missing locally:
  - Ensure `process.env.EXPO_PUBLIC_SUPABASE_URL` and `…_ANON_KEY` exist for local runs, or rely on EAS builds which inject them from `eas.json`.
- New Architecture / native modules:
  - Disabled in `app.json` (`newArchEnabled: false`) for compatibility with OCR library.
- EAS warning about versions:
  - `eas.json` sets `cli.appVersionSource: "remote"`.
  - To align SDK patches later: `npx expo install expo@~54.0.16 expo-task-manager@~14.0.8`.
- Build not starting:
  - Confirm login (`eas whoami`), then rerun the npm script.

## Useful Scripts (package.json)
- `start` – Expo dev server
- `android` / `ios` / `web` – Platform quickstart
- `build:android:preview` – EAS APK (internal testing)
- `build:android:prod` – EAS AAB (Play Store)
- `submit:android:prod` – Submit latest AAB to Play

## Notes
- Background auto‑start currently defaults to Business profile when the app is backgrounded (no UI context). If preferred, we can persist and use your last selected profile.
- To adjust auto‑start sensitivity (speed or delay), edit `src/screens/Mileage/MileageScreen.tsx` and `src/tasks/autoStartTripTask.ts`.

That’s it — start with local run, test core flows, then kick off a preview build and move to production.

