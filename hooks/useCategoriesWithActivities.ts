import { useMemo } from 'react';
import { useQuery } from '@powersync/react';
import { useTranslation } from 'react-i18next';
import type { CategoryWithActivities } from '@/db/models';
import { localizeActivityName, localizeCategoryName } from '@/lib/i18n/preset-names';

/**
 * SQL query that fetches all active categories joined with their activities.
 * Returns flat rows that are grouped into CategoryWithActivities[] in JS.
 */
const CATEGORIES_WITH_ACTIVITIES_QUERY = `
  SELECT
    c.id          AS category_id,
    c.name        AS category_name,
    c.color       AS category_color,
    c.icon        AS category_icon,
    c.is_preset   AS category_is_preset,
    c.sort_order  AS category_sort_order,
    a.id          AS activity_id,
    a.name        AS activity_name,
    a.is_preset   AS activity_is_preset,
    a.icon        AS activity_icon,
    COALESCE(a.is_favorite, 0) AS activity_is_favorite
  FROM categories c
  LEFT JOIN activities a
    ON a.category_id = c.id
    AND a.is_archived = 0
    AND a.deleted_at IS NULL
  WHERE c.is_archived = 0
    AND c.deleted_at IS NULL
  ORDER BY c.sort_order, a.is_favorite DESC, a.sort_order, a.name
`;

interface FlatRow {
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string | null;
  category_is_preset: number;
  category_sort_order: number;
  activity_id: string | null;
  activity_name: string | null;
  activity_is_preset: number | null;
  activity_icon: string | null;
  activity_is_favorite: number | null;
}

export interface UseCategoriesWithActivitiesResult {
  categories: CategoryWithActivities[];
  isLoading: boolean;
}

/**
 * Reactive hook that returns all active categories with their activities,
 * grouped and typed as CategoryWithActivities[].
 *
 * `name` / `categoryName` are display names (preset names translated to the
 * current language). Edit forms must only write a name back when the user
 * changed the displayed text — see docs/LOCALIZATION.md.
 *
 * Auto-updates when the underlying categories or activities tables change,
 * and when the UI language changes.
 */
export function useCategoriesWithActivities(): UseCategoriesWithActivitiesResult {
  const { data, isLoading } = useQuery<FlatRow>(CATEGORIES_WITH_ACTIVITIES_QUERY);
  const { i18n } = useTranslation();

  const categories = useMemo((): CategoryWithActivities[] => {
    const map = new Map<string, CategoryWithActivities>();

    for (const row of data) {
      let category = map.get(row.category_id);

      if (!category) {
        category = {
          id: row.category_id,
          name: localizeCategoryName(row.category_id, row.category_name),
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
          categoryName: category.name,
          categoryColor: row.category_color,
          name: localizeActivityName(row.activity_id, row.activity_name),
          isPreset: row.activity_is_preset === 1,
          isFavorite: row.activity_is_favorite === 1,
          icon: row.activity_icon ?? row.category_icon,
          iconOverride: row.activity_icon,
        });
      }
    }

    return Array.from(map.values());
    // i18n.language: display names depend on the UI language.
  }, [data, i18n.language]);

  return { categories, isLoading };
}
