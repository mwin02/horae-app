import { NOTIFICATION_PREFERENCES_QUERY, resolveLongRunningThreshold } from "@/db/queries";
import type { RunningTimer } from "@/db/models";
import type { NotificationPreferencesRecord } from "@/db/schema";
import { getCurrentTimezone, isToday } from "@/lib/timezone";
import { useQuery } from "@powersync/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

/**
 * SQL query to get the running entry with enriched data (same as useTimer).
 */
const RUNNING_ENTRY_QUERY = `
  SELECT
    te.id          AS entry_id,
    te.activity_id AS activity_id,
    te.started_at  AS started_at,
    te.timezone    AS timezone,
    a.name         AS activity_name,
    c.name         AS category_name,
    c.color        AS category_color
  FROM time_entries te
  JOIN activities a ON a.id = te.activity_id
  JOIN categories c ON c.id = a.category_id
  WHERE te.ended_at IS NULL
    AND te.deleted_at IS NULL
  ORDER BY te.started_at DESC
  LIMIT 1
`;

interface RunningEntryRow {
  entry_id: string;
  activity_id: string;
  started_at: string;
  timezone: string;
  activity_name: string;
  category_name: string;
  category_color: string;
}

interface SnoozeState {
  entryId: string;
  snoozedAt: Date;
  snoozeUntil: Date;
}

const FALLBACK_SNOOZE_SECONDS = 3600;

export interface UseForgottenTimerResult {
  /** The stale/forgotten entry if one is detected, otherwise null */
  forgottenEntry: RunningTimer | null;
  /**
   * Recommended default for the stop-time picker. When the user previously
   * snoozed this entry, this is the moment they pressed "Still going" — so
   * a quick confirm matches reality. Otherwise it's `min(startedAt+1h, now)`.
   */
  recommendedEndAt: Date | null;
  /**
   * Snooze the forgotten timer prompt for the current running entry.
   * The modal stays hidden until the snooze expires; on re-prompt the
   * picker defaults to the moment this was called.
   */
  snoozeForgotten: () => void;
}

/**
 * Detects "forgotten" timers — running entries that are either:
 * - Past the per-activity long-running threshold (same value the
 *   notification scheduler uses, so opening the app from a long-running
 *   notification greets the user with this modal), OR
 * - Started on a different calendar day (unconditional safety net —
 *   a timer that spans days is almost certainly forgotten).
 *
 * Threshold-based detection is suppressed when the user has turned off
 * long-running reminders, so the modal follows the same opt-in as the
 * notification. The different-day check ignores that preference.
 *
 * Checks on app foreground (background → active transition) and on mount.
 */
