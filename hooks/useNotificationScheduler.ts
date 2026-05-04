import { useQuery } from "@powersync/react";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import {
  DEFAULT_WEEK_START_DAY,
  IDLE_REMINDER_DELAY_SECONDS,
  NOTIFICATION_PREFERENCES_QUERY,
  USER_PREFERENCES_QUERY,
  deferForQuietHours,
  getCategoryRangeTotalSeconds,
  getEffectiveAllocationForCategory,
  hasGoalAlertFiredForPeriod,
  isInQuietHours,
  localDayBoundsUTC,
  recordGoalAlertFire,
  resolveLongRunningThreshold,
  updateNotificationPreferences,
  type GoalAlertPeriodKind,
  type GoalType,
} from "@/db/queries";
import type {
  NotificationPreferencesRecord,
  UserPreferencesRecord,
} from "@/db/schema";
import { getWeekRange } from "@/hooks/useInsightsData";
import {
  getEndOfDay,
  getStartOfDay,
  getTodayDate,
} from "@/lib/timezone";
import {
  cancelAllGoalAlerts,
  cancelGoalAlertForCategory,
  cancelIdleReminder,
  cancelLongRunningReminder,
  configureNotificationHandler,
  GOAL_ALERT_PREFIX,
  getScheduledIds,
  hasNotificationPermission,
  requestPermissionsIfNeeded,
  scheduleGoalAlert,
  scheduleIdleReminder,
  scheduleLongRunningReminder,
} from "@/lib/notifications";

// Aggregate fingerprint over time_entries — `MAX(updated_at)` shifts on
// every insert/update (including soft deletes, which set updated_at), and
// `COUNT(*)` catches any hard insert. Subscribing keeps the goal-alert
// reconciler in sync when entries are added/edited/deleted *outside* the
// running entry.
const TIME_ENTRIES_FINGERPRINT_QUERY = `
  SELECT MAX(updated_at) AS max_updated, COUNT(*) AS cnt
  FROM time_entries
`;

// Same fingerprint pattern for ideal_allocations — mid-session edits to a
// category's target/direction/period_kind shift the projected fire time, and
// removing the allocation should cancel any pending goal alert.
const IDEAL_ALLOCATIONS_FINGERPRINT_QUERY = `
  SELECT MAX(updated_at) AS max_updated, COUNT(*) AS cnt
  FROM ideal_allocations
`;

interface TableFingerprintRow {
  max_updated: string | null;
  cnt: number;
}

const RUNNING_ENTRY_FOR_SCHEDULER_QUERY = `
  SELECT
    te.id          AS entry_id,
    te.activity_id AS activity_id,
    te.started_at  AS started_at,
    te.timezone    AS timezone,
    a.name         AS activity_name,
    c.id           AS category_id,
    c.name         AS category_name
  FROM time_entries te
  JOIN activities a ON a.id = te.activity_id
  JOIN categories c ON c.id = a.category_id
  WHERE te.ended_at IS NULL
    AND te.deleted_at IS NULL
  ORDER BY te.started_at DESC
  LIMIT 1
`;

interface RunningRow {
  entry_id: string;
  activity_id: string;
  started_at: string;
  timezone: string;
  activity_name: string;
  category_id: string;
  category_name: string;
}

const LONG_RUNNING_PREFIX = "long-running-";
const IDLE_REMINDER_ID = "idle-reminder";

configureNotificationHandler();

/**
 * Declarative scheduler for local notifications. Mount once at the root,
 * inside the PowerSync provider.
 *
 * Drives two reminders off of:
 *   - the running-entry PowerSync query (reacts to start/stop/switch)
 *   - the singleton notification_preferences row (global toggles)
 *   - AppState foreground transitions (orphan cleanup + permission recheck)
 *
 * No UI. No imperative hooks into useTimer — reconciliation is driven by
 * state changes so every code path that mutates time_entries is covered.
 */
