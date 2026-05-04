import { db } from "@/lib/powersync";
import { generateId } from "@/lib/uuid";
import {
  getCurrentTimezone,
  getDateInTimezone,
  getEndOfDay,
  getStartOfDay,
  parseLocalTimeOfDay,
} from "@/lib/timezone";
import type { GoalDirection } from "../models";
import type { NotificationPreferencesRecord } from "../schema";
import { nowUTC } from "./_helpers";

/** Minimum long-running threshold in seconds (45 minutes). */
export const LONG_RUNNING_MIN_THRESHOLD_SECONDS = 45 * 60;

/** Idle reminder delay in seconds (30 minutes). */
export const IDLE_REMINDER_DELAY_SECONDS = 30 * 60;

/**
 * SQL query for the singleton notification preferences row.
 * Use with useQuery for reactive reads.
 */
export const NOTIFICATION_PREFERENCES_QUERY = `
  SELECT id, user_id, idle_reminder_enabled, long_running_enabled,
         threshold_override_seconds, has_asked_permission,
         quiet_hours_enabled, quiet_hours_start, quiet_hours_end,
         goal_alerts_enabled,
         created_at, updated_at, deleted_at
  FROM notification_preferences
  WHERE deleted_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1
`;

/** Fetch the singleton notification preferences row (one-shot). */
export async function getNotificationPreferences(): Promise<NotificationPreferencesRecord | null> {
  return db.getOptional<NotificationPreferencesRecord>(
    NOTIFICATION_PREFERENCES_QUERY,
  );
}

export interface NotificationPreferencesPatch {
  idle_reminder_enabled?: number;
  long_running_enabled?: number;
  threshold_override_seconds?: number | null;
  has_asked_permission?: number;
  quiet_hours_enabled?: number;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  goal_alerts_enabled?: number;
}

/** Partial update of the singleton preferences row. */
export async function updateNotificationPreferences(
  patch: NotificationPreferencesPatch,
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (patch.idle_reminder_enabled !== undefined) {
    fields.push("idle_reminder_enabled = ?");
    values.push(patch.idle_reminder_enabled);
  }
  if (patch.long_running_enabled !== undefined) {
    fields.push("long_running_enabled = ?");
    values.push(patch.long_running_enabled);
  }
  if (patch.threshold_override_seconds !== undefined) {
    fields.push("threshold_override_seconds = ?");
    values.push(patch.threshold_override_seconds);
  }
  if (patch.has_asked_permission !== undefined) {
    fields.push("has_asked_permission = ?");
    values.push(patch.has_asked_permission);
  }
  if (patch.quiet_hours_enabled !== undefined) {
    fields.push("quiet_hours_enabled = ?");
    values.push(patch.quiet_hours_enabled);
  }
  if (patch.quiet_hours_start !== undefined) {
    fields.push("quiet_hours_start = ?");
    values.push(patch.quiet_hours_start);
  }
  if (patch.quiet_hours_end !== undefined) {
    fields.push("quiet_hours_end = ?");
    values.push(patch.quiet_hours_end);
  }
  if (patch.goal_alerts_enabled !== undefined) {
    fields.push("goal_alerts_enabled = ?");
    values.push(patch.goal_alerts_enabled);
  }

  if (fields.length === 0) return;

  const now = nowUTC();
  fields.push("updated_at = ?");
  values.push(now);

  await db.execute(
    `UPDATE notification_preferences
     SET ${fields.join(", ")}
     WHERE deleted_at IS NULL`,
    values,
  );
}

/**
 * Inspect whether `fireAt` falls inside the user's quiet-hours window, and
 * if so, where the window ends (so callers that defer can use it). Returns
 * `null` when quiet hours are disabled, the prefs are missing, or no window
 * is configured. Wraps midnight when `end <= start`.
 */
function quietHoursLookup(
  fireAt: Date,
  prefs: NotificationPreferencesRecord | null,
): { isInside: boolean; deferTo: Date } | null {
  if (!prefs || prefs.quiet_hours_enabled !== 1) return null;
  const start = prefs.quiet_hours_start;
  const end = prefs.quiet_hours_end;
  if (!start || !end || start === end) return null;

  const tz = getCurrentTimezone();
  const fireDateStr = getDateInTimezone(fireAt, tz);
  const startToday = parseLocalTimeOfDay(start, fireDateStr, tz);
  const endToday = parseLocalTimeOfDay(end, fireDateStr, tz);
  const wraps = endToday.getTime() <= startToday.getTime();

  if (!wraps) {
    if (fireAt >= startToday && fireAt < endToday) {
      return { isInside: true, deferTo: endToday };
    }
    return { isInside: false, deferTo: fireAt };
  }

  // Window wraps midnight. Two windows are relevant: the one that began
  // yesterday (ending today's `end`) and the one that begins today's `start`
  // (ending tomorrow's `end`).
  const fireMs = fireAt.getTime();
  if (fireMs < endToday.getTime()) {
    const startYesterday = parseLocalTimeOfDay(
      start,
      shiftDateStr(fireDateStr, -1),
      tz,
    );
    if (fireMs >= startYesterday.getTime()) {
      return { isInside: true, deferTo: endToday };
    }
    return { isInside: false, deferTo: fireAt };
  }
  if (fireMs >= startToday.getTime()) {
    const endTomorrow = parseLocalTimeOfDay(
      end,
      shiftDateStr(fireDateStr, 1),
      tz,
    );
    return { isInside: true, deferTo: endTomorrow };
  }
  return { isInside: false, deferTo: fireAt };
}

