import * as Notifications from "expo-notifications";
import { Linking, Platform } from "react-native";

import i18n from "@/lib/i18n";

import { formatDuration } from "./timezone";

// Notification copy is baked in at schedule time. `useNotificationScheduler`
// lists the UI language in its deps so pending reminders are rescheduled in
// the new language when it changes.

/** Singleton identifier for the idle reminder. */
const IDLE_REMINDER_ID = "idle-reminder";

/** Prefix for per-entry long-running reminder identifiers. */
const LONG_RUNNING_PREFIX = "long-running-";

/** Prefix for goal-alert identifiers. ID shape: `goal-alert-${categoryId}`. */
export const GOAL_ALERT_PREFIX = "goal-alert-";

function longRunningId(entryId: string): string {
  return `${LONG_RUNNING_PREFIX}${entryId}`;
}

function goalAlertId(categoryId: string): string {
  return `${GOAL_ALERT_PREFIX}${categoryId}`;
}

export type GoalAlertType = "at_most" | "around" | "at_least";
export type GoalAlertPeriodKind = "daily" | "weekly";

export interface GoalAlertParams {
  categoryId: string;
  categoryName: string;
  goalType: GoalAlertType;
  periodKind: GoalAlertPeriodKind;
  fireAt: Date;
}

/**
 * Configure foreground presentation. Must be called once at module load
 * (e.g. from the root layout) so that notifications still appear as banners
 * while the app is open.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export interface PermissionResult {
  granted: boolean;
}

/**
 * Request permission once per install. Caller is responsible for persisting
 * the fact that the ask has happened (via notification_preferences).
 * If `hasAsked` is already true we only read current status, never prompt again.
 */
export async function requestPermissionsIfNeeded(
  hasAsked: boolean
): Promise<PermissionResult> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return { granted: true };
  if (hasAsked) return { granted: false };

  const response = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: false,
    },
  });
  return { granted: response.granted };
}

/** True if the OS currently grants notification permission. */
export async function hasNotificationPermission(): Promise<boolean> {
  const status = await Notifications.getPermissionsAsync();
  return status.granted;
}

async function scheduleAt(
  identifier: string,
  title: string,
  body: string,
  fireAt: Date
): Promise<void> {
  const seconds = Math.max(1, Math.round((fireAt.getTime() - Date.now()) / 1000));
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });
}

/**
 * Schedule (or reschedule) the idle reminder to fire at `fireAt`.
 * Cancels any existing idle reminder first so the new time replaces the old.
 */
export async function scheduleIdleReminder(fireAt: Date): Promise<void> {
  await cancelIdleReminder();
  await scheduleAt(
    IDLE_REMINDER_ID,
    i18n.t("notifications.idleTitle"),
    i18n.t("notifications.idleBody"),
    fireAt
  );
}

export async function cancelIdleReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(IDLE_REMINDER_ID);
}

export interface LongRunningParams {
  entryId: string;
  activityName: string;
  fireAt: Date;
  /** Elapsed seconds at the moment the notification will fire. */
  firesAfterSeconds: number;
}

/**
 * Schedule a long-running reminder for a specific entry. Cancels any prior
 * reminder for the same entry first.
 */
export async function scheduleLongRunningReminder(
  params: LongRunningParams
): Promise<void> {
  const id = longRunningId(params.entryId);
  await Notifications.cancelScheduledNotificationAsync(id);
  await scheduleAt(
    id,
    i18n.t("notifications.longRunningTitle", { activity: params.activityName }),
    i18n.t("notifications.longRunningBody", {
      duration: formatDuration(params.firesAfterSeconds),
    }),
    params.fireAt
  );
}

export async function cancelLongRunningReminder(entryId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(longRunningId(entryId));
}

function goalAlertCopy(
  goalType: GoalAlertType,
  periodKind: GoalAlertPeriodKind,
  categoryName: string,
): { title: string; body: string } {
  const weekly = periodKind === "weekly";
  const vars = { category: categoryName };
  switch (goalType) {
    case "at_most":
      return {
        title: i18n.t("notifications.goalAtMostTitle", vars),
        body: weekly
          ? i18n.t("notifications.goalAtMostBodyWeekly", vars)
          : i18n.t("notifications.goalAtMostBodyDaily", vars),
      };
    case "around":
      return {
        title: i18n.t("notifications.goalAroundTitle", vars),
        body: weekly
          ? i18n.t("notifications.goalAroundBodyWeekly", vars)
          : i18n.t("notifications.goalAroundBodyDaily", vars),
      };
    case "at_least":
      return {
        title: i18n.t("notifications.goalAtLeastTitle", vars),
        body: weekly
          ? i18n.t("notifications.goalAtLeastBodyWeekly", vars)
          : i18n.t("notifications.goalAtLeastBodyDaily", vars),
      };
  }
}

/**
 * Schedule (or replace) the goal alert for a category. One alert per category
 * per day; the deterministic ID means re-scheduling overwrites the prior one.
 */
export async function scheduleGoalAlert(params: GoalAlertParams): Promise<void> {
  const id = goalAlertId(params.categoryId);
  await Notifications.cancelScheduledNotificationAsync(id);
  const { title, body } = goalAlertCopy(
    params.goalType,
    params.periodKind,
    params.categoryName,
  );
  await scheduleAt(id, title, body, params.fireAt);
}

export async function cancelGoalAlertForCategory(
  categoryId: string,
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(
    goalAlertId(categoryId),
  );
}

/** Cancel every scheduled goal alert (e.g. when the toggle flips off). */
export async function cancelAllGoalAlerts(): Promise<void> {
  const ids = await getScheduledIds();
  for (const id of ids) {
    if (id.startsWith(GOAL_ALERT_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  }
}

/** Cancel every notification this app has scheduled. */
export async function cancelAllAppNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Deep-link into the OS settings for this app so the user can toggle
 * notification permission. iOS-only — Android surfaces settings via
 * `Linking.openSettings()` which behaves similarly.
 */
export async function openSystemNotificationSettings(): Promise<void> {
  if (Platform.OS === "ios") {
    await Linking.openURL("app-settings:");
    return;
  }
  await Linking.openSettings();
}

/** All scheduled identifiers currently held by the OS for this app. */
export async function getScheduledIds(): Promise<string[]> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.map((n) => n.identifier);
}
