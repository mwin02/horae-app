/**
 * Dev-only seeder for App Store screenshots / demo recordings.
 *
 * Populates the last 21 days (including today) with a believable
 * timeline: distinct weekday vs weekend schedules, small random
 * boundary jitter so days don't look copy-pasted, and a Night Sleep
 * entry per night that crosses midnight. Sets 4 daily goals — some
 * tuned to pass, one tuned to fail — so weekly/monthly insights show
 * a mix of green and red.
 *
 * Why 21 days: covers the weekly view (7d) and gives the monthly /
 * 30-day insights enough body to look real without backfilling a
 * full month.
 *
 * Why a running entry on TODAY: a "running since yesterday" entry
 * would show 12+ hours elapsed in the Home UI, which looks broken.
 * Today's past entries are still seeded up to now − 30 min so the
 * day isn't empty around the running timer.
 *
 * Idempotent — wipes everything in the seed window first. Tied
 * behind EXPO_PUBLIC_ENABLE_DEBUG=1 via Settings → Debug. Never
 * callable in production builds.
 *
 * Hard-deletes on every run — fine because this module only runs in
 * debug builds that are never shipped. Sync compatibility is not a
 * concern here.
 */

import { db } from "@/lib/powersync";
import { generateId } from "@/lib/uuid";
import {
  getCurrentTimezone,
  getEndOfDay,
  getStartOfDay,
  getTodayDate,
  parseLocalTimeOfDay,
} from "@/lib/timezone";
import {
  TIME_ENTRY_SOURCES,
  assertTimeEntrySource,
  nowUTC,
} from "@/db/queries/_helpers";

type SeedScheduleItem = {
  startHHMM: string;
  endHHMM: string;
  categoryName: string;
  activityName: string;
  note?: string;
};

/**
 * Weekday schedule. Contiguous boundaries (each item's end == next
 * item's start) so jittering one boundary keeps adjacent entries
 * butted together with no overlap or gap.
 *
 * Work total: 7h00 (under 8h at_most target — passes).
 * Health total: 75min (over 60min at_least — passes).
 * Learning total: 90min (over 45min at_least — passes).
 */
const WEEKDAY_SCHEDULE: SeedScheduleItem[] = [
  { startHHMM: "07:00", endHHMM: "07:30", categoryName: "Personal Care", activityName: "Meditation", note: "Box breathing, 4-4-4" },
  { startHHMM: "07:30", endHHMM: "08:15", categoryName: "Health & Fitness", activityName: "Exercise", note: "Morning run · 5K easy pace" },
  { startHHMM: "08:15", endHHMM: "08:45", categoryName: "Meals", activityName: "Breakfast" },
  { startHHMM: "08:45", endHHMM: "09:15", categoryName: "Personal Care", activityName: "Hygiene" },
  { startHHMM: "09:15", endHHMM: "12:00", categoryName: "Work", activityName: "Deep Work", note: "Drafting feature spec" },
  { startHHMM: "12:00", endHHMM: "12:30", categoryName: "Work", activityName: "Email" },
  { startHHMM: "12:30", endHHMM: "13:15", categoryName: "Meals", activityName: "Lunch" },
  { startHHMM: "13:15", endHHMM: "13:45", categoryName: "Health & Fitness", activityName: "Walking", note: "Loop around the park" },
  { startHHMM: "13:45", endHHMM: "15:30", categoryName: "Work", activityName: "Deep Work", note: "Implementation work" },
  { startHHMM: "15:30", endHHMM: "16:30", categoryName: "Work", activityName: "Meetings", note: "Weekly sync" },
  { startHHMM: "16:30", endHHMM: "17:30", categoryName: "Work", activityName: "Admin" },
  { startHHMM: "17:30", endHHMM: "18:15", categoryName: "Meals", activityName: "Cooking" },
  { startHHMM: "18:15", endHHMM: "19:00", categoryName: "Meals", activityName: "Dinner" },
  { startHHMM: "19:00", endHHMM: "20:30", categoryName: "Learning", activityName: "Reading", note: "Building a Second Brain · ch. 4" },
  { startHHMM: "20:30", endHHMM: "21:30", categoryName: "Entertainment", activityName: "TV / Movies" },
  { startHHMM: "21:30", endHHMM: "22:00", categoryName: "Personal Care", activityName: "Journaling", note: "Daily reflection" },
  { startHHMM: "22:00", endHHMM: "22:45", categoryName: "Personal Care", activityName: "Hygiene" },
];

