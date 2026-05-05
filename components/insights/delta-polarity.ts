import { COLORS } from "@/constants/theme";
import type { GoalDirection } from "@/db/models";
import type { IdealAllocationRow } from "@/db/queries";

export type DeltaPolarity = "good" | "bad" | "neutral";

export interface AroundContext {
  /** Current period's tracked seconds. */
  thisSeconds: number;
  /** Prior period's tracked seconds. */
  lastSeconds: number;
  /** Target in seconds for the period. */
  targetSeconds: number;
}

/**
 * Map a directional delta + the category's goal polarity to a qualitative
 * good/bad/neutral verdict.
 *
 * - `at_least` / `at_most`: simple direction match (more = good for at_least,
 *   bad for at_most).
 * - `around`: needs `context`. Compares distance-to-target between the two
 *   periods — good if `this` is closer than `last`, bad if farther, neutral
 *   if equal or no context.
 * - missing direction or missing context for `around`: neutral.
 */
export function deltaPolarity(
  direction: GoalDirection | null,
  up: boolean,
  context?: AroundContext,
): DeltaPolarity {
  if (direction == null) return "neutral";
  if (direction === "around") {
    if (!context || context.targetSeconds <= 0) return "neutral";
    const thisDist = Math.abs(context.thisSeconds - context.targetSeconds);
    const lastDist = Math.abs(context.lastSeconds - context.targetSeconds);
    if (thisDist < lastDist) return "good";
    if (thisDist > lastDist) return "bad";
    return "neutral";
  }
  if (direction === "at_most") return up ? "bad" : "good";
  return up ? "good" : "bad"; // at_least
}

export interface DeltaPalette {
  fg: string;
  bg: string;
}

export function deltaPalette(polarity: DeltaPolarity): DeltaPalette {
  if (polarity === "good") {
    return { fg: COLORS.secondary, bg: COLORS.secondaryContainer };
  }
  if (polarity === "bad") {
    return { fg: COLORS.error, bg: COLORS.errorContainer };
  }
  return { fg: COLORS.outline, bg: COLORS.surfaceContainer };
}

/**
 * Resolve a per-category weekly target (in seconds) from raw allocation rows.
 *
 * - A `weekly` allocation is used directly.
 * - `daily` allocations are summed across Mon–Sun (perDay overrides where
 *   present, otherwise the `default` row).
 * - `monthly`-only categories are omitted (cadence doesn't map to a single week).
 */
export function resolveWeeklyTargetSeconds(
  rows: IdealAllocationRow[],
): Map<string, number> {
  type Targets = {
    default: number | null;
    perDay: (number | null)[];
    weekly: number | null;
    hasDaily: boolean;
  };
  const byCat = new Map<string, Targets>();
  for (const row of rows) {
    let entry = byCat.get(row.category_id);
    if (!entry) {
      entry = {
        default: null,
        perDay: [null, null, null, null, null, null, null],
        weekly: null,
        hasDaily: false,
      };
      byCat.set(row.category_id, entry);
    }
    const kind = row.period_kind ?? "daily";
    if (kind === "weekly") {
      entry.weekly = row.target_minutes_per_day;
    } else if (kind === "daily") {
      entry.hasDaily = true;
      if (row.day_of_week == null) {
        entry.default = row.target_minutes_per_day;
      } else if (row.day_of_week >= 0 && row.day_of_week <= 6) {
        entry.perDay[row.day_of_week] = row.target_minutes_per_day;
      }
    }
    // monthly rows ignored — no clean weekly equivalent.
  }

  const out = new Map<string, number>();
  for (const [id, t] of byCat) {
    if (t.weekly != null) {
      out.set(id, t.weekly * 60);
      continue;
    }
    if (!t.hasDaily) continue;
    let total = 0;
    let any = false;
    for (let d = 0; d < 7; d += 1) {
      const v = t.perDay[d] ?? t.default;
      if (v != null) {
        total += v;
        any = true;
      }
    }
    if (any) out.set(id, total * 60);
  }
  return out;
}
