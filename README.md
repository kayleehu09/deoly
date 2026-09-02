# Deoly MVP

Deoly is a private, Christian teen-centered photo sharing app. The MVP is focused on a small set of real social loops:

- make an account and stay logged in
- add friends
- take and post a photo deoly
- see a friends-only feed
- react and comment
- have deolys disappear after 24 hours
- block users and delete an account when needed

Permanent/saved posts, richer archives, a prayer wall, music, verse, and other integrations are intentionally deferred until after the private beta MVP.

## Repo Structure

This is an npm workspaces monorepo:

- `apps/api`: Express API, Prisma schema/migrations, auth, feed, posts, friends, media, activity, and safety routes.
- `apps/mobile`: Expo React Native mobile app for the MVP experience.
- `apps/web`: Next.js web app/prototype surface.
- `packages/shared`: shared TypeScript types and constants.

Avoid editing generated output such as `dist/`, `.next/`, `.expo/`, and `node_modules/`.

## Current MVP Status

The app is ahead of the original week-by-week MVP plan in feature breadth. Most Week 1-7 items are implemented, and some Week 8 safety/delete work is already present.

Implemented:

- email signup, login, logout, saved mobile sessions, and account deletion
- authenticated API routes and session recovery handling
- user search with friendship status
- friend requests, accept/decline, and remove friend
- friends-only home feed with newest posts first
- 24-hour deoly expiration on the backend
- camera-first mobile posting flow
- photo preview, optional caption, upload/post progress, and retry messaging
- private Cloudflare R2 photo uploads through signed API URLs
- post reactions, reaction counts, reaction viewer sheets, and viewer reaction state
- comments, post detail screen, and inline comment composer
- activity notifications for accepted friend requests, reactions, and comments
- block/unblock flow, blocked user list, report post flow, and safety rules that affect feed, search, friend requests, comments, and reactions
- API test coverage for core auth, feed, posts, friends, reactions/comments, notifications, and safety behavior

Still needed before private beta:

- add or confirm delete-your-own-post flow
- run a full 3-user smoke test across login, friends, feed, posting, reactions, comments, block, account deletion, and 24-hour expiration
- confirm real R2 private-photo access rules before real user photos
- create a clean Prisma migration baseline before private beta
- make a final pass on disappearing deoly/archive behavior

## Development Setup

Install Node.js 20.19 or newer, then install dependencies from the workspace root:

```bash
npm install
```

Generate the Prisma client if needed:

```bash
npm run db:generate
```

Apply database migrations:

```bash
npm run db:migrate
```

Seed local data:

```bash
npm run db:seed
```

## Running The App

Start the API:

```bash
npm run dev:api
```

Start the mobile app:

```bash
npm run dev:mobile
```

Open the Expo app in Expo Go from the Expo prompt.

For Expo Go on a phone, `localhost` points to the phone instead of your computer. Start the mobile app with your computer's LAN address:

```bash
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_IP:4000 npm run dev:mobile
```

Your phone and computer need to be on the same Wi-Fi network.

Start the web app:

```bash
npm run dev:web
```

## Testing

Run the API test suite:

```bash
npm test
```

Typecheck the mobile app:

```bash
npm run typecheck --workspace @deoly/mobile
```

Manual mobile smoke test checklist:

- create an account
- log out and log back in
- restart the app and confirm saved login recovers
- search for another user
- send, accept, decline, and remove a friend request
- take a photo, add a caption, post it, and see it in the feed
- react to a friend's post and remove the reaction
- comment on a friend's post
- confirm notifications appear for accepted friend requests, reactions, and comments
- block a user and confirm they disappear from feed/search and cannot interact
- delete an account and confirm the app returns to auth
- confirm expired deolys do not appear in the home feed

## R2 Photo Storage

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

Before real user uploads, confirm the bucket is private and that photos are only available through short-lived signed read URLs.

## MVP Timeline

Completed so far:

1. App foundation: monorepo, API, mobile app, web surface, shared package, seed data, and tests.
2. Auth: signup, login, logout, saved session, session restore, and account deletion.
3. Friends: search, request, accept, decline, remove, and status display.
4. Feed: real backend feed, friends-only visibility, own posts, friends' posts, newest-first ordering, and loading/error states.
5. Disappearing posts: 24-hour deoly expiration and feed filtering.
6. Photo posting: Cloudflare R2 signed uploads, image object keys on posts, camera capture, preview, caption, progress, retry, and return to feed.
7. Reactions/comments: reaction rail, counts, viewer sheets, comments, post detail, and activity notifications.
8. Safety: block/unblock, blocked user list, reports, account deletion, and blocked interaction protections.

Next MVP work:

1. Delete own post.
2. Full private-beta smoke test with three seeded users.
3. Prisma migration baseline.
4. R2 privacy verification with real credentials.
5. Final polish and bug fixes.

Later polish:

- full deoly archive calendar
- saved/permanent posts
- text-box-only post option
- prayer wall
- music, verse, and app integrations
- friend request accepted micro-interaction
- richer friend profile pages