/**
 * Weekend schedule — later start, no Work entries, more Social and
 * Chores, longer leisure blocks. Designed so weekly Insights show a
 * clear weekday/weekend rhythm.
 *
 * Health total: 90min · Learning total: 135min · Social: 150min.
 */
const WEEKEND_SCHEDULE: SeedScheduleItem[] = [
  { startHHMM: "08:30", endHHMM: "09:00", categoryName: "Personal Care", activityName: "Meditation" },
  { startHHMM: "09:00", endHHMM: "09:45", categoryName: "Personal Care", activityName: "Hygiene" },
  { startHHMM: "09:45", endHHMM: "10:30", categoryName: "Meals", activityName: "Breakfast" },
  { startHHMM: "10:30", endHHMM: "12:00", categoryName: "Health & Fitness", activityName: "Sports", note: "Pickup basketball" },
  { startHHMM: "12:00", endHHMM: "13:00", categoryName: "Social", activityName: "Friends", note: "Brunch with crew" },
  { startHHMM: "13:00", endHHMM: "14:00", categoryName: "Meals", activityName: "Lunch" },
  { startHHMM: "14:00", endHHMM: "15:30", categoryName: "Learning", activityName: "Reading" },
  { startHHMM: "15:30", endHHMM: "17:00", categoryName: "Chores", activityName: "Cleaning" },
  { startHHMM: "17:00", endHHMM: "18:30", categoryName: "Social", activityName: "Family", note: "Call home" },
  { startHHMM: "18:30", endHHMM: "19:30", categoryName: "Meals", activityName: "Cooking" },
  { startHHMM: "19:30", endHHMM: "20:30", categoryName: "Meals", activityName: "Dinner" },
  { startHHMM: "20:30", endHHMM: "22:30", categoryName: "Entertainment", activityName: "Gaming" },
  { startHHMM: "22:30", endHHMM: "23:15", categoryName: "Learning", activityName: "Reading" },
];

/**
 * Night Sleep crosses midnight: starts on day D at SLEEP_START_HHMM,
 * ends on day D+1 at SLEEP_END_HHMM. ~7h30 average — intentionally
 * below the 8h at_least goal so Sleep shows as failing in Insights.
 */
const SLEEP_START_HHMM = "23:00";
const SLEEP_END_HHMM = "06:30";

type GoalSpec = {
  categoryName: string;
  targetMinutesPerDay: number;
  goalDirection: "at_most" | "at_least" | "around";
};

/**
 * Targets calibrated against the schedules above:
 * - Work at_most 480: weekdays seed 420min → passes; weekends 0 → passes.
 * - Health at_least 60: weekdays 75, weekends 90 → passes.
 * - Learning at_least 45: weekdays 90, weekends 135 → passes.
 * - Sleep at_least 480: seeded ~450 (7h30) → fails. Intentional, so
 *   Insights shows at least one red goal in the screenshots.
 */
const GOALS: GoalSpec[] = [
  { categoryName: "Work", targetMinutesPerDay: 480, goalDirection: "at_most" },
  { categoryName: "Health & Fitness", targetMinutesPerDay: 60, goalDirection: "at_least" },
  { categoryName: "Learning", targetMinutesPerDay: 45, goalDirection: "at_least" },
  { categoryName: "Sleep", targetMinutesPerDay: 480, goalDirection: "at_least" },
];

