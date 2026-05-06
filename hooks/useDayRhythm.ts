import { TIMELINE_ENTRIES_QUERY, type TimelineEntryRow } from "@/db/queries";
import {
  getCurrentTimezone,
  getEndOfDay,
  getStartOfDay,
} from "@/lib/timezone";
import { useQuery } from "@powersync/react";
import { useMemo } from "react";

export interface RhythmCategory {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

export interface RhythmHour {
  hour: number; // 0..23
  dominant: RhythmCategory | null;
  /** Fraction of the hour covered by the dominant category (0..1). */
  dominantFraction: number;
  /** Total fraction of the hour covered by any tracked entry (0..1). */
  coveredFraction: number;
}

export interface UseDayRhythmResult {
  hours: RhythmHour[];
  /** Unique categories appearing in any hour, ordered by total seconds desc. */
  legend: RhythmCategory[];
  isLoading: boolean;
}

const SECONDS_PER_HOUR = 3600;

/**
 * Aggregates the selected day's entries into 24 hourly buckets (in the
 * entry's stored timezone). For each hour, picks the category that consumed
 * the most seconds.
 */
export function useDayRhythm(selectedDate: string): UseDayRhythmResult {
  const timezone = getCurrentTimezone();

  const { dayStart, dayEnd } = useMemo(
    () => ({
      dayStart: getStartOfDay(selectedDate, timezone),
      dayEnd: getEndOfDay(selectedDate, timezone),
    }),
    [selectedDate, timezone],
  );

  const { data: rows, isLoading } = useQuery<TimelineEntryRow>(
    TIMELINE_ENTRIES_QUERY,
    [dayEnd.toISOString(), dayStart.toISOString()],
  );

  const result = useMemo(() => {
    // For each hour bucket, map category_id → seconds.
    const buckets: Map<string, number>[] = Array.from(
      { length: 24 },
      () => new Map<string, number>(),
    );
    const categoryMeta = new Map<string, RhythmCategory>();
    const categoryTotals = new Map<string, number>();

    const dayStartMs = dayStart.getTime();
    const dayEndMs = dayEnd.getTime();
    const nowMs = Date.now();

    for (const row of rows) {
      const startMs = Math.max(new Date(row.started_at).getTime(), dayStartMs);
      const rawEndMs = row.ended_at
        ? new Date(row.ended_at).getTime()
        : nowMs;
      const endMs = Math.min(rawEndMs, dayEndMs);
      if (endMs <= startMs) continue;

      const catId = `${row.category_name}|${row.category_color}`; // stable key; id not in row
      categoryMeta.set(catId, {
        id: catId,
        name: row.category_name,
        color: row.category_color,
        icon: row.category_icon,
      });

      // Walk each hour in the entry's local timezone. Use the entry's own
      // timezone to bucket hours.
      const tz = row.timezone;
      let cursorMs = startMs;
      while (cursorMs < endMs) {
        const localHour = getLocalHour(cursorMs, tz);
        const nextHourBoundaryMs = getNextHourBoundaryMs(cursorMs, tz);
        const sliceEndMs = Math.min(nextHourBoundaryMs, endMs);
        const seconds = (sliceEndMs - cursorMs) / 1000;

        const bucket = buckets[localHour];
        bucket.set(catId, (bucket.get(catId) ?? 0) + seconds);
        categoryTotals.set(
          catId,
          (categoryTotals.get(catId) ?? 0) + seconds,
        );

        cursorMs = sliceEndMs;
      }
    }

    const hours: RhythmHour[] = buckets.map((bucket, hour) => {
      let dominant: RhythmCategory | null = null;
      let dominantSeconds = 0;
      let totalSeconds = 0;
      for (const [catId, seconds] of bucket) {
        totalSeconds += seconds;
        if (seconds > dominantSeconds) {
          dominantSeconds = seconds;
          dominant = categoryMeta.get(catId) ?? null;
        }
      }
      return {
        hour,
        dominant,
        dominantFraction: dominantSeconds / SECONDS_PER_HOUR,
        coveredFraction: Math.min(1, totalSeconds / SECONDS_PER_HOUR),
      };
    });

    const legend = Array.from(categoryMeta.values()).sort(
      (a, b) =>
        (categoryTotals.get(b.id) ?? 0) - (categoryTotals.get(a.id) ?? 0),
    );

    return { hours, legend };
  }, [rows, dayStart, dayEnd]);

  return { hours: result.hours, legend: result.legend, isLoading };
}

// ──────────────────────────────────────────────
// Local-hour helpers (Intl-based, no deps)
// ──────────────────────────────────────────────

function getLocalParts(
  ms: number,
  tz: string,
): { hour: number; minute: number; second: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(ms));
  const get = (t: string): number =>
    Number(parts.find((p) => p.type === t)?.value ?? 0);
  const hour = get("hour") === 24 ? 0 : get("hour");
  return { hour, minute: get("minute"), second: get("second") };
}

function getLocalHour(ms: number, tz: string): number {
  return getLocalParts(ms, tz).hour;
}

/** Return the ms timestamp of the next local-hour boundary after `ms`. */
function getNextHourBoundaryMs(ms: number, tz: string): number {
  const { minute, second } = getLocalParts(ms, tz);
  const msIntoHour = minute * 60_000 + second * 1000;
  return ms + (3_600_000 - msIntoHour);
}
