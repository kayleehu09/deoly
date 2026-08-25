# Run Commands

Use these from separate Terminal windows or tabs.

## Terminal 1: API

```bash
cd /Users/kayleehu/Documents/helloworld
npm run dev:api
```

## Terminal 2: Mobile App

```bash
cd /Users/kayleehu/Documents/helloworld
npm run dev:mobile
```

## Terminal 3: Web App, Optional

```bash
cd /Users/kayleehu/Documents/helloworld
npm run dev:web
```

## Mobile App With Real API On Expo Go

If you are testing on your phone with Expo Go, replace `YOUR_COMPUTER_IP` with your computer's Wi-Fi IP address.

```bash
cd /Users/kayleehu/Documents/helloworld
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_IP:4000 npm run dev:mobile
```

Your phone and computer need to be on the same Wi-Fi network.

## Useful Setup And Test Commands

Install dependencies:

```bash
cd /Users/kayleehu/Documents/helloworld
npm install
```

Run database migrations:

```bash
cd /Users/kayleehu/Documents/helloworld
npm run db:migrate
```

Seed the database:

```bash
cd /Users/kayleehu/Documents/helloworld
npm run db:seed
```

Run API tests:

```bash
cd /Users/kayleehu/Documents/helloworld
npm test
```

## Best Starting Order

1. Start the API first.
2. Start the mobile app second.
3. Start the web app only if you need it.
