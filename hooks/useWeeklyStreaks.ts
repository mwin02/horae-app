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
import { getWeekRange } from "./useInsightsData";
import { useUserPreferences } from "./useUserPreferences";

export const STREAK_WEEKS = 12;
const AROUND_TOLERANCE = 0.2;
const ON_TRACK_PACE = 0.6;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type WeekHit = 0 | 1 | null;

interface CategoryMetaRow {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

const CATEGORIES_FOR_STREAK_QUERY = `
  SELECT id, name, color, icon
  FROM categories
  WHERE is_archived = 0 AND deleted_at IS NULL
`;

interface WeekBucket {
  startMs: number;
  endMs: number;
}

export interface WeeklyStreakCategory {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string | null;
  goalSeconds: number;
  goalDirection: GoalDirection;
  /** Trailing consecutive hits across the 11 completed weeks. */
  streak: number;
  /** Longest run of hits across the 11 completed weeks. */
  best: number;
  /**
   * Length `STREAK_WEEKS` (12). Index 0 = oldest, last = current in-progress
   * week. Past weeks before the user started tracking are `null`.
   */
  history: WeekHit[];
  thisWeek: {
    actualSeconds: number;
    goalSeconds: number;
    /** Days remaining in the current week (rounded up, ≥0). */
    daysLeft: number;
    /** True for `at_most` goals — pacing semantics flip. */
    isLimit: boolean;
    /** Whether the current-week ring should render in the on-track color. */
    onTrack: boolean;
    /** 0…1 share of the goal completed so far. */
    progressPct: number;
  };
}

export interface UseWeeklyStreaksResult {
  categories: WeeklyStreakCategory[];
  isLoading: boolean;
}

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d, 12) + days * MS_PER_DAY;
  return new Date(ms).toISOString().slice(0, 10);
}

function isHit(
  actualSeconds: number,
  goalSeconds: number,
  direction: GoalDirection,
): boolean {
  if (direction === "at_least") return actualSeconds >= goalSeconds;
  if (direction === "at_most") return actualSeconds <= goalSeconds;
  if (goalSeconds <= 0) return false;
  return Math.abs(actualSeconds - goalSeconds) <= goalSeconds * AROUND_TOLERANCE;
}

/**
 * Returns last 12 ISO weeks of streak data per category that has a weekly
 * goal. Each week is scored hit/miss against the resolved weekly target,
 * honoring `goalDirection`. Weeks before the user's first tracked entry are
 * marked `null` so the history dots don't punish a fresh install.
 */