export function useForgottenTimer(): UseForgottenTimerResult {
  const { data } = useQuery<RunningEntryRow>(RUNNING_ENTRY_QUERY);
  const { data: prefsData } = useQuery<NotificationPreferencesRecord>(
    NOTIFICATION_PREFERENCES_QUERY
  );
  const [shouldCheck, setShouldCheck] = useState(true);
  const [thresholdSeconds, setThresholdSeconds] = useState<number | null>(null);
  const [, setSnoozeTick] = useState(0);
  const snoozeRef = useRef<SnoozeState | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  // Cache the recommended end time so its reference is stable across re-renders
  // (the running timer ticks once a second). Without this, the modal's
  // useEffect keeps resetting the picker because `recommended = new Date(now)`
  // when the threshold is < 1h, which produces a fresh Date every render.
  const recommendedRef = useRef<{
    entryId: string;
    snoozeAt: number | null;
    date: Date;
  } | null>(null);

  const row = data.length > 0 ? data[0] : null;
  const prefs = prefsData.length > 0 ? prefsData[0] : null;
  const longRunningEnabled = prefs?.long_running_enabled === 1;

  // Resolve the threshold asynchronously whenever the running activity changes.
  useEffect(() => {
    if (row === null) {
      setThresholdSeconds(null);
      // Timer stopped (or never started this session) — clear any pending snooze
      // so a fresh entry never inherits stale state.
      snoozeRef.current = null;
      return;
    }
    let cancelled = false;
    void (async () => {
      const t = await resolveLongRunningThreshold(row.activity_id);
      if (!cancelled) setThresholdSeconds(t);
    })();
    return () => {
      cancelled = true;
    };
  }, [row?.activity_id, prefs?.threshold_override_seconds]);

  // Drop the snooze if the running entry changes (stop, switch).
  useEffect(() => {
    if (snoozeRef.current && row?.entry_id !== snoozeRef.current.entryId) {
      snoozeRef.current = null;
    }
  }, [row?.entry_id]);

  // When a snooze is active, schedule a wake-up at expiry to re-evaluate.
  useEffect(() => {
    const snooze = snoozeRef.current;
    if (!snooze) return;
    const remainingMs = snooze.snoozeUntil.getTime() - Date.now();
    if (remainingMs <= 0) {
      setSnoozeTick((t) => t + 1);
      return;
    }
    const timeoutId = setTimeout(() => {
      setSnoozeTick((t) => t + 1);
    }, remainingMs);
    return () => clearTimeout(timeoutId);
  }, [snoozeRef.current?.entryId, snoozeRef.current?.snoozeUntil.getTime()]);

  // Listen for app state changes (background → active)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        setShouldCheck(true);
        // Force re-evaluation of the snooze window on foreground in case the
        // snooze expired while backgrounded.
        setSnoozeTick((t) => t + 1);
      }
      appStateRef.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const { forgottenEntry, recommendedEndAt } = (() => {
    if (!shouldCheck || row === null) {
      return { forgottenEntry: null, recommendedEndAt: null };
    }

    const snooze = snoozeRef.current;
    const snoozeActive =
      snooze !== null &&
      snooze.entryId === row.entry_id &&
      Date.now() < snooze.snoozeUntil.getTime();
    if (snoozeActive) {
      return { forgottenEntry: null, recommendedEndAt: null };
    }

    const startedAt = new Date(row.started_at);
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startedAt.getTime()) / 1000);
    const timezone = getCurrentTimezone();

    const isDifferentDay = !isToday(row.started_at, timezone);
    const isPastThreshold =
      longRunningEnabled &&
      thresholdSeconds !== null &&
      elapsedSeconds > thresholdSeconds;

    if (!isPastThreshold && !isDifferentDay) {
      return { forgottenEntry: null, recommendedEndAt: null };
    }

    const entry: RunningTimer = {
      entryId: row.entry_id,
      activityId: row.activity_id,
      activityName: row.activity_name,
      categoryName: row.category_name,
      categoryColor: row.category_color,
      startedAt,
      elapsedSeconds,
      timezone: row.timezone,
    };

    // If a snooze for this entry just expired, default the picker to the
    // moment the user pressed "Still going" — that's their best estimate of
    // when they actually stopped.
    const snoozeAt =
      snooze !== null && snooze.entryId === row.entry_id
        ? snooze.snoozedAt.getTime()
        : null;

    const cached = recommendedRef.current;
    let recommended: Date;
    if (
      cached !== null &&
      cached.entryId === row.entry_id &&
      cached.snoozeAt === snoozeAt
    ) {
      recommended = cached.date;
    } else {
      if (snoozeAt !== null) {
        recommended = new Date(snoozeAt);
      } else {
        const oneHourAfter = new Date(startedAt.getTime() + 3600_000);
        const nowDate = new Date(now);
        recommended = oneHourAfter > nowDate ? nowDate : oneHourAfter;
      }
      recommendedRef.current = {
        entryId: row.entry_id,
        snoozeAt,
        date: recommended,
      };
    }

    return { forgottenEntry: entry, recommendedEndAt: recommended };
  })();

  const snoozeForgotten = useCallback(() => {
    if (!row) return;
    const snoozedAt = new Date();
    const snoozeSeconds = thresholdSeconds ?? FALLBACK_SNOOZE_SECONDS;
    snoozeRef.current = {
      entryId: row.entry_id,
      snoozedAt,
      snoozeUntil: new Date(snoozedAt.getTime() + snoozeSeconds * 1000),
    };
    // Force a re-render so the IIFE picks up the new snooze, and re-arm the
    // expiry timer effect.
    setSnoozeTick((t) => t + 1);
  }, [row?.entry_id, thresholdSeconds]);

  return {
    forgottenEntry,
    recommendedEndAt,
    snoozeForgotten,
  };
}
