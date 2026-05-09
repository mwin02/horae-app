import { useMemo } from "react";
import { useQuery } from "@powersync/react";
import type { CategoryWithActivities } from "@/db/models";

/**
 * Same shape as useCategoriesWithActivities, but ordered by all-time
 * entry count (most-used first) at both the category and activity level.
 * Categories or activities with zero entries fall through alphabetically.
 */
const CATEGORIES_BY_USAGE_QUERY = `
  SELECT
    c.id          AS category_id,
    c.name        AS category_name,
    c.color       AS category_color,
    c.icon        AS category_icon,
    c.is_preset   AS category_is_preset,
    c.sort_order  AS category_sort_order,
    COALESCE(cat_counts.entry_count, 0) AS category_entry_count,
    a.id          AS activity_id,
    a.name        AS activity_name,
    a.is_preset   AS activity_is_preset,
    a.icon        AS activity_icon,
    COALESCE(act_counts.entry_count, 0) AS activity_entry_count
  FROM categories c
  LEFT JOIN activities a
    ON a.category_id = c.id
    AND a.is_archived = 0
    AND a.deleted_at IS NULL
  LEFT JOIN (
    SELECT activity_id, COUNT(*) AS entry_count
    FROM time_entries
    WHERE deleted_at IS NULL
    GROUP BY activity_id
  ) act_counts ON act_counts.activity_id = a.id
  LEFT JOIN (
    SELECT act.category_id, COUNT(*) AS entry_count
    FROM time_entries te
    JOIN activities act ON act.id = te.activity_id
    WHERE te.deleted_at IS NULL
    GROUP BY act.category_id
  ) cat_counts ON cat_counts.category_id = c.id
  WHERE c.is_archived = 0
    AND c.deleted_at IS NULL
  ORDER BY category_entry_count DESC, c.name, activity_entry_count DESC, a.name
`;

interface FlatRow {
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string | null;
  category_is_preset: number;
  category_sort_order: number;
  category_entry_count: number;
  activity_id: string | null;
  activity_name: string | null;
  activity_is_preset: number | null;
  activity_icon: string | null;
  activity_entry_count: number;
}

export interface UseCategoriesByUsageResult {
  categories: CategoryWithActivities[];
  isLoading: boolean;
}

export function useCategoriesByUsage(): UseCategoriesByUsageResult {
  const { data, isLoading } = useQuery<FlatRow>(CATEGORIES_BY_USAGE_QUERY);

  const categories = useMemo((): CategoryWithActivities[] => {
    const map = new Map<string, CategoryWithActivities>();

    for (const row of data) {
      let category = map.get(row.category_id);

      if (!category) {
        category = {
          id: row.category_id,
          name: row.category_name,
          color: row.category_color,
          icon: row.category_icon,
          isPreset: row.category_is_preset === 1,
          sortOrder: row.category_sort_order,
          activities: [],
        };
        map.set(row.category_id, category);
      }

      if (row.activity_id && row.activity_name) {
        category.activities.push({
          id: row.activity_id,
          categoryId: row.category_id,
          categoryName: row.category_name,
          categoryColor: row.category_color,
          name: row.activity_name,
          isPreset: row.activity_is_preset === 1,
          icon: row.activity_icon ?? row.category_icon,
          iconOverride: row.activity_icon,
        });
      }
    }

    return Array.from(map.values());
  }, [data]);

  return { categories, isLoading };
}