export function useWeeklyStreaks(weekDate: string): UseWeeklyStreaksResult {
  const timezone = getCurrentTimezone();
  const { preferences } = useUserPreferences();
  const weekStartDay = preferences.weekStartDay;

  const ranges = useMemo(() => {
    const { weekStart } = getWeekRange(weekDate, weekStartDay);
    const buckets: WeekBucket[] = [];
    for (let i = STREAK_WEEKS - 1; i >= 0; i -= 1) {
      const anchor = shiftDate(weekStart, -7 * i);
      const { weekStart: ws, weekEnd: we } = getWeekRange(anchor, weekStartDay);
      buckets.push({
        startMs: getStartOfDay(ws, timezone).getTime(),
        endMs: getEndOfDay(we, timezone).getTime(),
      });
    }
    return {
      buckets,
      queryStart: new Date(buckets[0].startMs).toISOString(),
      queryEnd: new Date(buckets[buckets.length - 1].endMs).toISOString(),
    };
  }, [weekDate, weekStartDay, timezone]);

  const { data: entryRows, isLoading: entriesLoading } =
    useQuery<TimelineEntryRow>(TIMELINE_ENTRIES_QUERY, [
      ranges.queryEnd,
      ranges.queryStart,
    ]);

  const { data: categoryRows, isLoading: categoriesLoading } =
    useQuery<CategoryMetaRow>(CATEGORIES_FOR_STREAK_QUERY);

  const { data: allocationRows, isLoading: allocationsLoading } =
    useQuery<IdealAllocationRow>(IDEAL_ALLOCATIONS_QUERY);

  const categories = useMemo<WeeklyStreakCategory[]>(() => {
    const weeklyTargets = resolveWeeklyTargetSeconds(allocationRows);
    if (weeklyTargets.size === 0) return [];

    const directionsById = new Map<string, GoalDirection[]>();
    for (const row of allocationRows) {
      if (row.goal_direction == null) continue;
      const list = directionsById.get(row.category_id) ?? [];
      list.push(row.goal_direction);
      directionsById.set(row.category_id, list);
    }
    const resolveDirection = (id: string): GoalDirection => {
      const list = directionsById.get(id) ?? [];
      if (list.length === 0) return "around";
      const first = list[0];
      return list.every((d) => d === first) ? first : "around";
    };

    const meta = new Map<string, CategoryMetaRow>();
    for (const c of categoryRows) meta.set(c.id, c);

    const perCategoryWeekly = new Map<string, number[]>();
    const anyEntryPerWeek: boolean[] = new Array(STREAK_WEEKS).fill(false);
    const nowMs = Date.now();

    for (const row of entryRows) {
      const startMs = new Date(row.started_at).getTime();
      const endMs = row.ended_at ? new Date(row.ended_at).getTime() : nowMs;
      let perCat = perCategoryWeekly.get(row.category_id);
      if (!perCat) {
        perCat = new Array<number>(STREAK_WEEKS).fill(0);
        perCategoryWeekly.set(row.category_id, perCat);
      }
      for (let i = 0; i < STREAK_WEEKS; i += 1) {
        const b = ranges.buckets[i];
        const overlap =
          Math.max(0, Math.min(endMs, b.endMs) - Math.max(startMs, b.startMs));
        if (overlap <= 0) continue;
        perCat[i] += overlap / 1000;
        anyEntryPerWeek[i] = true;
      }
    }

    let firstTrackedWeek = anyEntryPerWeek.findIndex((v) => v);
    if (firstTrackedWeek < 0) firstTrackedWeek = STREAK_WEEKS;

    const result: WeeklyStreakCategory[] = [];
    for (const [categoryId, goalSeconds] of weeklyTargets) {
      const m = meta.get(categoryId);
      if (!m) continue;
      const direction = resolveDirection(categoryId);
      const seconds =
        perCategoryWeekly.get(categoryId) ??
        new Array<number>(STREAK_WEEKS).fill(0);

      const history: WeekHit[] = seconds.map((sec, i) => {
        if (i < firstTrackedWeek) return null;
        return isHit(sec, goalSeconds, direction) ? 1 : 0;
      });

      const completed = history.slice(0, STREAK_WEEKS - 1);
      let streak = 0;
      for (let i = completed.length - 1; i >= 0; i -= 1) {
        if (completed[i] === 1) streak += 1;
        else break;
      }
      let best = 0;
      let run = 0;
      for (const h of completed) {
        if (h === 1) {
          run += 1;
          if (run > best) best = run;
        } else {
          run = 0;
        }
      }
      best = Math.max(best, streak);

      const currentBucket = ranges.buckets[STREAK_WEEKS - 1];
      const currentActual = seconds[STREAK_WEEKS - 1];
      const isLimit = direction === "at_most";
      const progressPct =
        goalSeconds > 0 ? Math.min(1, currentActual / goalSeconds) : 0;
      const onTrack = isLimit
        ? currentActual <= goalSeconds
        : direction === "at_least"
          ? currentActual >= goalSeconds * ON_TRACK_PACE
          : Math.abs(currentActual - goalSeconds) <=
            goalSeconds * AROUND_TOLERANCE;
      const remainingMs = Math.max(0, currentBucket.endMs - nowMs);
      const daysLeft = Math.max(0, Math.ceil(remainingMs / MS_PER_DAY));

      result.push({
        categoryId,
        categoryName: m.name,
        categoryColor: m.color,
        categoryIcon: m.icon,
        goalSeconds,
        goalDirection: direction,
        streak,
        best,
        history,
        thisWeek: {
          actualSeconds: currentActual,
          goalSeconds,
          daysLeft,
          isLimit,
          onTrack,
          progressPct,
        },
      });
    }

    result.sort(
      (a, b) =>
        b.streak - a.streak || a.categoryName.localeCompare(b.categoryName),
    );
    return result;
  }, [allocationRows, categoryRows, entryRows, ranges]);

  return {
    categories,
    isLoading: entriesLoading || categoriesLoading || allocationsLoading,
  };
}
