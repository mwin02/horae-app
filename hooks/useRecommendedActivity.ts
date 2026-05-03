import { useMemo } from 'react';
import { useQuery } from '@powersync/react';
import { ACTIVITY_LOOKUP_QUERY, RECOMMENDATION_QUERY } from '@/db/queries';
import type { RecommendedActivity } from '@/db/models';
import { getCurrentTimezone } from '@/lib/timezone';

interface FlatRow {
  started_at: string;
  timezone: string;
  activity_id: string;
  activity_name: string;
  category_name: string;
  category_color: string;
  category_icon: string | null;
}

interface ActivityLookupRow {
  activity_id: string;
  activity_name: string;
  category_name: string;
  category_color: string;
  category_icon: string | null;
}

export interface UseRecommendedActivityResult {
  recommendations: RecommendedActivity[];
  isLoading: boolean;
}

const HOUR_WINDOW = 1;
const RECENCY_HALF_LIFE_DAYS = 14;
const MIN_QUALIFYING_ENTRIES = 2;
const MAX_RECOMMENDATIONS = 5;
const RECENT_EXCLUSION_COUNT = 3;
const WEEKDAY_FALLBACK_WEIGHT = 0.5;
const MS_PER_DAY = 86_400_000;

const HISTORY_SUBTITLE = 'You usually start around now';

interface RoutineSlot {
  /** Lower-case activity name to match against the user's catalog. */
  name: string;
  /** Local hour (0-23) when the slot opens. */
  startHour: number;
  /** Local hour (0-23, exclusive). End < start means the slot wraps midnight. */
  endHour: number;
  /** Subtitle shown on the card when this slot fires. */
  subtitle: string;
  /** If set, only fire on weekend (Sat/Sun) or weekday (Mon-Fri). */
  weekdayClass?: 'weekday' | 'weekend';
}

const ROUTINE_SLOTS: RoutineSlot[] = [
  {
    name: 'breakfast',
    startHour: 6,
    endHour: 10,
    subtitle: "It's around breakfast time",
  },
  {
    name: 'lunch',
    startHour: 11,
    endHour: 14,
    subtitle: "It's around lunchtime",
  },
  {
    name: 'dinner',
    startHour: 17,
    endHour: 21,
    subtitle: "It's around dinnertime",
  },
  {
    name: 'night sleep',
    startHour: 22,
    endHour: 2,
    subtitle: 'Winding down for the night',
  },
  {
    name: 'nap',
    startHour: 14,
    endHour: 17,
    subtitle: 'Afternoon nap window',
    weekdayClass: 'weekend',
  },
];

interface LocalParts {
  hour: number;
  weekday: number;
  weekdayClass: 'weekday' | 'weekend';
}

/**
 * Extract local hour (0-23), weekday (0=Sun..6=Sat), and weekday class for a
 * UTC instant in the given IANA timezone.
 */
function getLocalParts(date: Date, timezone: string): LocalParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const weekdayShort = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun';
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0';
  const hour = Number(hourStr) % 24;

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const weekday = weekdayMap[weekdayShort] ?? 0;
  const weekdayClass: 'weekday' | 'weekend' =
    weekday === 0 || weekday === 6 ? 'weekend' : 'weekday';

  return { hour, weekday, weekdayClass };
}

function isHourWithinWindow(entryHour: number, targetHour: number): boolean {
  const diff = Math.abs(entryHour - targetHour);
  const wrapped = Math.min(diff, 24 - diff);
  return wrapped <= HOUR_WINDOW;
}

/** True if the current local hour falls inside a (possibly midnight-wrapping) slot. */
function isHourInSlot(hour: number, slot: RoutineSlot): boolean {
  if (slot.startHour <= slot.endHour) {
    return hour >= slot.startHour && hour < slot.endHour;
  }
  return hour >= slot.startHour || hour < slot.endHour;
}

interface Score {
  activityId: string;
  activityName: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string | null;
  weight: number;
  count: number;
}

/**
 * Reactive hook returning up to MAX_RECOMMENDATIONS activity suggestions for
 * the Home tab. Combines two sources:
 *
 *   1. **History** — same-weekday + ±1h hour matches over the last 60 days,
 *      ranked by recency-decayed weight (14-day half life). Falls back to
 *      same weekday-class (weekday/weekend) at half weight when same-weekday
 *      data is sparse.
 *   2. **Routine** — fixed time-of-day slots (lunch, dinner, night sleep…)
 *      matched by lowercase activity name against the user's catalog. Fills
 *      remaining slots when history is sparse.
 *
 * Excludes the user's last RECENT_EXCLUSION_COUNT distinct activities and
 * the currently-running activity. Caps to one activity per category until
 * slots fill, then allows seconds.
 */
