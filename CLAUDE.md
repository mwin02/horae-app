# Horae — Claude Code Guide

## Project Overview

A mobile time-tracking app (React Native + Expo, TypeScript) that helps users track how they spend their days and provides insights on time allocation vs personal goals. Offline-first with cloud sync.

Full implementation plan: `/Users/myozawwin/.claude/plans/ethereal-percolating-chipmunk.md`

## Development Workflow

### Feature Development Process

1. Discuss and scope the feature
2. Create a feature branch from `main` (e.g., `feat/home-timer`)
3. Implement the feature
4. User tests on iOS simulator (`npx expo run:ios`)
5. Commit, push, and create a PR
6. User merges the PR, then switch to `main` and pull

### Git Branching Strategy

- **`main`** — stable, only merged PRs
- **Feature branches** — `feat/<feature-name>` for each implementation step
- **PRs for all feature work** — squash merge to keep main history clean
- **Direct commits to main** only for trivial changes (typos, config tweaks)

### Conversation Strategy

- **One conversation per feature** to manage context window size
- Start each conversation with: _"Working on [Phase X, Step Y]: [feature]. Read the plan at /Users/myozawwin/.claude/plans/ethereal-percolating-chipmunk.md for context."_
- CLAUDE.md and the plan file persist across conversations

## Tech Stack

- **Mobile:** React Native + Expo SDK 55 (TypeScript), Expo Router (file-based routing)
- **Offline DB + Sync:** PowerSync with OP-SQLite adapter (SQLite under the hood, syncs with Supabase)
- **Backend/DB:** Supabase (PostgreSQL, Auth, Row-Level Security, Edge Functions)
- **State:** Zustand (ephemeral UI state only — all persistent data lives in PowerSync/SQLite)
- **Notifications:** expo-notifications (local)
- **UUID Generation:** `uuid` package via `@/lib/uuid` (`generateId()` helper)
- **Fonts:** Manrope (headlines/display) + Plus Jakarta Sans (labels/body) via `@expo-google-fonts`
- **Icons:** Feather icons from `@expo/vector-icons` (thin-stroke style)
- **Gradients/Blur:** `expo-linear-gradient`, `expo-blur`
- **SVG:** `react-native-svg` (used for donut charts in Insights tab)

## Key Architecture Decisions

1. **Offline-first:** All writes go to local SQLite via PowerSync. Sync to Supabase happens in background when online.
2. **No separate backend:** Supabase handles everything (REST API, Auth, Edge Functions). No Next.js.
3. **Deferred auth:** App is fully usable without an account. Auth is optional for sync/backup.
4. **Timer state:** The running timer is a `time_entries` row with `ended_at = null` in PowerSync. Elapsed time is always computed as `now - started_at` (never accumulated via setInterval).
5. **Timezones:** All times stored in UTC as ISO 8601 strings. Each time_entry stores its IANA timezone at creation. Display in original timezone.
6. **PowerSync OP-SQLite adapter:** Must use `OPSqliteOpenFactory` explicitly — the default adapter (`@journeyapps/react-native-quick-sqlite`) is not installed.

## Phase 3 cloud sync

All tables are `localOnly: true` today; sync ships in Phase 3. When working in `db/queries/**` or `supabase/`, read [`supabase/DESIGN.md`](./supabase/DESIGN.md) first — it covers user-scoping, the preset id contract, RLS rules, and PowerSync upload constraints. **Never change an existing preset id** in [`constants/presets.ts`](./constants/presets.ts) — it would orphan every `time_entries` / `ideal_allocations` row referencing it.

## Data Model

Schema definitions live in [`db/schema.ts`](./db/schema.ts); TypeScript types in [`db/models.ts`](./db/models.ts). All tables carry `updated_at` + `deleted_at` (soft delete) and are `localOnly: true` until Phase 3.

## Development Commands

```bash
# Type check
npx tsc --noEmit
```

## Coding Conventions

