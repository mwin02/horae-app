import { useMemo } from "react";
import { useQuery } from "@powersync/react";

import type { IdealAllocationRow } from "@/db/queries";

/**
 * Reactive query for every ideal-allocation row belonging to a single
 * category (non-deleted). Returns the rows already split into the "every
 * day" default and a Mon→Sun array of per-day overrides, which is the shape
 * the editor needs.
 */
export interface UseIdealAllocationsForCategoryResult {
  /** Minutes for `day_of_week IS NULL`, or null when that row isn't set. */
  defaultMinutes: number | null;
  /** Mon=0 … Sun=6. `null` where no override exists for that weekday. */
  perDayMinutes: (number | null)[];
  isLoading: boolean;
}

const QUERY = `
  SELECT id, category_id, day_of_week, target_minutes_per_day
  FROM ideal_allocations
  WHERE category_id = ? AND deleted_at IS NULL
`;

export function useIdealAllocationsForCategory(
  categoryId: string | null,
): UseIdealAllocationsForCategoryResult {
  const { data: rows, isLoading } = useQuery<IdealAllocationRow>(
    QUERY,
    categoryId ? [categoryId] : [""],
  );

  return useMemo(() => {
    let defaultMinutes: number | null = null;
    const perDayMinutes: (number | null)[] = [
      null, null, null, null, null, null, null,
    ];
    if (categoryId) {
      for (const row of rows) {
        if (row.day_of_week == null) {
          defaultMinutes = row.target_minutes_per_day;
        } else if (row.day_of_week >= 0 && row.day_of_week <= 6) {
          perDayMinutes[row.day_of_week] = row.target_minutes_per_day;
        }
      }
    }
    return { defaultMinutes, perDayMinutes, isLoading };
  }, [categoryId, rows, isLoading]);
}