export function useNotificationScheduler(): void {
  const { data: runningData } = useQuery<RunningRow>(
    RUNNING_ENTRY_FOR_SCHEDULER_QUERY,
  );
  const { data: prefsData } = useQuery<NotificationPreferencesRecord>(
    NOTIFICATION_PREFERENCES_QUERY,
  );
  const { data: userPrefsData } = useQuery<UserPreferencesRecord>(
    USER_PREFERENCES_QUERY,
  );
  const { data: fingerprintData } = useQuery<TableFingerprintRow>(
    TIME_ENTRIES_FINGERPRINT_QUERY,
  );
  const { data: allocationsFingerprintData } = useQuery<TableFingerprintRow>(
    IDEAL_ALLOCATIONS_FINGERPRINT_QUERY,
  );

  const running = runningData.length > 0 ? runningData[0] : null;
  const prefs = prefsData.length > 0 ? prefsData[0] : null;
  const userPrefs = userPrefsData.length > 0 ? userPrefsData[0] : null;
  const weekStartDay = userPrefs?.week_start_day ?? DEFAULT_WEEK_START_DAY;
  const fingerprintRow = fingerprintData.length > 0 ? fingerprintData[0] : null;
  const entriesFingerprint = fingerprintRow
    ? `${fingerprintRow.max_updated ?? ""}|${fingerprintRow.cnt}`
    : "";
  const allocationsFingerprintRow =
    allocationsFingerprintData.length > 0
      ? allocationsFingerprintData[0]
      : null;
  const allocationsFingerprint = allocationsFingerprintRow
    ? `${allocationsFingerprintRow.max_updated ?? ""}|${allocationsFingerprintRow.cnt}`
    : "";

  const idleEnabled = prefs?.idle_reminder_enabled === 1;
  const longRunningEnabled = prefs?.long_running_enabled === 1;
  const goalAlertsEnabled = prefs?.goal_alerts_enabled === 1;
  const thresholdOverride = prefs?.threshold_override_seconds ?? null;
  const quietHoursEnabled = prefs?.quiet_hours_enabled === 1;
  const quietHoursStart = prefs?.quiet_hours_start ?? null;
  const quietHoursEnd = prefs?.quiet_hours_end ?? null;

  const prevEntryIdRef = useRef<string | null | undefined>(undefined);
  const prevStartedAtRef = useRef<string | null | undefined>(undefined);
  const prevCategoryIdRef = useRef<string | null | undefined>(undefined);
  const prevActivityIdRef = useRef<string | null | undefined>(undefined);
  const prevIdleEnabledRef = useRef<boolean | undefined>(undefined);
  const prevLongRunningEnabledRef = useRef<boolean | undefined>(undefined);
  const prevGoalAlertsEnabledRef = useRef<boolean | undefined>(undefined);
  const prevQuietHoursKeyRef = useRef<string | undefined>(undefined);
  const permissionAskedRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // One-time permission prompt gated on the seeded prefs row.
  useEffect(() => {
    if (!prefs || permissionAskedRef.current) return;
    if (prefs.has_asked_permission === 1) {
      permissionAskedRef.current = true;
      return;
    }
    permissionAskedRef.current = true;
    void (async () => {
      try {
        await requestPermissionsIfNeeded(false);
      } finally {
        await updateNotificationPreferences({ has_asked_permission: 1 });
      }
    })();
  }, [prefs]);

  // Core reconciliation: react to running-entry transitions.
  useEffect(() => {
    if (!prefs) return;

    const prev = prevEntryIdRef.current;
    const currId = running?.entry_id ?? null;

    void (async () => {
      const granted = await hasNotificationPermission();
      if (!granted) {
        prevEntryIdRef.current = currId;
        prevStartedAtRef.current = running?.started_at ?? null;
        return;
      }

      const prevCategoryId = prevCategoryIdRef.current;
      const currCategoryId = running?.category_id ?? null;
      const prevActivityId = prevActivityIdRef.current;
      const currActivityId = running?.activity_id ?? null;

      // First observation after mount: only ensure long-running is in place.
      if (prev === undefined) {
        if (running !== null && longRunningEnabled) {
          await scheduleLongRunningForEntry(running, prefs);
        }
        if (running !== null && goalAlertsEnabled) {
          await reconcileGoalAlertForEntry(running, prefs, weekStartDay);
        }
        prevEntryIdRef.current = currId;
        prevStartedAtRef.current = running?.started_at ?? null;
        prevCategoryIdRef.current = currCategoryId;
        prevActivityIdRef.current = currActivityId;
        return;
      }

      if (prev === null && currId !== null && running !== null) {
        await cancelIdleReminder();
        if (longRunningEnabled) {
          await scheduleLongRunningForEntry(running, prefs);
        }
        if (goalAlertsEnabled) {
          await reconcileGoalAlertForEntry(running, prefs, weekStartDay);
        }
      } else if (prev !== null && currId === null) {
        await cancelLongRunningReminder(prev);
        if (prevCategoryId) {
          await cancelGoalAlertForCategory(prevCategoryId);
        }
        if (idleEnabled) {
          await scheduleIdleAt(prefs);
        }
      } else if (
        prev !== null &&
        currId !== null &&
        prev !== currId &&
        running !== null
      ) {
        await cancelLongRunningReminder(prev);
        if (longRunningEnabled) {
          await scheduleLongRunningForEntry(running, prefs);
        }
        // Cancel only if category changed — switching activities within the
        // same category leaves the existing goal alert intact.
        if (prevCategoryId && prevCategoryId !== currCategoryId) {
          await cancelGoalAlertForCategory(prevCategoryId);
        }
        if (goalAlertsEnabled) {
          await reconcileGoalAlertForEntry(running, prefs, weekStartDay);
        }
      } else if (
        prev !== null &&
        currId !== null &&
        prev === currId &&
        running !== null
      ) {
        // In-place edit on the running entry. Detect what changed and only
        // do the work needed for that change.
        const startedAtChanged =
          prevStartedAtRef.current !== undefined &&
          prevStartedAtRef.current !== running.started_at;
        const activityChanged =
          prevActivityId !== undefined &&
          prevActivityId !== null &&
          prevActivityId !== currActivityId;
        const categoryChanged =
          prevCategoryId !== undefined &&
          prevCategoryId !== null &&
          prevCategoryId !== currCategoryId;

        // Long-running re-anchors on started_at edits OR activity changes
        // (the threshold is per-activity median).
        if (startedAtChanged || activityChanged) {
          await cancelLongRunningReminder(currId);
          if (longRunningEnabled) {
            await scheduleLongRunningForEntry(running, prefs);
          }
        }

        // Goal alert: drop the old category's pending alert when the
        // category changed mid-entry, then reconcile for the new context.
        if (categoryChanged && prevCategoryId) {
          await cancelGoalAlertForCategory(prevCategoryId);
        }
        if (
          (startedAtChanged || categoryChanged) &&
          goalAlertsEnabled
        ) {
          await reconcileGoalAlertForEntry(running, prefs, weekStartDay);
        }
      }

      prevEntryIdRef.current = currId;
      prevStartedAtRef.current = running?.started_at ?? null;
      prevCategoryIdRef.current = currCategoryId;
      prevActivityIdRef.current = currActivityId;
    })();
  }, [
    prefs,
    running?.entry_id,
    running?.started_at,
    running?.activity_name,
    running?.activity_id,
    running?.category_id,
    idleEnabled,
    longRunningEnabled,
    goalAlertsEnabled,
    thresholdOverride,
    weekStartDay,
    running,
  ]);

  // React to toggle flips that don't coincide with a running-entry transition.
  // e.g. flipping "Still there?" on while stopped should start the 30-min idle
  // timer immediately; flipping it off should cancel any pending reminder.
  useEffect(() => {
    if (!prefs) return;
    const prevIdle = prevIdleEnabledRef.current;
    const prevLongRunning = prevLongRunningEnabledRef.current;
    const prevGoalAlerts = prevGoalAlertsEnabledRef.current;
    prevIdleEnabledRef.current = idleEnabled;
    prevLongRunningEnabledRef.current = longRunningEnabled;
    prevGoalAlertsEnabledRef.current = goalAlertsEnabled;
    if (
      prevIdle === undefined ||
      prevLongRunning === undefined ||
      prevGoalAlerts === undefined
    )
      return;

    const idleChanged = prevIdle !== idleEnabled;
    const longRunningChanged = prevLongRunning !== longRunningEnabled;
    const goalAlertsChanged = prevGoalAlerts !== goalAlertsEnabled;
    if (!idleChanged && !longRunningChanged && !goalAlertsChanged) return;

    void (async () => {
      const granted = await hasNotificationPermission();
      if (!granted) return;

      if (idleChanged) {
        if (idleEnabled && running === null) {
          await scheduleIdleAt(prefs);
        } else if (!idleEnabled) {
          await cancelIdleReminder();
        }
      }

      if (longRunningChanged && running !== null) {
        if (longRunningEnabled) {
          await scheduleLongRunningForEntry(running, prefs);
        } else {
          await cancelLongRunningReminder(running.entry_id);
        }
      }

      if (goalAlertsChanged) {
        if (!goalAlertsEnabled) {
          await cancelAllGoalAlerts();
        } else if (running !== null) {
          await reconcileGoalAlertForEntry(running, prefs, weekStartDay);
        }
      }
    })();
  }, [
    idleEnabled,
    longRunningEnabled,
    goalAlertsEnabled,
    prefs,
    running,
    weekStartDay,
  ]);

  // Re-reconcile goal alerts when *any* time_entries row changes — retro
  // adds/edits/deletes shift today's cumulative for the running category and
  // therefore the projected fire time. Time-aware dedup
  // (`hasGoalAlertFiredToday` checks `scheduled_for <= now`) means a still-
  // pending schedule gets overwritten with the new fire time, while a
  // delivered alert stays deduped.
  useEffect(() => {
    if (!prefs || !goalAlertsEnabled || running === null) return;
    if (entriesFingerprint === "") return; // initial mount, no data yet
    void (async () => {
      const granted = await hasNotificationPermission();
      if (!granted) return;
      await reconcileGoalAlertForEntry(running, prefs, weekStartDay);
    })();
  }, [
    entriesFingerprint,
    allocationsFingerprint,
    goalAlertsEnabled,
    prefs,
    running,
    weekStartDay,
  ]);

  // Re-reconcile when quiet-hours fields change so an active schedule shifts
  // to (or away from) the deferred fire time without waiting for the next
  // entry transition or app foreground.
  useEffect(() => {
    if (!prefs) return;
    const key = `${quietHoursEnabled ? 1 : 0}|${quietHoursStart ?? ""}|${quietHoursEnd ?? ""}`;
    const prev = prevQuietHoursKeyRef.current;
    prevQuietHoursKeyRef.current = key;
    if (prev === undefined || prev === key) return;

    void (async () => {
      const granted = await hasNotificationPermission();
      if (!granted) return;
      if (running !== null && longRunningEnabled) {
        await scheduleLongRunningForEntry(running, prefs);
      }
      if (running !== null && goalAlertsEnabled) {
        await reconcileGoalAlertForEntry(running, prefs, weekStartDay);
      }
      if (running === null && idleEnabled) {
        // Only reschedule the idle reminder if one is already pending —
        // otherwise we'd be inventing a brand-new reminder out of a config
        // change, which is the wrong UX.
        const ids = await getScheduledIds();
        if (ids.includes(IDLE_REMINDER_ID)) {
          await scheduleIdleAt(prefs);
        }
      }
    })();
  }, [
    prefs,
    quietHoursEnabled,
    quietHoursStart,
    quietHoursEnd,
    idleEnabled,
    longRunningEnabled,
    goalAlertsEnabled,
    weekStartDay,
    running,
  ]);

  // Foreground reconciliation: drop orphaned schedules and recheck permission.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const wasBackgrounded = appStateRef.current.match(/inactive|background/);
      appStateRef.current = nextState;
      if (!wasBackgrounded || nextState !== "active") return;

      void (async () => {
        const granted = await hasNotificationPermission();
        if (!granted) return;
        const currId = running?.entry_id ?? null;
        const currCategoryId = running?.category_id ?? null;
        const ids = await getScheduledIds();
        for (const id of ids) {
          if (id === IDLE_REMINDER_ID && currId !== null) {
            await cancelIdleReminder();
          } else if (id.startsWith(LONG_RUNNING_PREFIX)) {
            const entryId = id.slice(LONG_RUNNING_PREFIX.length);
            if (entryId !== currId) {
              await cancelLongRunningReminder(entryId);
            }
          } else if (id.startsWith(GOAL_ALERT_PREFIX)) {
            const categoryId = id.slice(GOAL_ALERT_PREFIX.length);
            if (categoryId !== currCategoryId) {
              await cancelGoalAlertForCategory(categoryId);
            }
          }
        }
      })();
    });

    return () => {
      subscription.remove();
    };
  }, [running?.entry_id]);
}

