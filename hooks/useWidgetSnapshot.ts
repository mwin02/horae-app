import { useQuery } from "@powersync/react";
import { useEffect, useMemo } from "react";

import { writeWidgetSnapshot, writeWidgetStrings } from "@/modules/live-activity";
import { useTranslation } from "react-i18next";
import { localizeActivityName } from "@/lib/i18n/preset-names";

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
    a.id           AS activity_id,
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
  activity_id: string;
  activity_name: string;
  category_color: string | null;
}

const FALLBACK_COLOR_HEX = "#6E8BFF";

export function useWidgetSnapshot(): void {
  const { data } = useQuery<RunningRow>(RUNNING_ENTRY_FOR_WIDGET_QUERY);
  const { i18n } = useTranslation();
  const raw = data.length > 0 ? data[0] : null;
  // Push the display name (translated for presets). Re-derived on language
  // change so the existing activity_name dep re-pushes it.
  const running = useMemo(
    () =>
      raw
        ? { ...raw, activity_name: localizeActivityName(raw.activity_id, raw.activity_name) }
        : null,
    [raw, i18n.language],
  );

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

/**
 * Pushes the widget / Live Activity labels in the current UI language. The
 * extension can't read the app's i18n state (the in-app language can differ
 * from the OS), so JS writes the strings to the App Group on every change.
 */
export function useWidgetStrings(): void {
  const { t, i18n } = useTranslation();
  useEffect(() => {
    void writeWidgetStrings({
      tracking: t("home.tracking"),
      tapToStart: t("widget.tapToStart"),
      stopActivity: t("widget.stopActivity"),
      now: t("widget.now"),
      since: t("widget.since", { time: "{time}" }),
    });
  }, [t, i18n.language]);
}
