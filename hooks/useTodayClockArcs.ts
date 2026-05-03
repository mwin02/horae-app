import {
  TIMELINE_ENTRIES_QUERY,
  type TimelineEntryRow,
} from "@/db/queries";
import {
  getCurrentTimezone,
  getEndOfDay,
  getStartOfDay,
  getTodayDate,
} from "@/lib/timezone";
import { minutesSinceMidnight } from "./useTimelineData";
import { useQuery } from "@powersync/react";
import { useEffect, useMemo, useState } from "react";

/**
 * One arc on the 24h clock ring. Minutes are relative to today's local
 * midnight in the user's current timezone, in [0, 1440].
 */
export interface ClockArc {
  entryId: string;
  activityId: string;
  startMinute: number;
  endMinute: number;
  color: string;
  isRunning: boolean;
}

export interface UseTodayClockArcsResult {
  arcs: ClockArc[];
  totalTrackedSeconds: number;
  /** Local minutes since today's midnight, in [0, 1440]. Ticks once a minute. */
  nowMinutes: number;
  timezone: string;
  isLoading: boolean;
}

const DAY_MINUTES = 24 * 60;

/**
 * Maps today's time entries to per-entry arcs on a 24h clock face. Entries
 * are clipped to today's local-midnight bounds; the running entry's end is
 * clamped to "now" and ticks once per minute so the arc grows live.
 */
export function useTodayClockArcs(): UseTodayClockArcsResult {
  const timezone = getCurrentTimezone();
  const today = getTodayDate(timezone);

  const { dayStart, dayEnd } = useMemo(
    () => ({
      dayStart: getStartOfDay(today, timezone),
      dayEnd: getEndOfDay(today, timezone),
    }),
    [today, timezone],
  );

  const { data: rows, isLoading } = useQuery<TimelineEntryRow>(
    TIMELINE_ENTRIES_QUERY,
    [dayEnd.toISOString(), dayStart.toISOString()],
  );

  // Tick once per minute so the running entry's arc grows smoothly without
  // being chatty. Aligned to the next minute boundary.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const schedule = (): void => {
      const current = new Date();
      const ms =
        60_000 - current.getSeconds() * 1000 - current.getMilliseconds() + 50;
      timeoutId = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, ms);
    };
    schedule();
    return () => clearTimeout(timeoutId);
  }, []);

  return useMemo(() => {
    const nowMinutes = Math.min(
      DAY_MINUTES,
      minutesSinceMidnight(now, timezone),
    );

    const arcs: ClockArc[] = [];

    for (const row of rows) {
      const startedAt = new Date(row.started_at);
      const endedAt = row.ended_at ? new Date(row.ended_at) : null;
      const isRunning = endedAt === null;

      // Clip to today's local bounds.
      const clampedStart = startedAt < dayStart ? dayStart : startedAt;
      const effectiveEnd = endedAt ?? now;
      const clampedEnd = effectiveEnd > dayEnd ? dayEnd : effectiveEnd;
      if (clampedEnd <= clampedStart) continue;

      const startMinute = minutesSinceMidnight(clampedStart, timezone);
      // Cross-midnight entries that start before today and end inside today
      // would otherwise wrap (start=1380, end=120). Force start=0 for those.
      const correctedStart =
        startedAt < dayStart ? 0 : startMinute;
      let endMinute = minutesSinceMidnight(clampedEnd, timezone);
      // For a running entry that extends past now, clamp to nowMinutes.
      if (isRunning) endMinute = Math.min(endMinute, nowMinutes);
      // Same wrap concern for entries that end on the next day's midnight.
      if (endedAt && endedAt > dayEnd) endMinute = DAY_MINUTES;
      if (endMinute <= correctedStart) continue;

      arcs.push({
        entryId: row.entry_id,
        activityId: row.activity_id,
        startMinute: correctedStart,
        endMinute,
        color: row.category_color,
        isRunning,
      });
    }

    // Total tracked is the union of arcs (overlapping entries shouldn't
    // double-count wall-clock time). Sweep-merge sorted starts.
    const sorted = [...arcs].sort((a, b) => a.startMinute - b.startMinute);
    let totalMinutes = 0;
    if (sorted.length > 0) {
      let curStart = sorted[0].startMinute;
      let curEnd = sorted[0].endMinute;
      for (let i = 1; i < sorted.length; i++) {
        const { startMinute: s, endMinute: e } = sorted[i];
        if (s <= curEnd) {
          if (e > curEnd) curEnd = e;
        } else {
          totalMinutes += curEnd - curStart;
          curStart = s;
          curEnd = e;
        }
      }
      totalMinutes += curEnd - curStart;
    }

    return {
      arcs,
      totalTrackedSeconds: totalMinutes * 60,
      nowMinutes,
      timezone,
      isLoading,
    };
  }, [rows, dayStart, dayEnd, now, timezone, isLoading]);
}
