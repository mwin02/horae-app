# Local JSON backup & restore

Pre-cloud-sync feature that lets users export the entire local database to a JSON file and re-import it later. Lives on the Manage Data screen (Settings → Manage data). Designed so a user who has to delete and reinstall the app on iOS doesn't lose everything.

This document is the source of truth for backup mechanics, soft-delete interactions, and the contracts cloud-sync work (Phase 3) needs to honor. CLAUDE.md links here from its "Local JSON backup & restore" section.

---

## Files at a glance

| File | Role |
| --- | --- |
| [`lib/export-json.ts`](../lib/export-json.ts) | Builds the JSON payload and presents the OS share sheet. |
| [`lib/import-json.ts`](../lib/import-json.ts) | Opens the document picker, validates the file, runs the import inside one PowerSync write transaction. |
| [`components/manage/import-data-modal.tsx`](../components/manage/import-data-modal.tsx) | Bottom-sheet UI for choosing merge vs replace and triggering the picker. |
| [`app/manage-data.tsx`](../app/manage-data.tsx) | Hosts the Manage Data screen: About card, Back up, Restore, Danger zone. |
| [`db/queries/data-management.ts`](../db/queries/data-management.ts) | `wipeAllInsideTx`, `deleteAllTimeEntries`, `deleteAllUserData`. Shared between Danger Zone and the importer's replace mode. |

---

## The JSON payload

```json
{
  "exported_at": "2026-05-20T12:34:56.000Z",
  "app_version": "1.0.0",
  "schema_version": 1,
  "tables": {
    "categories":               [ ... ],
    "activities":               [ ... ],
    "time_entries":             [ ... ],
    "ideal_allocations":        [ ... ],
    "tags":                     [ ... ],
    "entry_tags":               [ ... ],
    "notification_preferences": [ ... ],
    "user_preferences":         [ ... ],
    "insight_preferences":      [ ... ]
  }
}
```

**Tables intentionally omitted:** `notification_fires` (goal-alert dedup cache) and `daily_summaries` (computed aggregation cache). Both are recomputable from real data — exporting them would just add weight and risk drift.

**Rows included:** only alive rows (`deleted_at IS NULL`). `entry_tags` has no `deleted_at` of its own, so the exporter filters it by joining against `time_entries.deleted_at IS NULL`.

**Schema version:** stays at `1` until row shape changes (column added or removed in a way that breaks consumers). When you bump it, update both the exporter constant and the validator branch in `parseAndValidate`; the importer rejects mismatched files with a friendly message.

---

## Two modes

### Add to what's already here (merge)

Additive. For every imported row:

1. Look up the local row by `id` with a pre-`SELECT` (not `INSERT OR IGNORE`, see [the `rowsAffected` gotcha](#powersync-rowsaffected-is-unreliable) below).
2. Three outcomes:
   - **No local row** → `INSERT`, counted as inserted.
   - **Local row alive** → skip. The device wins on collisions; nothing imported gets overwritten.
   - **Local row tombstoned** (`deleted_at IS NOT NULL`) → `UPDATE` every column from the imported row, which also clears the tombstone implicitly (the exported `deleted_at` is `NULL`). Counted as inserted.

Singleton-pref rows (`notification_preferences`, `user_preferences`, `insight_preferences`) are **always skipped** in merge mode — the device's current prefs win.

### Replace what's on this device (replace)

The file is the new truth.

1. Call `wipeAllInsideTx(tx, now)` inside the import transaction. This:
   - Hard-deletes `entry_tags`, `activities`, `categories`, `daily_summaries`, and all singleton-pref tables.
   - Soft-deletes (stamps `deleted_at = now`) `time_entries`, `ideal_allocations`, `tags`. The soft-delete moment is still observable within the transaction (preserves the Phase 3 sync hook story).
   - **Then hard-deletes the just-tombstoned rows in those three tables.** This is critical: without it, every imported row whose id matches a tombstone would silently skip because PowerSync still sees the row.
2. Insert every row from the file via the same per-row pre-SELECT path. Since the wipe cleared everything, the path always lands on "no local row → INSERT".
3. After the transaction, if any singleton-pref table is missing from the file, fall back to its `seed*IfNeeded` so the singleton always exists.

Replace cancels all scheduled notifications too (same as `deleteAllUserData`), because the running-entry view is gone and the reactive scheduler will reschedule from scratch.

---

## Soft-delete + tombstone interaction

The schema keeps a `deleted_at` column on user-editable tables for future sync compatibility (so a synced peer can learn the row was removed). But the importer's `INSERT OR IGNORE` semantics meant tombstones blocked re-import on the same `id`.

The fix is split across two layers:

- **Wipe layer** clears tombstones at the end of `wipeAllInsideTx` for `time_entries` / `ideal_allocations` / `tags` so replace-mode imports start from a truly empty table.
- **Importer layer** detects tombstones per row (via the pre-SELECT) and resurrects them with an UPDATE, so merge-mode after a partial delete still restores the user's data.

If a future change adds another table with `deleted_at`, both layers need to be aware. Today the importer auto-handles it (it checks for `deleted_at` in the row's column list), but `wipeAllInsideTx` is hand-written and would need a matching tombstone cleanup.

---

## Stable preset ids

Preset categories and activities use **slug-based ids hardcoded in [`constants/presets.ts`](../constants/presets.ts)** (e.g. `preset-cat-work`, `preset-act-work-deep-work`). The seed in [`db/seed.ts`](../db/seed.ts) writes those literal ids, not `generateId()`.

Required because the backup feature has to round-trip across "Delete all data" cycles: random UUIDs would change on every re-seed, so the importer would think every preset in the file was new and `INSERT` duplicates. With stable ids, re-seed produces the same ids the file already has, the pre-SELECT correctly identifies the alive row, and merge skips it.

**Never change an existing preset id.** It would orphan every `time_entries.activity_id` and `ideal_allocations.category_id` that references it. Add new presets with new ids; never reassign.

---

## PowerSync `rowsAffected` is unreliable

PowerSync's client tables are **JSON-backed views with INSTEAD OF triggers**, not real tables. The DBAdapter type doc explicitly warns:

> `rowsAffected` may be `0` for successful UPDATE and DELETE statements. Use a `RETURNING` clause and inspect `rows` when you need to confirm which rows changed.

The same caveat applies to INSERT through the view. The importer initially counted successes via `result.rowsAffected` after `INSERT OR IGNORE`; this produced "Restore complete: nothing was added" alerts after real, successful restores. The current implementation does not consult `rowsAffected` anywhere — it decides everything via the pre-SELECT.

When writing future sync / reconciliation code: do the same. Don't trust `rowsAffected` from any write going through a client view.

---

## Phase 3 sync intersections

When PowerSync starts syncing the tables to Supabase, these are the touch points to think through:

1. **Preset rows go server-side.** `categories` and `activities` rows with `is_preset = 1` are server-owned globals in Phase 3 (see [`supabase/DESIGN.md`](../supabase/DESIGN.md)). Stable slug ids are a precondition — they make the client/server identity match without a remap step.

2. **The local importer is not a sync engine.** The pre-SELECT + resurrect logic is sufficient for "one device, restore from your own file." It does NOT handle: conflict resolution against a server pull, `user_id` rewriting on imported rows, or duplicate detection across devices. Expect this to need design work.

3. **`user_id` on imported rows.** Today the exporter writes whatever the local row has (null pre-auth). After auth ships, the importer should probably rewrite `user_id` to the current user on every imported row to prevent restoring someone else's data into your account. Decide before flipping `entry_tags` to `localOnly: false`.

4. **Soft-delete cleanup vs sync.** `wipeAllInsideTx` hard-deletes tombstones at the end of its transaction. Once `time_entries` flips off `localOnly`, that hard-delete happens before the sync engine has a chance to upload the soft-delete. Strategies:
   - Defer the tombstone cleanup until after the soft-delete upload confirms (requires hooking the upload-complete callback).
   - Or, accept that wiping a device while offline + then syncing means peers see the inserts/updates ordering rather than the wipe (since the tombstones never made it out). May be acceptable depending on the wipe UX.
   - Either way, this needs an explicit decision at Phase 3.

5. **Singleton-pref handling.** Three tables are skipped in merge mode and re-seeded if missing in replace mode. After auth, the same rows exist on the server keyed by `user_id`. The replace-mode fallback to `seed*IfNeeded` should be guarded so it doesn't run if a sync pull is about to deliver the row.

---

## Open TODOs

These were planned during the import feature build and shelved; revisit before Phase 3 or when adding new exportable tables.

- **`seedInsightPreferencesIfNeeded` is missing.** `db/seed.ts` has seed functions for `notification_preferences` and `user_preferences` but not `insight_preferences`. The importer's replace-mode singleton fallback only re-seeds the first two, so a backup file missing `insight_preferences` leaves the table empty. Today that's harmless because the table's columns all default-to-NULL, but it's inconsistent. Add the seed and have the fallback iterate all singleton-pref tables uniformly.

- **Sync-table catalog (planned, not landed).** Adding a new exportable table currently touches ~6 spots: `db/schema.ts`, `lib/export-json.ts` (×4), `lib/import-json.ts` (×3), `app/manage-data.tsx` (friendly name map). A catalog file (`db/sync-tables.ts`) was designed to centralize this so one entry covers exporter, importer, friendly names, and the singleton-fallback iteration. See the plan at [`~/.claude/plans/we-already-have-an-swift-star.md`](../../.claude/plans/we-already-have-an-swift-star.md) for the shape.

- **Lazy migration for legacy preset ids.** TestFlight installs from before the stable-id migration have random-UUID presets. Today the "fix" is "user runs Delete all data once." For broader rollout, write a one-shot migration: scan `categories` for `is_preset = 1` rows whose id isn't in the stable-id set, match by name to the stable-id row, UPDATE all `time_entries.activity_id` / `ideal_allocations.category_id` references, then DELETE the random-id row.