/** The currently-running entry. Starts this many minutes before now. */
const RUNNING_ENTRY = {
  categoryName: "Personal Care",
  activityName: "Journaling",
  minutesAgo: 25,
  note: "Daily reflection",
};

const SEED_DAYS = 21;
const BOUNDARY_JITTER_MINUTES = 8;
const RUNNING_BUFFER_MINUTES = 30;

type CategoryRow = { id: string; name: string };
type ActivityRow = { id: string; category_id: string; name: string };

export type SeedDemoResult = {
  insertedEntries: number;
  goalsSet: number;
  running: boolean;
  scheduleStartDate: string;
  scheduleEndDate: string;
  daysSeeded: number;
  missingCategoryNames: string[];
};

/** Random integer in [-range, +range]. */
function jitter(range: number): number {
  return Math.floor(Math.random() * (2 * range + 1)) - range;
}

/** Returns YYYY-MM-DD for a date offset (in days) from `baseDate` in `tz`. */
function offsetLocalDate(baseDate: string, daysOffset: number, tz: string): string {
  const ms = getStartOfDay(baseDate, tz).getTime() + daysOffset * 24 * 60 * 60 * 1000;
  return new Date(ms).toLocaleDateString("en-CA", { timeZone: tz });
}

/** True for Saturday or Sunday in the given timezone. */
function isWeekend(dateStr: string, tz: string): boolean {
  const weekday = new Date(getStartOfDay(dateStr, tz)).toLocaleDateString("en-US", {
    timeZone: tz,
    weekday: "short",
  });
  return weekday === "Sat" || weekday === "Sun";
}

/**
 * Hard-delete the last 22 days of entries (extra day to catch any
 * cross-midnight sleep from the day before the seed window), then
 * insert 21 days of schedule + sleep, plus today's running entry and
 * 4 daily goals.
 */
