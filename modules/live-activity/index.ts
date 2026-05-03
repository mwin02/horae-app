import { requireNativeModule } from "expo-modules-core";

/**
 * Native bridge to ActivityKit for the running-timer Live Activity.
 *
 * On iOS 16.1+ with Live Activities enabled, drives a `Activity<…>`
 * registered against `TimerActivityAttributes` (defined in both the
 * widget extension and this module — see the comment at the top of
 * `ios/TimerActivityAttributes.swift`).
 *
 * On Android and unsupported iOS versions, every function except
 * `isLiveActivitySupported()` is a no-op so callers don't need
 * platform guards.
 */

interface LiveActivityNativeModule {
  isSupported(): boolean;
  start(payload: LiveActivityPayload): Promise<void>;
  update(payload: LiveActivityPayload): Promise<void>;
  end(): Promise<void>;
  writeWidgetSnapshot(payload: WidgetSnapshotPayload | null): Promise<void>;
}

export interface LiveActivityPayload {
  /** Display name of the running activity, e.g. "Deep Work". */
  activityName: string;
  /** CSS-style hex color for the parent category, e.g. "#3654E8". */
  categoryColorHex: string;
  /** Wall-clock start in UNIX milliseconds (`Date.now()` style). */
  startedAtMs: number;
}

/**
 * Snapshot of the running entry written to the shared App Group
 * UserDefaults for the home-screen widget to read. Field names mirror the
 * snake_case JSON shape the widget decodes.
 */
export interface WidgetSnapshotPayload {
  entryId: string;
  /** ISO 8601 string. */
  startedAt: string;
  activityName: string;
  /** CSS-style hex color for the parent category. */
  categoryColor: string;
}

const native = requireNativeModule<LiveActivityNativeModule>("LiveActivity");

export function isLiveActivitySupported(): boolean {
  try {
    return native.isSupported();
  } catch {
    return false;
  }
}

export async function startLiveActivity(payload: LiveActivityPayload): Promise<void> {
  if (!isLiveActivitySupported()) return;
  await native.start(payload);
}

export async function updateLiveActivity(payload: LiveActivityPayload): Promise<void> {
  if (!isLiveActivitySupported()) return;
  await native.update(payload);
}

export async function endLiveActivity(): Promise<void> {
  if (!isLiveActivitySupported()) return;
  await native.end();
}

/**
 * Writes (or clears, when `payload` is null) the running-entry snapshot
 * the home-screen widget reads. Also asks the OS to reload widget
 * timelines on iOS. No-op on Android.
 */
export async function writeWidgetSnapshot(
  payload: WidgetSnapshotPayload | null,
): Promise<void> {
  try {
    await native.writeWidgetSnapshot(payload);
  } catch {
    // Native module unavailable (e.g. Android, or pre-Block-1 build) — no-op.
  }
}
