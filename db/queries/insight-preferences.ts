import { db } from "@/lib/powersync";
import { generateId } from "@/lib/uuid";
import type { InsightPreferencesRecord } from "../schema";
import { nowUTC } from "./_helpers";
import type { InsightsPeriod } from "./user-preferences";

/**
 * Closed set of card ids the Insights tab can render. New cards must be added
 * here so reorder/hide state can reference them. Ids are stored verbatim in
 * the `*_order` / `*_hidden` JSON columns, so renaming is a migration.
 */
export const INSIGHT_CARD_IDS = [
  "day-rhythm-strip",
  "category-breakdown",
  "actual-vs-ideal",
  "activity-breakdown",
  "tracking-coverage",
  "day-of-week-bars",
  "week-over-week",
  "calendar-heatmap",
  "four-week-trend",
  "top-activities",
  "weekly-streak",
] as const;

export type InsightCardId = (typeof INSIGHT_CARD_IDS)[number];

// Block 1 keeps the *current* per-view order so nothing visibly moves.
// Block 8 will replace these with the redesign defaults.
export const DEFAULT_DAILY_ORDER: InsightCardId[] = [
  "day-rhythm-strip",
  "category-breakdown",
  "actual-vs-ideal",
  "activity-breakdown",
  "tracking-coverage",
];

export const DEFAULT_WEEKLY_ORDER: InsightCardId[] = [
  "weekly-streak",
  "day-of-week-bars",
  "week-over-week",
  "category-breakdown",
  "actual-vs-ideal",
  "activity-breakdown",
  "tracking-coverage",
];

export const DEFAULT_MONTHLY_ORDER: InsightCardId[] = [
  "calendar-heatmap",
  "category-breakdown",
  "actual-vs-ideal",
  "activity-breakdown",
  "four-week-trend",
  "top-activities",
  "tracking-coverage",
];

export const DEFAULT_ORDERS: Record<InsightsPeriod, InsightCardId[]> = {
  daily: DEFAULT_DAILY_ORDER,
  weekly: DEFAULT_WEEKLY_ORDER,
  monthly: DEFAULT_MONTHLY_ORDER,
};

export const INSIGHT_PREFERENCES_QUERY = `
  SELECT id, user_id,
         daily_order, weekly_order, monthly_order,
         daily_hidden, weekly_hidden, monthly_hidden,
         created_at, updated_at, deleted_at
  FROM insight_preferences
  WHERE deleted_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1
`;

export async function getInsightPreferences(): Promise<InsightPreferencesRecord | null> {
  return db.getOptional<InsightPreferencesRecord>(INSIGHT_PREFERENCES_QUERY);
}

function orderColumn(period: InsightsPeriod): string {
  return `${period}_order`;
}

function hiddenColumn(period: InsightsPeriod): string {
  return `${period}_hidden`;
}

async function ensureRow(): Promise<InsightPreferencesRecord> {
  const existing = await getInsightPreferences();
  if (existing) return existing;
  const now = nowUTC();
  const id = generateId();
  await db.execute(
    `INSERT INTO insight_preferences
       (id, user_id,
        daily_order, weekly_order, monthly_order,
        daily_hidden, weekly_hidden, monthly_hidden,
        created_at, updated_at)
     VALUES (?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, ?, ?)`,
    [id, now, now],
  );
  const row = await getInsightPreferences();
  if (!row) throw new Error("Failed to create insight_preferences row");
  return row;
}

/** Persist a new ordering for a period. The full ordered id list is replaced. */
export async function updateOrder(
  period: InsightsPeriod,
  cardIds: InsightCardId[],
): Promise<void> {
  await ensureRow();
  const now = nowUTC();
  await db.execute(
    `UPDATE insight_preferences
       SET ${orderColumn(period)} = ?, updated_at = ?
     WHERE deleted_at IS NULL`,
    [JSON.stringify(cardIds), now],
  );
}

/** Toggle a card's hidden state for a single period. */
export async function toggleHidden(
  period: InsightsPeriod,
  cardId: InsightCardId,
): Promise<void> {
  const row = await ensureRow();
  const col = hiddenColumn(period);
  const raw = (row as unknown as Record<string, string | null>)[col] ?? null;
  const current = parseIdList(raw);
  const next = current.includes(cardId)
    ? current.filter((id) => id !== cardId)
    : [...current, cardId];
  const now = nowUTC();
  await db.execute(
    `UPDATE insight_preferences
       SET ${col} = ?, updated_at = ?
     WHERE deleted_at IS NULL`,
    [JSON.stringify(next), now],
  );
}

/**
 * Parse a JSON-encoded id list, dropping unknown ids so a card removed in
 * code doesn't poison the saved order forever.
 */
export function parseIdList(raw: string | null | undefined): InsightCardId[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const known = new Set<string>(INSIGHT_CARD_IDS);
    return parsed.filter(
      (v): v is InsightCardId => typeof v === "string" && known.has(v),
    );
  } catch {
    return [];
  }
}
