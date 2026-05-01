import { useQuery } from "@powersync/react";
import { useMemo } from "react";

/**
 * One row in the flat Quick Start grid: an activity with the resolved
 * display icon (override or category fallback) and its all-time entry count.
 */
export interface QuickStartActivity {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  icon: string | null;
  entryCount: number;
}

const QUICK_START_QUERY = `
  SELECT
    a.id            AS activity_id,
    a.name          AS activity_name,
    c.id            AS category_id,
    c.name          AS category_name,
    c.color         AS category_color,
    COALESCE(a.icon, c.icon) AS icon,
    COALESCE(counts.entry_count, 0) AS entry_count
  FROM activities a
  JOIN categories c ON c.id = a.category_id
  LEFT JOIN (
    SELECT activity_id, COUNT(*) AS entry_count
    FROM time_entries
    WHERE deleted_at IS NULL
    GROUP BY activity_id
  ) counts ON counts.activity_id = a.id
  WHERE a.is_archived = 0
    AND a.deleted_at IS NULL
    AND c.is_archived = 0
    AND c.deleted_at IS NULL
  ORDER BY entry_count DESC, a.name
`;

interface FlatRow {
  activity_id: string;
  activity_name: string;
  category_id: string;
  category_name: string;
  category_color: string;
  icon: string | null;
  entry_count: number;
}

export interface UseQuickStartActivitiesResult {
  activities: QuickStartActivity[];
  isLoading: boolean;
}

/**
 * Reactive hook returning every active activity flattened across categories,
 * ordered by all-time entry count (most-used first). Drives the Home tab's
 * Quick Start grid.
 */
export function useQuickStartActivities(): UseQuickStartActivitiesResult {
  const { data, isLoading } = useQuery<FlatRow>(QUICK_START_QUERY);

  const activities = useMemo<QuickStartActivity[]>(
    () =>
      data.map((row) => ({
        id: row.activity_id,
        name: row.activity_name,
        categoryId: row.category_id,
        categoryName: row.category_name,
        categoryColor: row.category_color,
        icon: row.icon,
        entryCount: row.entry_count,
      })),
    [data],
  );

  return { activities, isLoading };
}
