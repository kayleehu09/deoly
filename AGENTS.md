## MVP Plan

The MVP roadmap for this app is stored in `MVP_PLAN.md`.

Before planning features or implementing code:
1. Read `MVP_PLAN.md`.
2. Use it as the source of truth for priorities.
3. Focus on MVP features only.

After implementing code:
1. Instruct me on how to test the code.
2. Tell me if we are on track, ahead, or behind.
3. Suggest the smallest useful next step.

General behavior instructions:
- Ask questions to clarify vision or preferences as needed.
- Do not hesitate to alert if a request or action item is out of line with the MVP_PLAN.md.
- Sparingly, explain any technical terms and processes that may be unfamiliar at the level of a teacher talking to a high school or college student. 

# Repository Guidelines

## Project Structure & Module Organization

This is an npm workspaces monorepo. Main code lives in `apps/`; shared TypeScript lives in `packages/`.

- `apps/api`: Express API, Prisma files in `prisma/`, routes and middleware in `src/`, tests in `src/tests/`.
- `apps/mobile`: Expo React Native app. Screens live in `src/screens`, reusable UI in `src/components`, API clients in `src/services`, state hooks in `src/hooks`.
- `apps/web`: Next.js web app, with routes under `app/`, UI in `components/`, and helpers in `lib/`.
- `packages/shared`: shared TypeScript package built to `dist/`.

Avoid editing generated output such as `dist/`, `.next/`, `.expo/`, and `node_modules/`.

## Build, Test, and Development Commands

- `npm run dev:api`: starts the API on port `4000`.
- `npm run dev:mobile`: starts Expo for the mobile app. For Expo Go LAN testing, `cd apps/mobile && npx expo start --lan --clear`.
- `npm run dev:web`: starts the Next.js web app on port `3000`.
- `npm run build`: builds shared, API, and web packages.
- `npm test`: runs the API Vitest suite.
- `npm run db:migrate` / `npm run db:seed`: update and seed the Prisma database.
- `npm run typecheck --workspace @deoly/mobile`: typecheck the mobile app.

## Coding Style & Naming Conventions

Use TypeScript throughout. Follow existing style: two-space indentation, semicolons in API/web TypeScript, single quotes in mobile code, and descriptive camelCase names. React components and screens use PascalCase, for example `SearchScreen` and `FeedList`. Keep service modules small and route-specific, such as `services/friends.ts`.

## Testing Guidelines

API tests use Vitest and Supertest in `apps/api/src/tests/*.test.ts`. Add or update tests when changing auth, friends, feed, posts, or search behavior. Mobile relies on TypeScript checks and manual Expo smoke tests; verify login, search, friend actions, and feed loading after mobile changes.

## Commit & Pull Request Guidelines

Recent commits use short but detailed, present-tense summaries, for example `Add mobile signup, login, and logout`. Keep commits focused and mention user-visible behavior. Commits may use technical language, but any unfamiliar terms to a teen that have not been previously explained should be explained when commit message is given.

Pull requests should include a brief summary, test commands run, linked issue or task context, and screenshots or Expo notes for UI changes. Call out database migrations, environment changes, or manual testing steps.

## Security & Configuration Tips

Keep secrets out of git. Mobile Expo Go testing needs `apps/mobile/.env` to point `EXPO_PUBLIC_API_BASE_URL` at your computer LAN API URL, for example `http://10.0.0.24:4000`. Do not make private image or user data publicly accessible when adding storage features.
