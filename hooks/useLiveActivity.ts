import { useQuery } from "@powersync/react";
import { useEffect, useRef } from "react";

import {
  endLiveActivity,
  isLiveActivitySupported,
  startLiveActivity,
  updateLiveActivity,
} from "@/modules/live-activity";

/**
 * Reactive Live Activity controller. Mounted once at the root inside the
 * PowerSync provider, mirrors the pattern used by `useNotificationScheduler`.
 *
 * Drives the iOS Live Activity off the running-entry PowerSync query so
 * every code path that mutates `time_entries` (timer, retroactive edits,
 * deleting the running entry, etc.) is automatically covered — `useTimer`
 * never imports this hook.
 *
 * Transitions:
 *   none → entry      → startLiveActivity(...)
 *   entry → none      → endLiveActivity()
 *   entry A → entry B → updateLiveActivity(...)   (no dismiss/recreate)
 *
 * Android and pre-iOS-16.1 are no-ops via the bridge's `isSupported()`
 * short-circuit; this hook still mounts safely on those platforms.
 */
const RUNNING_ENTRY_FOR_LIVE_ACTIVITY_QUERY = `
  SELECT
    te.id          AS entry_id,
    te.started_at  AS started_at,
    a.name         AS activity_name,
    c.color        AS category_color
  FROM time_entries te
  JOIN activities a  ON a.id = te.activity_id
  JOIN categories c  ON c.id = a.category_id
  WHERE te.ended_at IS NULL
    AND te.deleted_at IS NULL
  ORDER BY te.started_at DESC
  LIMIT 1
`;

interface RunningRow {
  entry_id: string;
  started_at: string;
  activity_name: string;
  category_color: string | null;
}

const FALLBACK_COLOR_HEX = "#6E8BFF";

export function useLiveActivity(): void {
  const { data } = useQuery<RunningRow>(RUNNING_ENTRY_FOR_LIVE_ACTIVITY_QUERY);
  const running = data.length > 0 ? data[0] : null;

  // Tracks the last entry id we pushed to ActivityKit so we can detect
  // transitions. `undefined` is the pre-mount sentinel; `null` means "no
  // entry running"; a string means an entry id.
  const prevEntryIdRef = useRef<string | null | undefined>(undefined);

  // Defensive cleanup on first mount: if a prior app instance crashed mid-
  // timer, an orphaned Live Activity may still be visible. The bridge's
  // start() auto-upgrades to update() when an activity already exists, but
  // we also want to clear any leftover when there's no running entry.
  const didCleanupRef = useRef(false);

  useEffect(() => {
    if (!isLiveActivitySupported()) return;

    const prev = prevEntryIdRef.current;
    const currId = running?.entry_id ?? null;

    void (async () => {
      // First observation after mount: reconcile against any orphaned activity.
      if (prev === undefined) {
        if (currId === null) {
          if (!didCleanupRef.current) {
            didCleanupRef.current = true;
            await endLiveActivity();
          }
        } else if (running !== null) {
          // Either start a fresh activity or, if one was orphaned, the bridge's
          // start() will adopt+update it.
          await startLiveActivity({
            activityName: running.activity_name,
            categoryColorHex: running.category_color ?? FALLBACK_COLOR_HEX,
            startedAtMs: new Date(running.started_at).getTime(),
          });
        }
        prevEntryIdRef.current = currId;
        return;
      }

      if (prev === null && currId !== null && running !== null) {
        // none → entry
        await startLiveActivity({
          activityName: running.activity_name,
          categoryColorHex: running.category_color ?? FALLBACK_COLOR_HEX,
          startedAtMs: new Date(running.started_at).getTime(),
        });
      } else if (prev !== null && currId === null) {
        // entry → none
        await endLiveActivity();
      } else if (
        prev !== null &&
        currId !== null &&
        prev !== currId &&
        running !== null
      ) {
        // entry A → entry B (in-app switch). Same activity, new ContentState.
        await updateLiveActivity({
          activityName: running.activity_name,
          categoryColorHex: running.category_color ?? FALLBACK_COLOR_HEX,
          startedAtMs: new Date(running.started_at).getTime(),
        });
      }

      prevEntryIdRef.current = currId;
    })();
  }, [
    running?.entry_id,
    running?.started_at,
    running?.activity_name,
    running?.category_color,
    running,
  ]);
}