/**
 * Defer a notification's fire time out of the user's configured quiet-hours
 * window. Returns the original Date if quiet hours are disabled, the prefs
 * are missing, or `fireAt` is outside any window. Otherwise returns the
 * end-of-window Date the reminder should fire at instead.
 *
 * Wraps midnight when `end <= start` (e.g. 22:00 → 07:00).
 */
export function deferForQuietHours(
  fireAt: Date,
  prefs: NotificationPreferencesRecord | null,
): Date {
  const lookup = quietHoursLookup(fireAt, prefs);
  if (!lookup || !lookup.isInside) return fireAt;
  return lookup.deferTo;
}

/**
 * True if `fireAt` falls inside the user's quiet-hours window. Goal alerts
 * use this to *drop* time-of-day-meaningful notifications rather than defer
 * them into the next morning.
 */
export function isInQuietHours(
  fireAt: Date,
  prefs: NotificationPreferencesRecord | null,
): boolean {
  return quietHoursLookup(fireAt, prefs)?.isInside ?? false;
}

function shiftDateStr(dateStr: string, deltaDays: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Returns rows of duration_seconds for the given activity's completed entries
 * in the last 30 days, excluding retroactive/import sources and clipping to
 * [60s, 43200s] to drop accidental taps and forgotten-timer outliers.
 */
export const MEDIAN_DURATION_QUERY = `
  SELECT duration_seconds
  FROM time_entries
  WHERE activity_id = ?
    AND deleted_at IS NULL
    AND ended_at IS NOT NULL
    AND started_at >= ?
    AND source IN ('timer','manual')
    AND duration_seconds BETWEEN 60 AND 43200
  ORDER BY duration_seconds
`;

/** Minimum samples required to trust the per-activity median. */
export const LONG_RUNNING_MIN_SAMPLES = 3;

function median(sortedValues: number[]): number {
  const n = sortedValues.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  if (n % 2 === 1) return sortedValues[mid];
  return (sortedValues[mid - 1] + sortedValues[mid]) / 2;
}

/**
 * Compute the long-running reminder threshold (seconds) for an activity.
 * threshold = max(1.5 * median(recent durations), 45 min).
 * Falls back to the 45 min floor when the activity has fewer than
 * LONG_RUNNING_MIN_SAMPLES completed entries in the last 30 days — a single
 * noisy sample can set an unreasonable threshold for activities that
 * usually run much longer.
 */
export async function computeActivityThreshold(
  activityId: string,
): Promise<number> {
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const rows = await db.getAll<{ duration_seconds: number }>(
    MEDIAN_DURATION_QUERY,
    [activityId, thirtyDaysAgo],
  );
  if (rows.length < LONG_RUNNING_MIN_SAMPLES)
    return LONG_RUNNING_MIN_THRESHOLD_SECONDS;
  const sorted = rows.map((r) => r.duration_seconds);
  const m = median(sorted);
  return Math.max(Math.round(1.5 * m), LONG_RUNNING_MIN_THRESHOLD_SECONDS);
}

/**
 * Unified long-running threshold used by both the notification scheduler
 * and the in-app forgotten-timer modal. Honours `threshold_override_seconds`
 * if set; otherwise falls back to the per-activity median computation.
 */
export async function resolveLongRunningThreshold(
  activityId: string,
): Promise<number> {
  const prefs = await getNotificationPreferences();
  const override = prefs?.threshold_override_seconds ?? null;
  if (override !== null && override > 0) return override;
  return computeActivityThreshold(activityId);
}

// ──────────────────────────────────────────────
// Goal alerts
// ──────────────────────────────────────────────

export type GoalType = "at_most" | "around" | "at_least";

export interface DailyAllocation {
  target_minutes_per_day: number;
  goal_direction: GoalDirection;
}

/**
 * Resolve today's daily allocation for a category. Prefers a `day_of_week`
 * match over the `day_of_week IS NULL` "every day" fallback. Ignores
 * weekly/monthly rows — V1 goal alerts are daily-only.
 *
 * `dayOfWeek` is Monday=0 … Sunday=6 (matches the schema convention).
 */
export async function getDailyAllocationForCategory(
  categoryId: string,
  dayOfWeek: number,
): Promise<DailyAllocation | null> {
  // `day_of_week IS NULL` evaluates to 1/0 in SQLite. ASC sort puts 0 (i.e.
  // a real weekday match) before 1, so the more specific row wins.
  const row = await db.getOptional<{
    target_minutes_per_day: number;
    goal_direction: GoalDirection | null;
  }>(
    `SELECT target_minutes_per_day, goal_direction
     FROM ideal_allocations
     WHERE category_id = ?
       AND deleted_at IS NULL
       AND COALESCE(period_kind, 'daily') = 'daily'
       AND (day_of_week = ? OR day_of_week IS NULL)
     ORDER BY (day_of_week IS NULL) ASC
     LIMIT 1`,
    [categoryId, dayOfWeek],
  );
  if (!row) return null;
  // Legacy NULL goal_direction is treated as 'around' per schema docs.
  return {
    target_minutes_per_day: row.target_minutes_per_day,
    goal_direction: row.goal_direction ?? "around",
  };
}

/**
 * Cumulative seconds tracked under `categoryId` between `dayStartUTC` and
 * `dayEndUTC`, including the running entry (uses `COALESCE(ended_at, 'now')`).
 * Each entry is clipped to the queried range — same pattern as the insights
 * aggregations.
 */
export async function getCategoryDailyTotalSeconds(
  categoryId: string,
  dayStartUTC: string,
  dayEndUTC: string,
): Promise<number> {
  const row = await db.getOptional<{ total_seconds: number }>(
    `SELECT
       COALESCE(SUM(
         MAX(0, CAST(
           (MIN(julianday(?), julianday(COALESCE(te.ended_at, 'now')))
            - MAX(julianday(?), julianday(te.started_at))) * 86400 AS INTEGER
         ))
       ), 0) AS total_seconds
     FROM time_entries te
     JOIN activities a ON a.id = te.activity_id
     WHERE a.category_id = ?
       AND te.deleted_at IS NULL
       AND te.started_at <= ?
       AND (te.ended_at IS NULL OR te.ended_at >= ?)`,
    [dayEndUTC, dayStartUTC, categoryId, dayEndUTC, dayStartUTC],
  );
  return row?.total_seconds ?? 0;
}

/** Convenience: range bounds for `dateStr` in `timezone` as ISO UTC strings. */
export function localDayBoundsUTC(
  dateStr: string,
  timezone: string,
): { startUTC: string; endUTC: string } {
  return {
    startUTC: getStartOfDay(dateStr, timezone).toISOString(),
    endUTC: getEndOfDay(dateStr, timezone).toISOString(),
  };
}

/**
 * True if a goal alert has *already fired* for the
 * `(categoryId, goalType, localDate)` triple — i.e. a row exists and its
 * `scheduled_for` time is in the past. A row with a still-future
 * `scheduled_for` is a *pending* schedule that callers may safely overwrite,
 * so we don't treat it as fired yet. Legacy rows with NULL `scheduled_for`
 * are treated as fired (defensive).
 */
export async function hasGoalAlertFiredToday(
  categoryId: string,
  goalType: GoalType,
  localDate: string,
): Promise<boolean> {
  const row = await db.getOptional<{ scheduled_for: string | null }>(
    `SELECT scheduled_for FROM notification_fires
     WHERE category_id = ? AND goal_type = ? AND local_date = ?
       AND deleted_at IS NULL
     LIMIT 1`,
    [categoryId, goalType, localDate],
  );
  if (!row) return false;
  if (!row.scheduled_for) return true;
  return new Date(row.scheduled_for).getTime() <= Date.now();
}

/**
 * Upsert today's dedup row for a goal alert. `scheduledFor` is the absolute
 * fire time; subsequent reconciliations with a different fire time replace
 * the row in place (so dedup still blocks re-fires after delivery).
 */
export async function recordGoalAlertFire(
  categoryId: string,
  goalType: GoalType,
  localDate: string,
  scheduledFor: Date,
): Promise<void> {
  const now = nowUTC();
  const scheduledForIso = scheduledFor.toISOString();
  const existing = await db.getOptional<{ id: string }>(
    `SELECT id FROM notification_fires
     WHERE category_id = ? AND goal_type = ? AND local_date = ?
       AND deleted_at IS NULL
     LIMIT 1`,
    [categoryId, goalType, localDate],
  );
  if (existing) {
    await db.execute(
      `UPDATE notification_fires
       SET scheduled_for = ?, fired_at = ?, updated_at = ?
       WHERE id = ?`,
      [scheduledForIso, now, now, existing.id],
    );
    return;
  }
  await db.execute(
    `INSERT INTO notification_fires
       (id, user_id, category_id, goal_type, local_date,
        scheduled_for, fired_at, created_at, updated_at)
     VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
    [
      generateId(),
      categoryId,
      goalType,
      localDate,
      scheduledForIso,
      now,
      now,
      now,
    ],
  );
}