- **TypeScript strict mode** — no `any` types, explicit return types on exported functions
- **Functional components** with hooks — no class components
- **File naming:** kebab-case for files (`activity-picker.tsx`), PascalCase for components (`ActivityPicker`)
- **Imports:** Use path aliases (`@/components/...`, `@/db/...`, `@/hooks/...`)
- **Styling:** StyleSheet.create() — no inline styles except for dynamic values. Use `TYPOGRAPHY`, `SPACING`, `RADIUS` from `@/constants/theme`. **Colors must come from `useTheme()` / `useThemedStyles()`** — see [`docs/THEMING.md`](./docs/THEMING.md). The static `COLORS` export is light-only and exists for non-React fallbacks; never import it into a component.
- **Design system:** "Fluid Chronometer" — no borders for sectioning (use background color shifts), tonal depth over structural lines. Designs in `design/` folder
- **Error handling:** Always handle loading/error/empty states in UI components
- **Database queries:** All PowerSync queries go through `db/queries.ts` — screens never write raw SQL
- **UUID generation:** Always use `generateId()` from `@/lib/uuid` — `crypto.randomUUID()` is not available in React Native
- **PowerSync React hooks:** Use `useQuery` from `@powersync/react` for reactive queries that auto-update on data changes

## Common Patterns

### Theming & dark mode

Colors come from `useTheme()` / `useThemedStyles()` so styles recompute on Light/Dark switch. Never call `StyleSheet.create({ ... COLORS.x ... })` at module scope, and never import `COLORS` into a `.tsx` component. Full pattern (with code example) + rules: [`docs/THEMING.md`](./docs/THEMING.md).

### Notifications

- `useNotificationScheduler` is **mounted once at the root** and is purely **reactive** — it watches the running-entry query + `notification_preferences` and never gets called imperatively from `useTimer`. Every code path that mutates `time_entries` is automatically covered.
- Quiet hours **defer** `fireAt`, they don't drop it. Wrap every Date with `deferForQuietHours(fireAt, prefs)` from `db/queries.ts` before passing to `scheduleIdleReminder` / `scheduleLongRunningReminder`.

### Local JSON backup & restore

JSON export ([`lib/export-json.ts`](./lib/export-json.ts)) / import ([`lib/import-json.ts`](./lib/import-json.ts)) on the Manage Data screen. Schema rules, importer semantics, replace-mode tombstone handling, and Phase 3 sync intersections: [`docs/BACKUP.md`](./docs/BACKUP.md).

### `time_entries.source` is a closed enum

`source` is stored as TEXT but treated as a closed TS union: `TimeEntrySource = 'timer' | 'manual' | 'retroactive' | 'import'` (defined in `db/models.ts`). The DB column has no CHECK constraint — the guarantee is code-level only.

- **All writes go through `TIME_ENTRY_SOURCES` + `assertTimeEntrySource`** from `db/queries/_helpers.ts`. Never inline a string literal in an INSERT — bind a typed const instead. The `__DEV__`-only assert catches stray values in development.
- **Reads can trust the union.** `TimeEntryRecord.source` is narrowed to `TimeEntrySource | null` in `db/models.ts`, so analytics SQL (`source IN ('timer','manual')` in `notifications.ts`) and downstream Insights queries can rely on a fixed alphabet.

### Reusable component gotchas

- **`GradientButton`** pill shape has `paddingVertical: 16` (~54px tall). For fixed-height rows, use inline `LinearGradient` + `Pressable` instead.
- **`CategoryChip`** does NOT accept a `selected` prop — wrap in a styled `Pressable` with a border for selection state.

Component catalog: browse `components/common/` and `components/insights/`. Hook catalog: `hooks/`. Query functions: `db/queries.ts` (or `db/queries/**`).

### Timezone gotchas

All times stored in UTC; each `time_entry` carries its IANA timezone; display in the entry's original timezone. Helpers live in [`lib/timezone.ts`](./lib/timezone.ts).

- **Never add local minutes to UTC dates directly** — use `localMinutesToDate()` from `useTimelineData.ts`, which accounts for timezone offset.
- **Day boundary queries:** use `getStartOfDay(date, tz)` / `getEndOfDay(date, tz)` — never naive `${date}T00:00:00.000Z` strings (off by UTC offset, clips entries in non-UTC zones). Combine with overlap logic: `started_at <= dayEnd AND (ended_at IS NULL OR ended_at >= dayStart)`.
- **Range aggregations must clip entry durations:** sum `MIN(rangeEnd, ended_at_or_now) - MAX(rangeStart, started_at)`, not the full `duration_seconds`. Otherwise a midnight-spanning entry double-counts across days.

