import { resolveWeeklyTargetSeconds } from "@/components/insights/delta-polarity";
import type { GoalDirection } from "@/db/models";
import {
  IDEAL_ALLOCATIONS_QUERY,
  TIMELINE_ENTRIES_QUERY,
  type IdealAllocationRow,
  type TimelineEntryRow,
} from "@/db/queries";
import { getCurrentTimezone, getEndOfDay, getStartOfDay } from "@/lib/timezone";
import { useQuery } from "@powersync/react";
import { useMemo } from "react";
import { getMonthRange, getWeekRange } from "./useInsightsData";
import { useUserPreferences } from "./useUserPreferences";

export interface TrendCategory {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

export interface TrendBucket {
  /** 1-indexed label e.g. "W1" */
  label: string;
  /** YYYY-MM-DD of the bucket's local start date (clipped to month) */
  startDate: string;
  /** YYYY-MM-DD of the bucket's local end date (clipped to month) */
  endDate: string;
  /**
   * `true` when the bucket's local end-of-day is in the past — i.e. the week
   * is fully elapsed. The in-progress current week is `false`. Past months
   * have all buckets complete.
   */
  complete: boolean;
}

export interface CategoryTrend {
  category: TrendCategory;
  /** Parallel to `buckets`: seconds tracked in each bucket. */
  values: number[];
  /** Sum across all buckets — used for ranking. */
  totalSeconds: number;
  /**
   * Resolved goal direction across this category's ideal_allocation rows.
   * `null` when the category has no goal configured. When directions disagree
   * across daily/weekly/monthly rows we fall back to `'around'` (matches
   * `useInsightsData`'s resolveDirection).
   */
  goalDirection: GoalDirection | null;
  /** Weekly target in seconds; null if no daily/weekly allocation maps. */
  weeklyTargetSeconds: number | null;
}

export interface UseFourWeekTrendResult {
  buckets: TrendBucket[];
  categories: CategoryTrend[];
  /** Largest per-bucket value across all returned categories — for Y scaling. */
  maxBucketSeconds: number;
  isLoading: boolean;
}

const MS_PER_SECOND = 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TOP_CATEGORY_LIMIT = 6;
const MAX_BUCKETS = 6; // months span up to 6 ISO-week overlaps

/**
 * Splits the calendar month into Mon–Sun ISO-week buckets (clipped to the
 * month's first/last day). For each of the top categories (by monthly total),
 * returns a parallel array of per-bucket seconds. Midnight-spanning entries
 * are split at local day boundaries in the entry's own timezone.
 */
export function useFourWeekTrend(
  monthDate: string,
  limit: number = TOP_CATEGORY_LIMIT,
): UseFourWeekTrendResult {
  const timezone = getCurrentTimezone();
  const { preferences } = useUserPreferences();
  const weekStartDay = preferences.weekStartDay;

  const { startIso, endIso, buckets, monthStart, monthEnd } = useMemo(() => {
    const { monthStart, monthEnd } = getMonthRange(monthDate);
    const startIso = getStartOfDay(monthStart, timezone).toISOString();
    const endIso = getEndOfDay(monthEnd, timezone).toISOString();

    const buckets: TrendBucket[] = [];
    const nowMs = Date.now();
    let cursor = monthStart;
    let idx = 1;
    // Clamp safety: at most 6 ISO-week overlaps (month can span 4-6 weeks).
    while (cursor <= monthEnd && buckets.length < MAX_BUCKETS) {
      const { weekEnd } = getWeekRange(cursor, weekStartDay);
      const bucketStart = cursor;
      const bucketEnd = weekEnd > monthEnd ? monthEnd : weekEnd;
      const bucketStartMs = getStartOfDay(bucketStart, timezone).getTime();
      // Drop weeks that haven't started yet — sparkline should stop at the
      // current week, not slope to zero across the rest of the month.
      if (bucketStartMs > nowMs) break;
      const bucketEndMs = getEndOfDay(bucketEnd, timezone).getTime();
      buckets.push({
        label: `W${idx}`,
        startDate: bucketStart,
        endDate: bucketEnd,
        complete: bucketEndMs <= nowMs,
      });
      idx += 1;
      cursor = shiftDate(bucketEnd, 1);
    }

    return { startIso, endIso, buckets, monthStart, monthEnd };
  }, [monthDate, timezone, weekStartDay]);

  const { data: rows, isLoading } = useQuery<TimelineEntryRow>(
    TIMELINE_ENTRIES_QUERY,
    [endIso, startIso],
  );
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

  const result = useMemo(() => {
    // Precompute bucket boundaries in ms for quick day→bucket lookup.
    // localDateStr comparison (YYYY-MM-DD) works correctly because buckets
    // are contiguous and non-overlapping within the month.
    const bucketBoundaries = buckets.map((b) => ({
      startMs: getStartOfDay(b.startDate, timezone).getTime(),
      endMs: getEndOfDay(b.endDate, timezone).getTime(),
    }));

    const monthStartMs = getStartOfDay(monthStart, timezone).getTime();
    const monthEndMs = getEndOfDay(monthEnd, timezone).getTime();
    const nowMs = Date.now();

    // Map<categoryKey, { meta, perBucket: number[] }>
    const byCategory = new Map<
      string,
      { meta: TrendCategory; perBucket: number[]; total: number }
    >();

    for (const row of rows) {
      const rawStartMs = new Date(row.started_at).getTime();
      const rawEndMs = row.ended_at
        ? new Date(row.ended_at).getTime()
        : nowMs;

      const startMs = Math.max(rawStartMs, monthStartMs);
      const endMs = Math.min(rawEndMs, monthEndMs);
      if (endMs <= startMs) continue;

      const catKey = row.category_id;
      let entry = byCategory.get(catKey);
      if (!entry) {
        entry = {
          meta: {
            id: catKey,
            name: row.category_name,
            color: row.category_color,
            icon: row.category_icon,
          },
          perBucket: Array(buckets.length).fill(0),
          total: 0,
        };
        byCategory.set(catKey, entry);
      }

      // Walk day-by-day in entry's own tz, splitting at local midnight so
      // week-boundary and day-boundary attribution stays correct.
      const tz = row.timezone;
      let cursorMs = startMs;
      while (cursorMs < endMs) {
        const localDateStr = localDateInTz(cursorMs, tz);
        const dayEndMs = getEndOfDay(localDateStr, tz).getTime();
        const sliceEndMs = Math.min(dayEndMs, endMs);

        const bucketIdx = findBucketIndex(bucketBoundaries, cursorMs);
        if (bucketIdx >= 0) {
          const seconds = (sliceEndMs - cursorMs) / MS_PER_SECOND;
          entry.perBucket[bucketIdx] += seconds;
          entry.total += seconds;
        }

        cursorMs = sliceEndMs + 1;
      }
    }

    const ranked = Array.from(byCategory.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);

    // Trim leading weeks where the user effectively wasn't tracking yet —
    // covers starting the app mid-month, plus stray test entries / a few
    // forgotten minutes from setup. A bucket counts as "tracked" once its
    // total across all top categories exceeds the relative threshold below
    // (10% of the busiest bucket). Trim at the bucket level so all rows and
    // the shared week labels stay aligned.
    const bucketTotals = buckets.map((_, i) =>
      ranked.reduce((sum, cat) => sum + cat.perBucket[i], 0),
    );
    const peakBucketTotal = Math.max(0, ...bucketTotals);
    const trimThreshold = peakBucketTotal * 0.1;

    let trimFrom = 0;
    for (let i = 0; i < buckets.length; i += 1) {
      if (bucketTotals[i] > trimThreshold) break;
      trimFrom = i + 1;
    }
    // Safety: never trim everything — at minimum keep the last bucket so the
    // sparkline + shared labels still render rather than collapsing to empty.
    if (trimFrom >= buckets.length) trimFrom = Math.max(0, buckets.length - 1);

    const trimmedBuckets = buckets.slice(trimFrom);
    const trimmedRanked: CategoryTrend[] = ranked.map(
      ({ meta, perBucket, total }) => ({
        category: meta,
        values: perBucket.slice(trimFrom),
        totalSeconds: total,
        goalDirection: goalDirectionByCategory.get(meta.id) ?? null,
        weeklyTargetSeconds: weeklyTargetByCategory.get(meta.id) ?? null,
      }),
    );

    let maxBucketSeconds = 0;
    for (const cat of trimmedRanked) {
      for (const v of cat.values) {
        if (v > maxBucketSeconds) maxBucketSeconds = v;
      }
    }

    return {
      categories: trimmedRanked,
      maxBucketSeconds,
      buckets: trimmedBuckets,
    };
  }, [rows, buckets, timezone, monthStart, monthEnd, limit, goalDirectionByCategory, weeklyTargetByCategory]);

  return {
    buckets: result.buckets,
    categories: result.categories,
    maxBucketSeconds: result.maxBucketSeconds,
    isLoading,
  };
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function shiftDate(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d, 12) + deltaDays * MS_PER_DAY;
  return new Date(ms).toISOString().slice(0, 10);
}

function localDateInTz(ms: number, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(
    new Date(ms),
  );
}

function findBucketIndex(
  boundaries: { startMs: number; endMs: number }[],
  ms: number,
): number {
  for (let i = 0; i < boundaries.length; i += 1) {
    if (ms >= boundaries[i].startMs && ms <= boundaries[i].endMs) return i;
  }
  return -1;
}
