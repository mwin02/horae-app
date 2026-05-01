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
}

export interface LiveActivityPayload {
  /** Display name of the running activity, e.g. "Deep Work". */
  activityName: string;
  /** CSS-style hex color for the parent category, e.g. "#3654E8". */
  categoryColorHex: string;
  /** Wall-clock start in UNIX milliseconds (`Date.now()` style). */
  startedAtMs: number;
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
