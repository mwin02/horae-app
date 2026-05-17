/**
 * Dev-only seeder for App Store screenshots / demo recordings.
 *
 * Populates YESTERDAY with a believable 14-entry timeline from 06:30
 * through 20:30, sets 4 goals on common categories, and leaves one
 * entry currently running on TODAY (started 25 min ago).
 *
 * Why yesterday for the schedule: if we seeded today and ran the
 * function at 9 AM, only 2–3 entries (those that end before now − 30
 * min) would land, and the Timeline / Insights screenshots would look
 * empty. Yesterday is fully in the past regardless of run time, so the
 * full schedule always lands.
 *
 * Why today for the running entry: a "running since yesterday" entry
 * would show 12+ hours elapsed in the Home UI, which looks broken.
 *
 * Idempotent — wipes both yesterday's and today's existing entries
 * first. Tied behind EXPO_PUBLIC_ENABLE_DEBUG=1 via Settings → Debug.
 * Never callable in production builds.
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
 * Fixed local-time schedule that fills a "typical" day. Seeded onto
 * yesterday, so every entry lands regardless of when this is run.
 */
const SCHEDULE: SeedScheduleItem[] = [
  {
    startHHMM: "06:30",
    endHHMM: "07:00",
    categoryName: "Personal Care",
    activityName: "Meditation",
    note: "Box breathing, 4-4-4",
  },
  {
    startHHMM: "07:00",
    endHHMM: "07:45",
    categoryName: "Health & Fitness",
    activityName: "Exercise",
    note: "Morning run · 5K easy pace",
  },
  {
    startHHMM: "07:45",
    endHHMM: "08:15",
    categoryName: "Meals",
    activityName: "Breakfast",
  },
  {
    startHHMM: "08:15",
    endHHMM: "09:00",
    categoryName: "Personal Care",
    activityName: "Hygiene",
  },
  {
    startHHMM: "09:00",
    endHHMM: "11:15",
    categoryName: "Work",
    activityName: "Deep Work",
    note: "Drafting feature spec · timeline rework",
  },
  {
    startHHMM: "11:15",
    endHHMM: "11:45",
    categoryName: "Work",
    activityName: "Email",
  },
  {
    startHHMM: "11:45",
    endHHMM: "12:30",
    categoryName: "Meals",
    activityName: "Lunch",
  },
  {
    startHHMM: "12:30",
    endHHMM: "13:00",
    categoryName: "Health & Fitness",
    activityName: "Walking",
    note: "Loop around the park",
  },
  {
    startHHMM: "13:00",
    endHHMM: "15:00",
    categoryName: "Work",
    activityName: "Deep Work",
    note: "Implementation: clustering logic",
  },
  {
    startHHMM: "15:00",
    endHHMM: "16:00",
    categoryName: "Work",
    activityName: "Meetings",
    note: "Weekly sync",
  },
  {
    startHHMM: "16:00",
    endHHMM: "17:30",
    categoryName: "Work",
    activityName: "Admin",
  },
  {
    startHHMM: "17:30",
    endHHMM: "18:15",
    categoryName: "Meals",
    activityName: "Cooking",
  },
  {
    startHHMM: "18:15",
    endHHMM: "19:00",
    categoryName: "Meals",
    activityName: "Dinner",
  },
  {
    startHHMM: "19:00",
    endHHMM: "20:30",
    categoryName: "Learning",
    activityName: "Reading",
    note: "Building a Second Brain · ch. 4",
  },
];

type GoalSpec = {
  categoryName: string;
  targetMinutesPerDay: number;
  goalDirection: "at_most" | "at_least" | "around";
};

const GOALS: GoalSpec[] = [
  { categoryName: "Work", targetMinutesPerDay: 480, goalDirection: "at_most" },
  {
    categoryName: "Health & Fitness",
    targetMinutesPerDay: 60,
    goalDirection: "at_least",
  },
  {
    categoryName: "Learning",
    targetMinutesPerDay: 45,
    goalDirection: "at_least",
  },
  { categoryName: "Sleep", targetMinutesPerDay: 480, goalDirection: "at_least" },
];

/** The currently-running entry. Starts this many minutes before now. */
const RUNNING_ENTRY = {
  categoryName: "Personal Care",
  activityName: "Journaling",
  minutesAgo: 25,
  note: "Daily reflection",
};

type CategoryRow = { id: string; name: string };
type ActivityRow = { id: string; category_id: string; name: string };

export type SeedDemoResult = {
  insertedEntries: number;
  goalsSet: number;
  running: boolean;
  scheduleDate: string;
  missingCategoryNames: string[];
};

/**
 * Hard-delete yesterday's + today's entries and entry_tags, then insert
 * yesterday's full schedule plus today's running entry, plus 4 daily
 * goals. Returns counts so the caller can show a confirmation alert.
 */
export async function seedDemoDay(): Promise<SeedDemoResult> {
  const tz = getCurrentTimezone();
  const today = getTodayDate(tz);
  // Compute the local YYYY-MM-DD for "one day ago" in the user's timezone.
  // Using getStartOfDay(today) − 24h lands midnight-of-yesterday in UTC,
  // and getDateInTimezone gives us its local-date string DST-safely.
  const yesterdayMs = getStartOfDay(today, tz).getTime() - 24 * 60 * 60 * 1000;
  const yesterday = new Date(yesterdayMs).toLocaleDateString("en-CA", {
    timeZone: tz,
  });
  const yesterdayStart = getStartOfDay(yesterday, tz).toISOString();
  const todayStart = getStartOfDay(today, tz).toISOString();
  const todayEnd = getEndOfDay(today, tz).toISOString();
  const now = new Date();
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
    // Wipe yesterday's + today's entries (any entry overlapping either
    // local day window). Hard delete is intentional — this module is
    // debug-only and never synced. Also clear entry_tags for wiped
    // entries plus cached daily_summaries so the Insights tab
    // recomputes cleanly.
    const wipedEntryIds = await tx.getAll<{ id: string }>(
      `SELECT id FROM time_entries
       WHERE started_at <= ?
         AND (ended_at IS NULL OR ended_at >= ?)`,
      [todayEnd, yesterdayStart],
    );
    for (const row of wipedEntryIds) {
      await tx.execute("DELETE FROM entry_tags WHERE entry_id = ?", [row.id]);
    }
    await tx.execute(
      `DELETE FROM time_entries
       WHERE started_at <= ?
         AND (ended_at IS NULL OR ended_at >= ?)`,
      [todayEnd, yesterdayStart],
    );
    await tx.execute(
      "DELETE FROM daily_summaries WHERE date IN (?, ?)",
      [yesterday, today],
    );

    // Insert the full schedule onto YESTERDAY. Yesterday is always
    // fully in the past so no future-end skipping needed — every
    // entry always lands.
    for (const item of SCHEDULE) {
      const start = parseLocalTimeOfDay(item.startHHMM, yesterday, tz);
      const end = parseLocalTimeOfDay(item.endHHMM, yesterday, tz);
      const ids = resolve(item.categoryName, item.activityName);
      if (!ids) continue;
      const durationSeconds = Math.round((end.getTime() - start.getTime()) / 1000);
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

    // Running entry on TODAY — starts `minutesAgo` ago. Only insert if
    // its start falls within today's local window (so a 25-min entry
    // seeded just after local midnight doesn't backdate into
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
    scheduleDate: yesterday,
    missingCategoryNames: Array.from(missing),
  };
}
