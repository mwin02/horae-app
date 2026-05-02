import { useQuery } from "@powersync/react";
import { useEffect } from "react";

import { writeWidgetSnapshot } from "@/modules/live-activity";

/**
 * Reactive home-screen widget snapshot writer. Mounted once at the root
 * inside the PowerSync provider, alongside `useLiveActivity`.
 *
 * Subscribes to the running-entry query and writes a JSON snapshot to the
 * shared App Group UserDefaults whenever it changes. The home-screen
 * widget (Block 2) reads this snapshot in its `TimelineProvider`. Every
 * write also calls `WidgetCenter.reloadAllTimelines()` natively so the
 * widget rerenders within ~1s.
 *
 * Android and pre-iOS-16.1 are no-ops via the bridge's try/catch.
 */
const RUNNING_ENTRY_FOR_WIDGET_QUERY = `
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

export function useWidgetSnapshot(): void {
  const { data } = useQuery<RunningRow>(RUNNING_ENTRY_FOR_WIDGET_QUERY);
  const running = data.length > 0 ? data[0] : null;

  useEffect(() => {
    if (running) {
      void writeWidgetSnapshot({
        entryId: running.entry_id,
        startedAt: running.started_at,
        activityName: running.activity_name,
        categoryColor: running.category_color ?? FALLBACK_COLOR_HEX,
      });
    } else {
      void writeWidgetSnapshot(null);
    }
  }, [
    running?.entry_id,
    running?.started_at,
    running?.activity_name,
    running?.category_color,
    running,
  ]);
}
