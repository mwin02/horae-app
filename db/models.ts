/**
 * Application-level types that add semantics on top of the raw database records.
 * Use these in components and hooks — they provide better type safety than raw records.
 */

// Re-export raw record types for query results
export type {
  ActivityRecord,
  CategoryRecord,
  DailySummaryRecord,
  EntryTagRecord,
  IdealAllocationRecord,
  TagRecord,
  TimeEntryRecord,
} from "./schema";

/** A tag as displayed in the UI */
export interface TagItem {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

/** Source of a time entry */
export type TimeEntrySource = "timer" | "manual" | "retroactive" | "import";

/** A category with its activities (for the activity picker) */
export interface CategoryWithActivities {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  isPreset: boolean;
  sortOrder: number;
  activities: ActivityItem[];
}

/**
 * An activity as displayed in the UI.
 *
 * `color` / `icon` are the *resolved* display values — activity override if
 * set, otherwise the parent category's value (see `resolveActivityVisuals`).
 * `categoryColor` is the parent's actual color, exposed separately for sites
 * that need to render the category itself (e.g. category badges) vs. the
 * activity (e.g. dot, icon).
 */
export interface ActivityItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  name: string;
  isPreset: boolean;
  /** Resolved display color (override or category fallback). */
  color: string;
  /** Resolved display icon (override or category fallback); null = no icon. */
  icon: string | null;
  /** Raw activity-level override (null = inherit from category). */
  colorOverride: string | null;
  /** Raw activity-level override (null = inherit from category). */
  iconOverride: string | null;
}

/** The currently running timer (if any) */
export interface RunningTimer {
  entryId: string;
  activityId: string;
  activityName: string;
  categoryName: string;
  /** Resolved activity color (override or category fallback). */
  categoryColor: string;
  startedAt: Date;
  elapsedSeconds: number;
  timezone: string;
}

/** A time-of-day-aware activity recommendation for the idle TimerCard */
export interface RecommendedActivity {
  activityId: string;
  activityName: string;
  categoryName: string;
  /** Resolved activity color (override or category fallback). */
  categoryColor: string;
}

/** A time entry as displayed on the timeline */
export interface TimelineEntry {
  id: string;
  activityName: string;
  categoryName: string;
  /** Resolved activity color (override or category fallback). */
  categoryColor: string;
  startedAt: Date;
  endedAt: Date | null;
  isRunning: boolean;
  durationSeconds: number | null;
  note: string | null;
  source: TimeEntrySource;
  timezone: string;
  /** True if the real entry started before this day's local midnight (clipped at top) */
  continuesBefore: boolean;
  /** True if the real entry extends past this day's local midnight (clipped at bottom) */
  continuesAfter: boolean;
}

/** A gap in the timeline (untracked time) */
export interface TimelineGap {
  startedAt: Date;
  endedAt: Date;
  durationSeconds: number;
}

/**
 * How actual time relates to the ideal target.
 *  - 'at_least'  → user wants actual ≥ target (e.g. work, exercise)
 *  - 'at_most'   → user wants actual ≤ target (e.g. entertainment, doomscrolling)
 *  - 'around'    → user wants actual ≈ target (symmetric tolerance)
 */
export type GoalDirection = 'at_least' | 'at_most' | 'around';

/** Insight data for a single category */
export interface CategoryInsight {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  actualMinutes: number;
  targetMinutes: number | null;
  differenceMinutes: number | null;
  /** null when the category has no goal. */
  goalDirection: GoalDirection | null;
}

/** Daily coverage stats */
export interface DayCoverage {
  date: string;
  trackedMinutes: number;
  coveragePercent: number;
}