export async function seedDemoDay(): Promise<SeedDemoResult> {
  const tz = getCurrentTimezone();
  const today = getTodayDate(tz);
  const oldestDay = offsetLocalDate(today, -(SEED_DAYS - 1), tz);
  const wipeStartDay = offsetLocalDate(today, -SEED_DAYS, tz);
  const wipeStart = getStartOfDay(wipeStartDay, tz).toISOString();
  const todayStart = getStartOfDay(today, tz).toISOString();
  const todayEnd = getEndOfDay(today, tz).toISOString();
  const now = new Date();
  const runningCutoff = new Date(
    now.getTime() - RUNNING_BUFFER_MINUTES * 60 * 1000,
  );
  const source = assertTimeEntrySource(TIME_ENTRY_SOURCES.import);

  const categories = await db.getAll<CategoryRow>(
    `SELECT id, name FROM categories
     WHERE deleted_at IS NULL AND is_archived = 0`,
  );
  const activities = await db.getAll<ActivityRow>(
    `SELECT id, category_id, name FROM activities
     WHERE deleted_at IS NULL AND is_archived = 0`,
  );

  const catByName = new Map(categories.map((c) => [c.name, c.id]));
  const actByCatAndName = new Map(
    activities.map((a) => [`${a.category_id}::${a.name}`, a.id]),
  );

  const missing = new Set<string>();
  const resolve = (
    categoryName: string,
    activityName: string,
  ): { categoryId: string; activityId: string } | null => {
    const categoryId = catByName.get(categoryName);
    if (!categoryId) {
      missing.add(categoryName);
      return null;
    }
    const activityId = actByCatAndName.get(`${categoryId}::${activityName}`);
    if (!activityId) {
      missing.add(`${categoryName} › ${activityName}`);
      return null;
    }
    return { categoryId, activityId };
  };

  const tsNow = nowUTC();
  let insertedEntries = 0;
  let runningInserted = false;

  await db.writeTransaction(async (tx) => {
    // Wipe any entry overlapping the seed window. Hard delete is
    // intentional — this module is debug-only and never synced. Also
    // clear entry_tags for wiped entries plus cached daily_summaries
    // so the Insights tab recomputes cleanly.
    const wipedEntryIds = await tx.getAll<{ id: string }>(
      `SELECT id FROM time_entries
       WHERE started_at <= ?
         AND (ended_at IS NULL OR ended_at >= ?)`,
      [todayEnd, wipeStart],
    );
    for (const row of wipedEntryIds) {
      await tx.execute("DELETE FROM entry_tags WHERE entry_id = ?", [row.id]);
    }
    await tx.execute(
      `DELETE FROM time_entries
       WHERE started_at <= ?
         AND (ended_at IS NULL OR ended_at >= ?)`,
      [todayEnd, wipeStart],
    );
    await tx.execute(
      `DELETE FROM daily_summaries WHERE date >= ? AND date <= ?`,
      [wipeStartDay, today],
    );

    // Daytime schedule for each of the last 21 days. For today, only
    // insert entries whose jittered end is before (now − 30 min) so
    // the running entry remains plausible.
    for (let dayOffset = -(SEED_DAYS - 1); dayOffset <= 0; dayOffset += 1) {
      const dayStr = offsetLocalDate(today, dayOffset, tz);
      const schedule = isWeekend(dayStr, tz) ? WEEKEND_SCHEDULE : WEEKDAY_SCHEDULE;
      const isToday = dayOffset === 0;

      // One jitter offset per unique boundary time string. Because
      // adjacent items share boundaries (end of i == start of i+1),
      // sharing the jitter keeps them butted together with no
      // overlap or gap.
      const boundaryJitter = new Map<string, number>();
      const jitterFor = (hhmm: string): number => {
        const cached = boundaryJitter.get(hhmm);
        if (cached !== undefined) return cached;
        const v = jitter(BOUNDARY_JITTER_MINUTES);
        boundaryJitter.set(hhmm, v);
        return v;
      };

      for (const item of schedule) {
        const ids = resolve(item.categoryName, item.activityName);
        if (!ids) continue;
        const start = new Date(
          parseLocalTimeOfDay(item.startHHMM, dayStr, tz).getTime() +
            jitterFor(item.startHHMM) * 60 * 1000,
        );
        const end = new Date(
          parseLocalTimeOfDay(item.endHHMM, dayStr, tz).getTime() +
            jitterFor(item.endHHMM) * 60 * 1000,
        );
        if (end.getTime() <= start.getTime()) continue;
        if (isToday && end.getTime() > runningCutoff.getTime()) continue;

        const durationSeconds = Math.round(
          (end.getTime() - start.getTime()) / 1000,
        );
        await tx.execute(
          `INSERT INTO time_entries
             (id, user_id, activity_id, started_at, ended_at, duration_seconds,
              timezone, note, source, created_at, updated_at)
           VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            generateId(),
            ids.activityId,
            start.toISOString(),
            end.toISOString(),
            durationSeconds,
            tz,
            item.note ?? null,
            source,
            tsNow,
            tsNow,
          ],
        );
        insertedEntries += 1;
      }
    }

    // Night Sleep entries — one per night for each of the last 21
    // days. A "night D" entry starts on day D at SLEEP_START_HHMM
    // and ends on day D+1 at SLEEP_END_HHMM, crossing midnight. The
    // most recent one (last night) ends this morning; we don't seed
    // tonight's sleep since it's in the future.
    const sleepIds = resolve("Sleep", "Night Sleep");
    if (sleepIds) {
      for (let dayOffset = -(SEED_DAYS - 1); dayOffset <= -1; dayOffset += 1) {
        const startDayStr = offsetLocalDate(today, dayOffset, tz);
        const endDayStr = offsetLocalDate(today, dayOffset + 1, tz);
        const startJitter = jitter(BOUNDARY_JITTER_MINUTES);
        const endJitter = jitter(BOUNDARY_JITTER_MINUTES);
        const start = new Date(
          parseLocalTimeOfDay(SLEEP_START_HHMM, startDayStr, tz).getTime() +
            startJitter * 60 * 1000,
        );
        const end = new Date(
          parseLocalTimeOfDay(SLEEP_END_HHMM, endDayStr, tz).getTime() +
            endJitter * 60 * 1000,
        );
        // Skip if this sleep window extends past the running cutoff
        // on today — i.e. last night's sleep ending in the future.
        // (It shouldn't given a 06:30 end, but guard anyway.)
        if (end.getTime() > runningCutoff.getTime()) continue;
        const durationSeconds = Math.round(
          (end.getTime() - start.getTime()) / 1000,
        );
        await tx.execute(
          `INSERT INTO time_entries
             (id, user_id, activity_id, started_at, ended_at, duration_seconds,
              timezone, note, source, created_at, updated_at)
           VALUES (?, NULL, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
          [
            generateId(),
            sleepIds.activityId,
            start.toISOString(),
            end.toISOString(),
            durationSeconds,
            tz,
            source,
            tsNow,
            tsNow,
          ],
        );
        insertedEntries += 1;
      }
    }

    // Running entry on TODAY — starts `minutesAgo` ago. Only insert
    // if its start falls within today's local window (so a 25-min
    // entry seeded just after local midnight doesn't backdate into
    // yesterday's screenshot data).
    const runStart = new Date(
      now.getTime() - RUNNING_ENTRY.minutesAgo * 60 * 1000,
    );
    const runStartIso = runStart.toISOString();
    if (runStartIso >= todayStart) {
      const ids = resolve(
        RUNNING_ENTRY.categoryName,
        RUNNING_ENTRY.activityName,
      );
      if (ids) {
        await tx.execute(
          `INSERT INTO time_entries
             (id, user_id, activity_id, started_at, ended_at, duration_seconds,
              timezone, note, source, created_at, updated_at)
           VALUES (?, NULL, ?, ?, NULL, NULL, ?, ?, ?, ?, ?)`,
          [
            generateId(),
            ids.activityId,
            runStartIso,
            tz,
            RUNNING_ENTRY.note ?? null,
            source,
            tsNow,
            tsNow,
          ],
        );
        runningInserted = true;
      }
    }
  });

  // Goals — upsert. Each (category, day_of_week = NULL, period_kind = 'daily')
  // is unique; replace any existing row for the same triple so re-running
  // the seed leaves a single clean copy.
  let goalsSet = 0;
  for (const goal of GOALS) {
    const categoryId = catByName.get(goal.categoryName);
    if (!categoryId) {
      missing.add(goal.categoryName);
      continue;
    }
    const tsGoal = nowUTC();
    const existing = await db.getOptional<{ id: string }>(
      `SELECT id FROM ideal_allocations
       WHERE category_id = ?
         AND day_of_week IS NULL
         AND period_kind = 'daily'
         AND deleted_at IS NULL`,
      [categoryId],
    );
    if (existing) {
      await db.execute(
        `UPDATE ideal_allocations
         SET target_minutes_per_day = ?, goal_direction = ?, period_kind = 'daily', updated_at = ?
         WHERE id = ?`,
        [goal.targetMinutesPerDay, goal.goalDirection, tsGoal, existing.id],
      );
    } else {
      await db.execute(
        `INSERT INTO ideal_allocations
           (id, user_id, category_id, day_of_week, target_minutes_per_day,
            goal_direction, period_kind, created_at, updated_at)
         VALUES (?, NULL, ?, NULL, ?, ?, 'daily', ?, ?)`,
        [
          generateId(),
          categoryId,
          goal.targetMinutesPerDay,
          goal.goalDirection,
          tsGoal,
          tsGoal,
        ],
      );
    }
    goalsSet += 1;
  }

  return {
    insertedEntries,
    goalsSet,
    running: runningInserted,
    scheduleStartDate: oldestDay,
    scheduleEndDate: today,
    daysSeeded: SEED_DAYS,
    missingCategoryNames: Array.from(missing),
  };
}
