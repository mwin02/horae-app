import { getIntlLocale } from "@/lib/i18n";

/**
 * Locale-aware display formatting. Everything here is for *showing* values;
 * never parse these strings back or use them as keys.
 */

/** Weekday name for the app's day index (0=Mon … 6=Sun). */
export function formatWeekday(
  dayIndex: number,
  width: "long" | "short" | "narrow" = "short",
): string {
  // 2024-01-01 was a Monday; format in UTC so the device tz can't shift it.
  const date = new Date(Date.UTC(2024, 0, 1 + dayIndex, 12));
  return new Intl.DateTimeFormat(getIntlLocale(), {
    weekday: width,
    timeZone: "UTC",
  }).format(date);
}

/** Weekday names in app order (Mon … Sun). */
export function weekdayNames(width: "long" | "short" | "narrow" = "short"): string[] {
  return Array.from({ length: 7 }, (_, i) => formatWeekday(i, width));
}
