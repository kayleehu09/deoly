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
- post composer with optional caption and `24 Hours` vs `Permanent`
- reverse-chronological home feed with close-friend prioritization
- profile screen showing permanent posts only
- Firebase Firestore and Storage scaffolding for later integration
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
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack firebase
npx expo install expo expo-camera expo-status-bar react-native react-native-screens react-native-safe-area-context react-native-gesture-handler
```

## Firebase services to enable later

- Firestore Database
- Firebase Storage
- Authentication when Phase 2 or later introduces login/signup

Replace the placeholder config in `apps/mobile/src/services/firebase.ts` with your project values before connecting real data.

## What to build next

1. Replace mock services with Firestore reads and Storage uploads.
2. Add auth scaffolding with anonymous or email-based development auth first.
3. Add friend graph persistence so feed privacy is enforced by real data.
4. Add reminders/notifications and a lightweight edit/retry flow for captured photos.
