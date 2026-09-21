# Database setup — private beta baseline (#16)

## Baseline decision

`20260911010000_private_beta_baseline` captures the existing SQLite schema as of
September 11, 2026, including auth/sessions, friends, posts, comments, reactions,
safety, activity notifications, and profile/avatar cleanup. The schema itself
is unchanged. Existing compatibility fields and enum values remain; this does
not enable deferred features such as permanent posting.

The earlier partial safety/avatar migrations are replaced by this complete
starting migration. They could not reproduce the original tables from an empty
database. This is a fresh-database baseline, not an upgrade for databases using
the old development history.

## New checkout

Follow the commands in README.md: install dependencies, copy `.env.example` to
`apps/api/.env`, generate the client, create the empty database file, deploy
migrations, then seed development fixtures. No existing database file is needed.

`npm run db:deploy` applies committed SQL; it does not invent schema changes.
`npm run db:seed` uses Prisma's environment loading and replaces demo data.
`npm run db:verify` automatically creates an isolated temporary database and
checks migration replay, no pending migrations, schema equality, seed/reseed
counts, and foreign keys. Temporary files are removed even on failure.

## Existing development database

Your existing `dev.db` is left untouched by this change. Do not apply the new
baseline directly to it or accept a reset prompt if you want to retain its data.

For this pre-beta transition, start a separate development database:

1. Stop the API. Preserve the old database and its environment configuration.
2. In `apps/api/.env`, set `DATABASE_URL="file:./beta-dev.db"` (choose another
   filename if that database already exists and must be preserved).
3. Ensure your shell has no exported `DATABASE_URL` overriding this setting.
4. From the repository root, run `touch apps/api/prisma/beta-dev.db`,
   `npm run db:generate`, `npm run db:deploy`, and `npm run db:seed`.
5. Restart the API and log out/log in on mobile using a seeded account. Old
   sessions belong to the old database.

Pointing the environment back at the old file preserves access to the old
development data, but its migration history remains incompatible. If existing
data must move into the beta database, plan and verify an explicit data transfer
separately; do not reset it or mark the baseline applied without checking schema
and migration history. Never seed a database holding real beta user data.

## Future schema changes

After adopting the baseline, edit `apps/api/prisma/schema.prisma`, then run
`npm run prisma:migrate --workspace @deoly/api -- --name describe_change` to generate a new development
migration. Review its SQL, regenerate the client, and run `npm run db:verify`
and `npm test`. Commit the schema and migration together. Update verification
fixture expectations only when an intentional seed change requires it.

Once a database uses this baseline, keep it and add subsequent migrations; do
not rewrite applied migrations. Deploy committed migrations to beta with
`npm run db:deploy`. The baseline is SQLite-specific; changing database providers
requires a separate migration plan.

## Acceptance

- `npm run db:verify`: fresh database creation, repeated deploy, migration status,
  schema match, two successful seed runs, expected records and valid foreign keys.
- `npm test`: API suite, including profile tests using the committed migration.
- Optional manual check: start the API, log in as Ava, and confirm Noah is a friend
  and Zoe has a pending request. No second laptop or collaborator is required.

This verifies database setup. Full mobile/R2 and three-user private-beta smoke
testing remain separate MVP acceptance work.