async function scheduleLongRunningForEntry(
  row: RunningRow,
  prefs: NotificationPreferencesRecord | null,
): Promise<void> {
  const threshold = await resolveLongRunningThreshold(row.activity_id);
  const startedAt = new Date(row.started_at).getTime();
  const rawFireAt = new Date(startedAt + threshold * 1000);
  const fireAt = deferForQuietHours(rawFireAt, prefs);
  // firesAfterSeconds drives the body copy ("Xh Ym so far") — keep it tied to
  // the threshold rather than the deferred wall-clock time so it stays
  // truthful about elapsed work, not elapsed wait.
  await scheduleLongRunningReminder({
    entryId: row.entry_id,
    activityName: row.activity_name,
    fireAt,
    firesAfterSeconds: threshold,
  });
}

function scheduleIdleAt(prefs: NotificationPreferencesRecord | null): Promise<void> {
  const rawFireAt = new Date(Date.now() + IDLE_REMINDER_DELAY_SECONDS * 1000);
  return scheduleIdleReminder(deferForQuietHours(rawFireAt, prefs));
}

/** Mon=0 … Sun=6 for a `YYYY-MM-DD` string (matches schema convention). */
function weekdayMondayZero(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const jsDay = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay(); // 0=Sun
  return (jsDay + 6) % 7;
}