export function useRecommendedActivity(
  currentActivityId?: string | null,
): UseRecommendedActivityResult {
  const { data: historyData, isLoading: historyLoading } =
    useQuery<FlatRow>(RECOMMENDATION_QUERY);
  const { data: catalogData, isLoading: catalogLoading } = useQuery<ActivityLookupRow>(
    ACTIVITY_LOOKUP_QUERY,
  );

  const recommendations = useMemo((): RecommendedActivity[] => {
    const tz = getCurrentTimezone();
    const now = new Date();
    const target = getLocalParts(now, tz);
    const nowMs = now.getTime();

    // --- Build "recent" exclusion set from the (DESC-ordered) history rows:
    // last N distinct activities + the currently-running activity.
    const excluded = new Set<string>();
    if (historyData) {
      const recent = new Set<string>();
      for (const row of historyData) {
        if (recent.size >= RECENT_EXCLUSION_COUNT) break;
        recent.add(row.activity_id);
      }
      for (const id of recent) excluded.add(id);
    }
    if (currentActivityId) excluded.add(currentActivityId);

    // --- Score history candidates.
    const scores = new Map<string, Score>();

    if (historyData) {
      for (const row of historyData) {
        const startedAt = new Date(row.started_at);
        const startedMs = startedAt.getTime();
        if (Number.isNaN(startedMs)) continue;

        const local = getLocalParts(startedAt, row.timezone || tz);
        if (!isHourWithinWindow(local.hour, target.hour)) continue;

        const sameWeekday = local.weekday === target.weekday;
        const sameWeekdayClass = local.weekdayClass === target.weekdayClass;
        if (!sameWeekday && !sameWeekdayClass) continue;

        const daysAgo = Math.max(0, (nowMs - startedMs) / MS_PER_DAY);
        const recency = 1 / (1 + daysAgo / RECENCY_HALF_LIFE_DAYS);
        const weight = sameWeekday
          ? recency
          : recency * WEEKDAY_FALLBACK_WEIGHT;

        const existing = scores.get(row.activity_id);
        if (existing) {
          existing.weight += weight;
          existing.count += 1;
        } else {
          scores.set(row.activity_id, {
            activityId: row.activity_id,
            activityName: row.activity_name,
            categoryName: row.category_name,
            categoryColor: row.category_color,
            categoryIcon: row.category_icon,
            weight,
            count: 1,
          });
        }
      }
    }

    const historyRanked: RecommendedActivity[] = Array.from(scores.values())
      .filter((s) => s.count >= MIN_QUALIFYING_ENTRIES && !excluded.has(s.activityId))
      .sort((a, b) => b.weight - a.weight)
      .map((s) => ({
        activityId: s.activityId,
        activityName: s.activityName,
        categoryName: s.categoryName,
        categoryColor: s.categoryColor,
        categoryIcon: s.categoryIcon,
        reason: 'history',
        subtitle: HISTORY_SUBTITLE,
      }));

    // --- Resolve active routine slots against the user's catalog.
    const routineRecs: RecommendedActivity[] = [];
    if (catalogData && catalogData.length > 0) {
      const byName = new Map<string, ActivityLookupRow>();
      for (const row of catalogData) {
        const key = row.activity_name.trim().toLowerCase();
        if (!byName.has(key)) byName.set(key, row);
      }

      for (const slot of ROUTINE_SLOTS) {
        if (!isHourInSlot(target.hour, slot)) continue;
        if (slot.weekdayClass && slot.weekdayClass !== target.weekdayClass) continue;
        const match = byName.get(slot.name);
        if (!match) continue;
        if (excluded.has(match.activity_id)) continue;
        routineRecs.push({
          activityId: match.activity_id,
          activityName: match.activity_name,
          categoryName: match.category_name,
          categoryColor: match.category_color,
          categoryIcon: match.category_icon,
          reason: 'routine',
          subtitle: slot.subtitle,
        });
      }
    }

    // --- Merge with diversity cap (one per category, then relax).
    const merged: RecommendedActivity[] = [];
    const usedActivityIds = new Set<string>();
    const usedCategories = new Set<string>();

    const pickRound = (
      pool: RecommendedActivity[],
      enforceCategoryCap: boolean,
    ): void => {
      for (const rec of pool) {
        if (merged.length >= MAX_RECOMMENDATIONS) return;
        if (usedActivityIds.has(rec.activityId)) continue;
        if (enforceCategoryCap && usedCategories.has(rec.categoryName)) continue;
        merged.push(rec);
        usedActivityIds.add(rec.activityId);
        usedCategories.add(rec.categoryName);
      }
    };

    // Routines first (they're the time-of-day signal), then history fills the rest.
    pickRound(routineRecs, true);
    pickRound(historyRanked, true);
    if (merged.length < MAX_RECOMMENDATIONS) {
      // Relax the diversity cap if we still have empty slots.
      pickRound(historyRanked, false);
      pickRound(routineRecs, false);
    }

    return merged;
  }, [historyData, catalogData, currentActivityId]);

  return { recommendations, isLoading: historyLoading || catalogLoading };
}
