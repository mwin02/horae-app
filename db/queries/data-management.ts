import type { Transaction } from "@powersync/react-native";

import { db } from "@/lib/powersync";
import { cancelAllAppNotifications } from "@/lib/notifications";
import {
  seedNotificationPreferencesIfNeeded,
  seedPresetsIfNeeded,
  seedUserPreferencesIfNeeded,
} from "@/db/seed";
import { nowUTC } from "@/db/queries/_helpers";

/**
 * Wipes every user-owned row across every table, inside an existing
 * transaction. Used by `deleteAllUserData` and by the JSON importer's
 * "replace" mode so the two paths can't drift.
 *
 * Soft-deletes user-editable tables (time_entries, ideal_allocations,
 * tags) so Phase 3 sync can propagate the removal. Hard-deletes
 * categories/activities (preset rows are server-owned globals) and
 * singleton pref rows / cache tables.
 *
 * Does NOT reseed presets or singletons — callers decide whether to
 * follow up with `seedPresetsIfNeeded()` etc.
 */
export async function wipeAllInsideTx(
  tx: Transaction,
  now: string,
): Promise<void> {
  await tx.execute("DELETE FROM entry_tags");
  await tx.execute(
    "UPDATE time_entries SET deleted_at = ?, updated_at = ? WHERE deleted_at IS NULL",
    [now, now],
  );
  await tx.execute(
    "UPDATE ideal_allocations SET deleted_at = ?, updated_at = ? WHERE deleted_at IS NULL",
    [now, now],
  );
  await tx.execute(
    "UPDATE tags SET deleted_at = ?, updated_at = ? WHERE deleted_at IS NULL",
    [now, now],
  );
  await tx.execute("DELETE FROM activities");
  await tx.execute("DELETE FROM categories");
  await tx.execute("DELETE FROM notification_preferences");
  await tx.execute("DELETE FROM user_preferences");
  await tx.execute("DELETE FROM daily_summaries");
}

/**
 * Soft-deletes every time entry plus its tag links. Categories,
 * activities, tags, and prefs are preserved so the user can keep
 * tracking immediately.
 *
 * Soft-deletes (not DELETE) so that when Phase 3 sync ships, other
 * devices learn about the removal — a hard-delete would be invisible
 * to the server and the rows would reappear on the next pull.
 * Cache tables (daily_summaries) are hard-deleted since they're
 * recomputed from time_entries.
 */
export async function deleteAllTimeEntries(): Promise<void> {
  const now = nowUTC();
  await db.writeTransaction(async (tx) => {
    // entry_tags has no deleted_at column — once sync ships, server
    // cascades the parent time_entries soft-delete via trigger.
    await tx.execute("DELETE FROM entry_tags");
    await tx.execute(
      "UPDATE time_entries SET deleted_at = ?, updated_at = ? WHERE deleted_at IS NULL",
      [now, now],
    );
    await tx.execute("DELETE FROM daily_summaries");
  });
  // Any scheduled long-running / idle reminders are now stale — clear them.
  // The reactive scheduler will reschedule on the next running entry.
  await cancelAllAppNotifications();
}

/**
 * Wipes every user-owned row across every table, then re-seeds preset
 * categories/activities and singleton preference rows so the app lands
 * in the same shape as a first launch.
 *
 * User-owned tables (time_entries, ideal_allocations, tags) are
 * soft-deleted for sync compatibility. Categories/activities are
 * hard-deleted because preset rows are server-owned globals (Phase 3)
 * and the seed re-inserts user-created ones with fresh state. Singleton
 * pref rows are hard-deleted then re-seeded.
 */
export async function deleteAllUserData(): Promise<void> {
  const now = nowUTC();
  await db.writeTransaction(async (tx) => {
    await wipeAllInsideTx(tx, now);
  });
  await cancelAllAppNotifications();
  await seedPresetsIfNeeded();
  await seedNotificationPreferencesIfNeeded();
  await seedUserPreferencesIfNeeded();
}
