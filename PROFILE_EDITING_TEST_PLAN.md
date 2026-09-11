# Week 8 profile editing — issue #20

Implemented for [Week 8: Implement profile editing](https://github.com/kayleehu09/deoly/issues/20). Automated checks pass; the card needs Expo Go and live R2 acceptance testing before closing.

## Start testing on this checkout

Dependencies are installed, Prisma Client is generated, and the local development database has the additive avatar migration applied. Existing user data was preserved and the database was backed up before the change. Restart an already-running API so it loads the new code.

From the repository root, in separate terminals:

```sh
npm run dev:api
```

```sh
cd apps/mobile
npx expo start --lan --clear
```

Open Expo Go on the same Wi-Fi as the computer. Use the existing API URL configuration. This change adds Expo-compatible `expo-image-picker` and `expo-image-manipulator`; a custom development client must be rebuilt to include them. The iOS JS bundle exports successfully, but that is not a device runtime test.

## Three-account acceptance checks

Use A (profile owner), B (accepted friend), and C (signed-in nonfriend). Keep one active deoly from A with a comment and a reaction.

1. As A, open **Profile → Edit profile**. Verify existing values, counters, circular photo preview, and the neutral default avatar. Repeat from **Settings → Edit profile**.
2. Change display name, username, and a multiline bio. Save and verify Profile updates. Check B's feed, comments, reactions list, friends list, activity, and search after reopening each screen. C should see the updated identity in search; C must still have no access to A's friends-only posts.
3. Open A's profile as B and verify the saved bio and photo. Background/reopen the app and reopen the profile to verify fresh data rather than an old navigation snapshot.
4. Force-close/reopen and log out/in as A. The new values must remain. Email/password login must work after changing username, and existing posts, friendships, comments, and reactions must remain attached to A.
5. Try a one-character name, an invalid/short username, and B's username in uppercase. Verify useful errors and no partially saved name/bio. Verify maximum lengths (40 name, 24 username, 160 bio), an unchanged username, and clearing the bio.
6. Choose a library photo. Check crop/preview; cancel the editor and confirm that nothing changed. Choose again and Save; verify preparation/upload/saving feedback and that repeated Save taps do not duplicate the request. Replace the photo, then remove it; check the neutral avatar across the same surfaces.
7. Deny photo-library permission and verify guidance. Grant permission in phone settings and retry. Cancel the picker and confirm text edits remain. Try a large/high-resolution photo and confirm the saved image is resized to at most 1024 pixels.
8. Edit without saving, then use Cancel, back navigation, and the iOS back gesture. Verify **Keep editing** and **Discard**. On a small phone, verify the keyboard does not obscure fields and scrolling works.
9. Turn off connectivity during upload/Save. The editor must retain text and the selected photo and allow retry. Confirm no replacement appears until Save succeeds. If the server received Save but its response was lost, reopening the profile should show the server's saved result.
10. Block A as B, then reverse the test with A blocking B. Neither account should fetch the other's profile or obtain new avatar links. A previously issued link can work until its configured expiry. The blocked-users management list deliberately uses a neutral avatar. Unblock and reopen to verify normal profile access returns.
11. Wait beyond the configured avatar link lifetime (five minutes by default), then background/foreground and reopen Profile, feed, friends, search, activity, and another user's profile. Photos should load using fresh links.
12. Delete a disposable photo-bearing account. Confirm login/session invalidation, removal of its social data, and eventual avatar-object cleanup. Do not delete an account you want to keep.

## Storage behavior and operational checks

- Keep R2 private. No public bucket or public-domain configuration is added.
- The API storage credential needs read, write, copy, and delete access to the same private bucket. Existing R2 environment variables are reused; no new secrets are required.
- Uploads go to `users/<id>/avatars/uploads/`. The API checks ownership/expiry, stored size/type, and image header bytes. A conditional copy creates an immutable key under `avatars/saved/`, so an upload URL cannot overwrite the saved photo.
- `AvatarUpload` records survive user deletion. A worker runs on API startup and every five minutes, claiming at most 100 eligible objects per pass. Retired saved photos are eligible immediately; unclaimed uploads/copies are retained for 24 hours (or longer if the upload URL remains valid). Failed deletes retry in later passes, including after API restart. An attached photo is never deleted by this worker.
- In a disposable R2 test account, replace/remove a photo and verify retirement after the next worker pass. For abandonment, cancel after an interrupted upload and verify deletion after retention. Temporarily deny storage deletion, verify the generic retry warning, then restore access and verify eventual deletion. Never make the bucket public to inspect photos.
- Storage API calls are mocked in automated tests. A successful real upload, conditional copy, signed read, and deletion still need the device/R2 checks above.

## Database compatibility

The new migration adds `User.avatarObjectKey` and `AvatarUpload`; it does not replace legacy `avatarUrl` data. Clearing/replacing an avatar clears the legacy URL for that user.

This checkout's legacy SQLite database has no `_prisma_migrations` history. Only the additive SQL was applied locally, with a backup; the separate migration-baseline roadmap item is still open. Do not reset or reseed to test profile editing.

For another existing development database that has neither new field/table, back it up, then apply the checked-in migration once from `apps/api`:

```sh
npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/20260911000000_add_profile_avatars/migration.sql
```

Regenerate Prisma Client with `npm run db:generate` from the root. Do not reapply this SQL to a database already containing the avatar schema. Establish the planned migration baseline before beta deployment.

## Completed automated verification

- `npm test`: 75 passing API tests, including 23 profile integration tests with real SQLite and 10 storage-validation tests. Profile tests apply the checked-in migration to a temporary pre-avatar schema; they never use the development database.
- `npm run build`: shared package, API, and Next.js production build.
- `npm run typecheck --workspace @deoly/mobile`.
- `cd apps/mobile && npx expo export --platform ios --output-dir /tmp/deoly-profile-ios-export`.
- `git diff --check`.

Implementation references: [Expo ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) and [Expo ImageManipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/).

## Pasteable issue update

Implemented mobile editing for display name, username, bio, and library photo from Profile and Settings. Added validation, Save/Cancel and retry states, session persistence, fresh profile reads, private avatar storage, and retryable cleanup. Changes include the additive avatar migration and neutral default avatars. All 75 API tests, the full build, mobile typecheck, and iOS bundle export pass. Remaining: three-account Expo Go acceptance testing and real R2 upload/read/copy/delete verification. Status: implementation complete; keep #20 open until device/storage smoke tests pass. The separate pre-beta migration baseline is still pending.
