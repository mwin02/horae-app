import { TIMELINE_ENTRIES_QUERY, type TimelineEntryRow } from "@/db/queries";
import {
  getCurrentTimezone,
  getEndOfDay,
  getStartOfDay,
  getTodayDate,
} from "@/lib/timezone";
import { useQuery } from "@powersync/react";
import { useMemo } from "react";
import { getMonthRange } from "./useInsightsData";

export interface DayCoverageCell {
  date: string; // YYYY-MM-DD (in device timezone)
  trackedSeconds: number;
  /** Fraction of 24h covered (0..1). */
  coverage: number;
  /** Day-of-week for the cell (Mon=0 … Sun=6). */
  dayOfWeek: number;
  /** Day number (1..31) for display. */
  dayNumber: number;
  isFuture: boolean;
  isToday: boolean;
}

export interface UseMonthlyCoverageResult {
  days: DayCoverageCell[];
  /** YYYY-MM-DD of the first day of the month. */
  monthStart: string;
  /** YYYY-MM-DD of the last day of the month. */
  monthEnd: string;
  /** Offset columns (Mon=0 … Sun=6) before the first day, for grid alignment. */
  leadingBlankCount: number;
  isLoading: boolean;
}

const SECONDS_PER_DAY = 24 * 60 * 60;

export function useMonthlyCoverage(
  monthDate: string,
): UseMonthlyCoverageResult {
  const timezone = getCurrentTimezone();

  const { monthStart, monthEnd, startIso, endIso } = useMemo(() => {
    const { monthStart, monthEnd } = getMonthRange(monthDate);
    return {
      monthStart,
      monthEnd,
      startIso: getStartOfDay(monthStart, timezone).toISOString(),
      endIso: getEndOfDay(monthEnd, timezone).toISOString(),
    };
  }, [monthDate, timezone]);

  const { data: rows, isLoading } = useQuery<TimelineEntryRow>(
    TIMELINE_ENTRIES_QUERY,
    [endIso, startIso],
  );

  const result = useMemo(() => {
    const today = getTodayDate(timezone);
    const totals = new Map<string, number>(); // YYYY-MM-DD → seconds

    const rangeStartMs = new Date(startIso).getTime();
    const rangeEndMs = new Date(endIso).getTime();
    const nowMs = Date.now();

    for (const row of rows) {
      const rawStartMs = new Date(row.started_at).getTime();
      const rawEndMs = row.ended_at
        ? new Date(row.ended_at).getTime()
        : nowMs;

      const startMs = Math.max(rawStartMs, rangeStartMs);
      const endMs = Math.min(rawEndMs, rangeEndMs);
      if (endMs <= startMs) continue;

      // Walk day-by-day in the entry's own timezone, splitting at local
      // midnight so cross-midnight entries count against the correct day.
      const tz = row.timezone;
      let cursorMs = startMs;
      while (cursorMs < endMs) {
        const localDateStr = localDateInTz(cursorMs, tz);
        const dayEnd = getEndOfDay(localDateStr, tz).getTime();
        const sliceEndMs = Math.min(dayEnd, endMs);
        const seconds = (sliceEndMs - cursorMs) / 1000;
        totals.set(localDateStr, (totals.get(localDateStr) ?? 0) + seconds);
        cursorMs = sliceEndMs + 1;
      }
    }

    const days: DayCoverageCell[] = [];
    const [year, month] = monthStart.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const jsDate = new Date(year, month - 1, d, 12);
      const dow = jsDate.getDay(); // 0=Sun..6=Sat
      const monFirstDow = dow === 0 ? 6 : dow - 1; // Mon=0..Sun=6
      const trackedSeconds = totals.get(dateStr) ?? 0;

      days.push({
        date: dateStr,
        trackedSeconds,
        coverage: Math.min(1, trackedSeconds / SECONDS_PER_DAY),
        dayOfWeek: monFirstDow,
        dayNumber: d,
        isFuture: dateStr > today,
        isToday: dateStr === today,
      });
    }

    const leadingBlankCount = days.length > 0 ? days[0].dayOfWeek : 0;

    return { days, leadingBlankCount };
  }, [rows, monthStart, startIso, endIso, timezone]);

  return {
    days: result.days,
    monthStart,
    monthEnd,
    leadingBlankCount: result.leadingBlankCount,
    isLoading,
  };
}

function localDateInTz(ms: number, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(
    new Date(ms),
  );
}
