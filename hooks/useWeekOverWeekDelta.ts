import { resolveWeeklyTargetSeconds } from "@/components/insights/delta-polarity";
import type { GoalDirection } from "@/db/models";
import {
  IDEAL_ALLOCATIONS_QUERY,
  INSIGHTS_CATEGORY_QUERY,
  type IdealAllocationRow,
  type InsightsCategoryRow,
} from "@/db/queries";
import { getCurrentTimezone, getEndOfDay, getStartOfDay } from "@/lib/timezone";
import { useQuery } from "@powersync/react";
import { useMemo } from "react";
import { getWeekRange } from "./useInsightsData";
import { useUserPreferences } from "./useUserPreferences";

export interface WeekOverWeekRow {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  thisWeekSeconds: number;
  lastWeekSeconds: number;
  /** thisWeek - lastWeek (seconds). Positive = increase. */
  deltaSeconds: number;
  /** Goal polarity if any allocation exists for this category; null otherwise. */
  goalDirection: GoalDirection | null;
  /** Weekly target in seconds; null if no daily/weekly allocation maps. */
  weeklyTargetSeconds: number | null;
}

export interface UseWeekOverWeekDeltaResult {
  rows: WeekOverWeekRow[];
  isLoading: boolean;
}

/** Shift a YYYY-MM-DD date string by N days (noon-anchored to avoid DST). */
function shiftDate(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d, 12) + deltaDays * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Aggregates category totals for the given week and the previous week,
 * joining on category to compute deltas. Uses the SQL clipping pattern
 * from INSIGHTS_CATEGORY_QUERY so midnight-spanning entries are split
 * correctly at range boundaries.
 */
export function useWeekOverWeekDelta(
  weekDate: string,
): UseWeekOverWeekDeltaResult {
  const timezone = getCurrentTimezone();
  const { preferences } = useUserPreferences();
  const weekStartDay = preferences.weekStartDay;

  const ranges = useMemo(() => {
    const { weekStart, weekEnd } = getWeekRange(weekDate, weekStartDay);
    const prevWeekAnchor = shiftDate(weekStart, -1);
    const { weekStart: prevStart, weekEnd: prevEnd } =
      getWeekRange(prevWeekAnchor, weekStartDay);

    return {
      thisStart: getStartOfDay(weekStart, timezone).toISOString(),
      thisEnd: getEndOfDay(weekEnd, timezone).toISOString(),
      prevStart: getStartOfDay(prevStart, timezone).toISOString(),
      prevEnd: getEndOfDay(prevEnd, timezone).toISOString(),
    };
  }, [weekDate, timezone, weekStartDay]);

  const { data: thisRows, isLoading: thisLoading } =
    useQuery<InsightsCategoryRow>(INSIGHTS_CATEGORY_QUERY, [
      ranges.thisEnd,
      ranges.thisStart,
      ranges.thisEnd,
      ranges.thisStart,
    ]);

  const { data: lastRows, isLoading: lastLoading } =
    useQuery<InsightsCategoryRow>(INSIGHTS_CATEGORY_QUERY, [
      ranges.prevEnd,
      ranges.prevStart,
      ranges.prevEnd,
      ranges.prevStart,
    ]);

  const { data: allocationRows } = useQuery<IdealAllocationRow>(
    IDEAL_ALLOCATIONS_QUERY,
  );

  const goalDirectionByCategory = useMemo(() => {
    const directionsById = new Map<string, GoalDirection[]>();
    for (const row of allocationRows) {
      if (row.goal_direction == null) continue;
      const list = directionsById.get(row.category_id) ?? [];
      list.push(row.goal_direction);
      directionsById.set(row.category_id, list);
    }
    const resolved = new Map<string, GoalDirection>();
    for (const [id, directions] of directionsById) {
      if (directions.length === 0) continue;
      const first = directions[0];
      const allSame = directions.every((d) => d === first);
      resolved.set(id, allSame ? first : "around");
    }
    return resolved;
  }, [allocationRows]);

  const weeklyTargetByCategory = useMemo(
    () => resolveWeeklyTargetSeconds(allocationRows),
    [allocationRows],
  );

  const rows = useMemo<WeekOverWeekRow[]>(() => {
    const byId = new Map<
      string,
      {
        name: string;
        color: string;
        thisSeconds: number;
        lastSeconds: number;
      }
    >();

    for (const row of thisRows) {
      byId.set(row.category_id, {
        name: row.category_name,
        color: row.category_color,
        thisSeconds: row.total_seconds,
        lastSeconds: 0,
      });
    }

    for (const row of lastRows) {
      const existing = byId.get(row.category_id);
      if (existing) {
        existing.lastSeconds = row.total_seconds;
      } else {
        byId.set(row.category_id, {
          name: row.category_name,
          color: row.category_color,
          thisSeconds: 0,
          lastSeconds: row.total_seconds,
        });
      }
    }

    const result: WeekOverWeekRow[] = Array.from(byId.entries()).map(
      ([categoryId, v]) => ({
        categoryId,
        categoryName: v.name,
        categoryColor: v.color,
        thisWeekSeconds: v.thisSeconds,
        lastWeekSeconds: v.lastSeconds,
        deltaSeconds: v.thisSeconds - v.lastSeconds,
        goalDirection: goalDirectionByCategory.get(categoryId) ?? null,
        weeklyTargetSeconds: weeklyTargetByCategory.get(categoryId) ?? null,
      }),
    );

    // Sort by this-week time desc; categories only in last week sink below.
    result.sort((a, b) => b.thisWeekSeconds - a.thisWeekSeconds);
    return result;
  }, [thisRows, lastRows, goalDirectionByCategory, weeklyTargetByCategory]);

  return { rows, isLoading: thisLoading || lastLoading };
}
