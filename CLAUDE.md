# Habits App — Claude Code Guide

## Project Overview

A mobile time-tracking app (React Native + Expo, TypeScript) that helps users track how they spend their days and provides insights on time allocation vs personal goals. Offline-first with cloud sync.

## Tech Stack

- **Mobile:** React Native + Expo (TypeScript), Expo Router (file-based routing)
- **Offline DB + Sync:** PowerSync (SQLite under the hood, syncs with Supabase)
- **Backend/DB:** Supabase (PostgreSQL, Auth, Row-Level Security, Edge Functions)
- **State:** Zustand (ephemeral UI state only — all persistent data lives in PowerSync/SQLite)
- **Notifications:** expo-notifications (local)

## Project Structure

```
habits-app/
├── app/                    # Expo Router screens (file-based routing)
│   ├── (tabs)/             # Tab navigator
│   │   ├── index.tsx       # Home/Timer tab
│   │   ├── timeline.tsx    # Day Timeline tab
│   │   ├── insights.tsx    # Insights tab
│   │   └── settings.tsx    # Settings tab
│   └── _layout.tsx         # Root layout
├── components/             # Reusable UI components
│   ├── timer/              # Timer display, activity picker, quick-switch
│   ├── timeline/           # Timeline blocks, gap filler
│   ├── insights/           # Charts, comparison bars
│   └── common/             # Shared buttons, modals, toasts
├── db/                     # PowerSync schema, types, queries
│   ├── schema.ts           # PowerSync table definitions
│   ├── models.ts           # TypeScript types for all tables
│   └── queries.ts          # Reusable query functions
├── hooks/                  # Custom React hooks
├── lib/                    # Library initializations (supabase, powersync, timezone)
├── store/                  # Zustand stores (UI state only)
├── constants/              # Preset data, colors, config
├── supabase/               # Supabase migrations, seed data, Edge Functions
│   ├── migrations/
│   ├── seed.sql
│   └── functions/
└── app.config.ts           # Expo configuration
```

## Key Architecture Decisions

1. **Offline-first:** All writes go to local SQLite via PowerSync. Sync to Supabase happens in background when online.
2. **No separate backend:** Supabase handles everything (REST API, Auth, Edge Functions). No Next.js.
3. **Deferred auth:** App is fully usable without an account. Auth is optional for sync/backup.
4. **Timer state:** The running timer is a `time_entries` row with `ended_at = null` in PowerSync. Elapsed time is always computed as `now - started_at` (never accumulated via setInterval).
5. **Timezones:** All times stored in UTC. Each time_entry stores its IANA timezone at creation. Display in original timezone.

## Data Model (Core Tables)

- **categories** — Work, Sleep, Health, etc. Has `sort_order`, `is_archived`, `is_preset`
- **activities** — Belongs to a category. E.g., "Deep Work" under "Work"
- **time_entries** — Core data. `started_at`, `ended_at`, `duration_seconds`, `timezone`, `note`, `source` (timer/manual/retroactive/import)
- **ideal_allocations** — User's target minutes per day per category
- **daily_summaries** — Pre-aggregated daily totals (computed, not user-edited)

All synced tables have `updated_at`, `deleted_at` (soft delete) columns.

## Development Commands

```bash
# Start Expo dev server
npx expo start

# Build development client (required — Expo Go won't work with PowerSync/JSI)
eas build --profile development --platform ios
eas build --profile development --platform android

# Run on simulator
npx expo run:ios
npx expo run:android

# Type check
npx tsc --noEmit

# Lint
npx expo lint

# Run tests
npx jest
```

## Coding Conventions

- **TypeScript strict mode** — no `any` types, explicit return types on exported functions
- **Functional components** with hooks — no class components
- **File naming:** kebab-case for files (`activity-picker.tsx`), PascalCase for components (`ActivityPicker`)
- **Imports:** Use path aliases (`@/components/...`, `@/db/...`, `@/hooks/...`)
- **Styling:** StyleSheet.create() — no inline styles except for dynamic values
- **Error handling:** Always handle loading/error/empty states in UI components
- **Database queries:** All PowerSync queries go through `db/queries.ts` — screens never write raw SQL

## Common Patterns

### Starting/stopping timer
```typescript
// Always use the useTimer hook — never manipulate time_entries directly from screens
const { startActivity, stopActivity, switchActivity, runningEntry } = useTimer();
```

### Quick-switch
One tap stops current activity and starts new one. No confirmation modal. Show toast.

### Forgotten stop detection
On app foreground, check for `time_entries` where `ended_at IS NULL`. If found and stale (>2h or different day), show bottom sheet.

## Important Constraints

- **EAS Development Builds required** — PowerSync uses JSI which is incompatible with Expo Go
- **Never use setInterval to accumulate timer duration** — always compute from `started_at`
- **All times in UTC** in the database, display in entry's original timezone
- **Soft deletes only** — use `deleted_at` column, never hard delete (needed for sync)
- **Zustand for UI state only** — all persistent data goes through PowerSync