/**
 * Compute & schedule the goal alert for the running entry's category, if any.
 * Bails on: no allocation, already-fired in the period, fire time inside
 * quiet hours.
 *
 * The allocation's `period_kind` (daily or weekly — weekly takes precedence
 * when both exist) controls the cumulative window: a single local day for
 * daily, or the user's configured week (`week_start_day`) for weekly. The
 * dedup row is keyed on `(category, goal_type, period_kind, period_start)`
 * so daily and weekly alerts coexist on the same category.
 *
 * `at_most`: fires 15 min before target. If target ≤ 15 min, fires
 *   immediately (the warning window has already closed).
 * `around` / `at_least`: fires when cumulative reaches target.
 *
 * Records the fire in `notification_fires` at schedule time — JS can't
 * observe delivery in background, and this prevents re-firing within the
 * same period across stop/restart cycles.
 */
async function reconcileGoalAlertForEntry(
  row: RunningRow,
  prefs: NotificationPreferencesRecord | null,
  weekStartDay: number,
): Promise<void> {
  const localDate = getTodayDate(row.timezone);
  const dayOfWeek = weekdayMondayZero(localDate);
  const allocation = await getEffectiveAllocationForCategory(
    row.category_id,
    dayOfWeek,
  );
  if (!allocation) {
    // Allocation removed (or never set). Drop any pending goal alert so a
    // mid-session deletion of the allocation doesn't leave a stale buzz
    // queued. Idempotent — cancels nothing if nothing's scheduled.
    await cancelGoalAlertForCategory(row.category_id);
    return;
  }

  const periodKind: GoalAlertPeriodKind = allocation.period_kind;
  const goalType: GoalType = allocation.goal_direction;

  let periodStart: string;
  let startUTC: string;
  let endUTC: string;
  if (periodKind === "weekly") {
    const { weekStart, weekEnd } = getWeekRange(localDate, weekStartDay);
    periodStart = weekStart;
    startUTC = getStartOfDay(weekStart, row.timezone).toISOString();
    endUTC = getEndOfDay(weekEnd, row.timezone).toISOString();
  } else {
    periodStart = localDate;
    const bounds = localDayBoundsUTC(localDate, row.timezone);
    startUTC = bounds.startUTC;
    endUTC = bounds.endUTC;
  }

  if (
    await hasGoalAlertFiredForPeriod(
      row.category_id,
      goalType,
      periodKind,
      periodStart,
    )
  )
    return;

  const targetSeconds = allocation.target_minutes * 60;
  const thresholdSeconds =
    goalType === "at_most"
      ? Math.max(0, targetSeconds - 15 * 60)
      : targetSeconds;

  const cumulative = await getCategoryRangeTotalSeconds(
    row.category_id,
    startUTC,
    endUTC,
  );
  const remaining = thresholdSeconds - cumulative;
  const fireAt =
    remaining > 0
      ? new Date(Date.now() + remaining * 1000)
      : new Date(Date.now() + 1000);

  if (isInQuietHours(fireAt, prefs)) return;

  await scheduleGoalAlert({
    categoryId: row.category_id,
    categoryName: row.category_name,
    goalType,
    periodKind,
    fireAt,
  });
  await recordGoalAlertFire(
    row.category_id,
    goalType,
    periodKind,
    periodStart,
    fireAt,
  );
}