## Important Constraints

- **`npx expo run:ios` required** — PowerSync uses native SQLite (JSI), incompatible with Expo Go
- **Never use setInterval to accumulate timer duration** — always compute from `started_at`
- **All times in UTC** in the database, display in entry's original timezone
- **Soft deletes for user-editable data** — set `deleted_at`, don't hard-delete. `wipeAllInsideTx` is the one exception: it stamps `deleted_at` then clears the tombstones at the end of the same transaction so the JSON importer can re-insert by id. Don't replicate that pattern elsewhere without thinking through the sync implications (`docs/BACKUP.md` → Phase 3 sync intersections).
- **PowerSync `rowsAffected` is unreliable on client tables.** Client tables are JSON-backed views with INSTEAD OF triggers — `tx.execute(...).rowsAffected` can return `0` on successful writes. Don't gate logic on it; use a `RETURNING` clause or a pre/post `SELECT` if you need to confirm a write landed. (Bit us in the JSON importer; see `docs/BACKUP.md`.)
- **Zustand for UI state only** — all persistent data goes through PowerSync
- **No `crypto.randomUUID()`** — use `generateId()` from `@/lib/uuid` instead
- **PowerSync `OPSqliteOpenFactory`** — must be passed explicitly when creating the database instance
- **Local notifications only** — `expo-notifications` is configured for local-scheduled reminders only. No push/remote notifications, and JS cannot run while the app is backgrounded — every nudge must be scheduled at the OS level ahead of time.

## Security (Public Repo — Phase 3 Sync)

This repo is **public on GitHub**. Assume every committed file is world-readable. Before introducing Supabase sync, keep the following in mind:

### Secrets handling

- **Never commit** service role keys, JWT signing secrets, Postgres connection strings, or any `SUPABASE_SERVICE_ROLE_KEY`. These grant full DB access and bypass RLS.
- The Supabase **anon key and project URL are safe to ship** in the client bundle (they're designed to be public) — but only if RLS is correctly enforced on every table.
- Store local dev secrets in `.env` (gitignored). Use Expo's `EXPO_PUBLIC_` prefix only for values that are genuinely public (anon key, project URL). Anything without that prefix stays server-side.
- Store Edge Function secrets via `supabase secrets set` — never hardcode them in function source, since `supabase/functions/**` is committed and public.
- Before any commit that touches `.env`, `supabase/`, or config files, double-check the diff for leaked keys. GitHub secret scanning + push protection should be enabled on the repo as a backstop.

### Row-Level Security (non-negotiable)

- **Every synced table must have RLS enabled** with policies scoped to `auth.uid() = user_id`. No exceptions — a public repo means attackers can read the schema and probe for gaps.
- Write policies for **all four operations** (SELECT, INSERT, UPDATE, DELETE) on every table. A missing policy defaults to deny, but a too-broad one (e.g. `USING (true)`) leaks everything.
- Add a `user_id uuid references auth.users` column to every synced table. PowerSync sync rules must filter by the authenticated user.
- Test RLS with a second user account before shipping — confirm user A cannot read, update, or delete user B's rows via the anon key.
- Soft-deleted rows (`deleted_at IS NOT NULL`) still need RLS — don't assume the client filters them out.

### Edge Functions

- Function source is public. Don't rely on code secrecy for auth logic — assume attackers read it.
- Always re-validate the caller's JWT inside the function (`supabase.auth.getUser()`) — never trust a `user_id` passed in the request body.
- Rate-limit any function that can be invoked anonymously.

### Migrations & seed data

- `supabase/migrations/` and `supabase/seed.sql` are public. Don't embed real user data, test emails, or internal identifiers in seed files.
- Review every migration for `GRANT` statements or `SECURITY DEFINER` functions that could bypass RLS.

### Pre-Phase-3 checklist

- [ ] `.gitignore` covers `.env`, `.env.*` (keep `.env.example` tracked)
- [ ] GitHub secret scanning + push protection enabled in repo settings
- [ ] Decide on LICENSE (affects whether forks are permitted)
- [ ] Document the anon-key-vs-service-role distinction in the Supabase setup step
