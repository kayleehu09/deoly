# Sanctuary Social MVP

This repo now contains multiple app surfaces for the broader product direction:

- `apps/api`: Express + Prisma API
- `apps/web`: Next.js web client
- `apps/mobile`: Expo + React Native + TypeScript mobile MVP skeleton for **Deoly**
- `packages/shared`: shared TypeScript package space for future cross-app contracts

## Deoly mobile MVP

`apps/mobile` is a mock-data-first React Native app for a private, Christian teen-centered devotional experience.

Included in the skeleton:

- bottom-tab navigation with `Home`, `Search`, `Create Post`, and `Profile`
- camera-first post creation flow with `expo-camera`
- post composer with optional caption; MVP posts disappear after 24 hours
- reverse-chronological home feed with close-friend prioritization
- profile screen with account stats, recent deolys, friends, and a placeholder for future saved posts
- API-backed private photo uploads using Cloudflare R2 signed URLs
- mock current user, mock users, and mock posts so the app runs before auth/backend wiring

## Mobile folder structure

```text
apps/mobile
├── App.tsx
├── app.json
├── package.json
├── tsconfig.json
└── src
    ├── components
    ├── constants
    ├── data
    ├── hooks
    ├── navigation
    ├── screens
    ├── services
    ├── types
    └── utils
```

## Mobile setup

1. Install Node.js 20.19 or newer.
2. Install repo dependencies from the workspace root:

```bash
npm install
```

3. Start the Expo app:

```bash
npm run dev:mobile
```

4. Open the app in Expo Go from the Expo prompt.

To test email signup, run the API in another terminal:

```bash
npm run dev:api
```

Expo Go runs on your phone, so `localhost` points to the phone instead of your computer. Start the mobile app with your computer's LAN address:

```bash
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_IP:4000 npm run dev:mobile
```

Your phone and computer need to be on the same Wi-Fi network.

## Mobile package install commands

If you want to recreate the mobile app dependencies manually inside `apps/mobile`, use:

```bash
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npx expo install expo expo-camera expo-status-bar react-native react-native-screens react-native-safe-area-context react-native-gesture-handler
```

## R2 photo storage setup

Photo storage is intentionally kept behind the API so the mobile app does not depend on a storage provider directly.
Create a private Cloudflare R2 bucket and set these API environment variables:

```bash
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_UPLOAD_URL_TTL_SECONDS=300
R2_READ_URL_TTL_SECONDS=300
```

## What to build next

1. Add upload progress and retry UI for slower mobile connections.
2. Add reactions and comments to real photo posts.
3. Add block/report safety flows.
4. Run a full private-beta smoke test with three seeded users.
