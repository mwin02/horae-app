import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import type { Transaction } from "@powersync/react-native";

import { db } from "@/lib/powersync";
import { cancelAllAppNotifications } from "@/lib/notifications";
import {
  seedNotificationPreferencesIfNeeded,
  seedUserPreferencesIfNeeded,
} from "@/db/seed";
import { nowUTC } from "@/db/queries/_helpers";
import { wipeAllInsideTx } from "@/db/queries/data-management";
import { EXPORT_SCHEMA_VERSION } from "@/lib/export-json";

/**
 * JSON-import counterpart to `lib/export-json.ts`. Takes a file produced by
 * that exporter and writes its rows back into the local PowerSync DB.
 *
 * Two modes:
 *   - "replace": wipe everything, then load the file as the new truth.
 *   - "merge":   additive INSERT OR IGNORE on the file's rows, preserving
 *                anything already on the device on id collisions.
 *
 * Singleton preference rows (notification/user/insight) are restored only
 * in replace mode; in merge mode the device's current prefs always win.
 */

export type ImportMode = "replace" | "merge";

export type ImportTableName =
  | "categories"
  | "activities"
  | "time_entries"
  | "ideal_allocations"
  | "tags"
  | "entry_tags"
  | "notification_preferences"
  | "user_preferences"
  | "insight_preferences";

const TABLES_ORDER: ImportTableName[] = [
  // Insert parents before children so that even with future FK constraints
  // (Phase 3) the order stays valid.
  "categories",
  "activities",
  "tags",
  "time_entries",
  "entry_tags",
  "ideal_allocations",
  "notification_preferences",
  "user_preferences",
  "insight_preferences",
];

const SINGLETON_PREF_TABLES = new Set<ImportTableName>([
  "notification_preferences",
  "user_preferences",
  "insight_preferences",
]);

type Row = Record<string, unknown>;

interface ImportPayload {
  schema_version: number;
  tables: Partial<Record<ImportTableName, Row[]>>;
}

export interface ImportSummary {
  mode: ImportMode;
  inserted: Record<ImportTableName, number>;
  skipped: Record<ImportTableName, number>;
}

/**
 * Friendly errors the UI can show as-is — never expose raw stack traces or
 * SQL errors to users.
 */
export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportError";
  }
}

function emptyCounts(): Record<ImportTableName, number> {
  return {
    categories: 0,
    activities: 0,
    time_entries: 0,
    ideal_allocations: 0,
    tags: 0,
    entry_tags: 0,
    notification_preferences: 0,
    user_preferences: 0,
    insight_preferences: 0,
  };
}

function parseAndValidate(text: string): ImportPayload {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ImportError(
      "That file isn't valid JSON. Pick a backup file exported from Horae.",
    );
  }

  if (!raw || typeof raw !== "object") {
    throw new ImportError("That doesn't look like a Horae backup file.");
  }

  const obj = raw as Record<string, unknown>;
  if (obj.schema_version !== EXPORT_SCHEMA_VERSION) {
    throw new ImportError(
      `This backup was made with a different version of Horae (format v${String(
        obj.schema_version,
      )}). Update the app and try again.`,
    );
  }

  const tables = obj.tables;
  if (!tables || typeof tables !== "object") {
    throw new ImportError("That backup file is missing its data tables.");
  }

  const tablesRecord = tables as Record<string, unknown>;
  const cleaned: Partial<Record<ImportTableName, Row[]>> = {};
  for (const name of TABLES_ORDER) {
    const value = tablesRecord[name];
    if (value === undefined) continue;
    if (!Array.isArray(value)) {
      throw new ImportError(
        `That backup file is malformed (table "${name}" should be a list).`,
      );
    }
    cleaned[name] = value as Row[];
  }

  return { schema_version: EXPORT_SCHEMA_VERSION, tables: cleaned };
}

/** Builds a plain `INSERT INTO <table> (...) VALUES (?, ?, ...)`. We decide
 *  whether to insert vs skip via an explicit pre-SELECT, so OR IGNORE is
 *  unnecessary — and `rowsAffected` can't be trusted on PowerSync's
 *  JSON-view-backed tables anyway (see insertRows). */
function buildInsertSql(table: ImportTableName, columns: string[]): string {
  const cols = columns.map((c) => `"${c}"`).join(", ");
  const placeholders = columns.map(() => "?").join(", ");
  return `INSERT INTO ${table} (${cols}) VALUES (${placeholders})`;
}

/**
 * Inserts every row of `rows` into `table`, deciding per row via an explicit
 * pre-SELECT (not via `rowsAffected`):
 *
 *   1. No local row with this id              → INSERT (counted as inserted).
 *   2. Local row exists and is alive          → skip per merge-mode policy
 *                                                ("keep what's on device").
 *   3. Local row exists but is soft-deleted   → resurrect by overwriting it
 *      (tombstone, deleted_at IS NOT NULL)      with the imported values
 *                                                (counted as inserted).
 *
 * Why a pre-SELECT instead of `INSERT OR IGNORE` + checking `rowsAffected`:
 * PowerSync's client tables are JSON-backed views with INSTEAD OF triggers,
 * and its DBAdapter docs explicitly warn that `rowsAffected` may be `0` even
 * on successful writes. Counting via `rowsAffected` was producing summaries
 * that said "nothing was added" after a real restore.
 *
 * Case 3 also fixes the "deleted then re-imported" scenario: without it,
 * tombstones from `wipeAllInsideTx` / `deleteAllTimeEntries` would silently
 * block re-import in merge mode.
 *
 * Tables without a `deleted_at` column (e.g. `entry_tags`) collapse cases
 * 2 and 3 into "row exists → skip" since no tombstone is possible.
 *
 * Resurrections are folded into the `inserted` count so the user-facing
 * summary stays simple — "Added N items" reads better than exposing the
 * soft-delete machinery.
 */
async function insertRows(
  tx: Transaction,
  table: ImportTableName,
  rows: Row[],
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const columns = Object.keys(row);
    if (columns.length === 0) {
      skipped += 1;
      continue;
    }

    const id = typeof row.id === "string" ? row.id : null;
    const hasSoftDelete = columns.includes("deleted_at");

    if (id) {
      const existing = hasSoftDelete
        ? await tx.getOptional<{ deleted_at: string | null }>(
            `SELECT deleted_at FROM ${table} WHERE id = ?`,
            [id],
          )
        : await tx.getOptional<{ id: string }>(
            `SELECT id FROM ${table} WHERE id = ?`,
            [id],
          );

      if (existing) {
        if (!hasSoftDelete || (existing as { deleted_at: string | null }).deleted_at === null) {
          // Alive collision (or table can't tombstone) — keep the device's row.
          skipped += 1;
          continue;
        }
        // Tombstone — resurrect by overwriting every column from the file.
        // The imported `deleted_at` is NULL (exporter filters by liveness),
        // so this also clears the tombstone implicitly.
        const setCols = columns.filter((c) => c !== "id");
        const setClause = setCols.map((c) => `"${c}" = ?`).join(", ");
        const updateValues = setCols.map((c) => row[c] as unknown);
        await tx.execute(
          `UPDATE ${table} SET ${setClause} WHERE id = ?`,
          [...updateValues, id] as never[],
        );
        inserted += 1;
        continue;
      }
    }

    // No existing row: plain INSERT. Pre-check above guarantees no UNIQUE
    // conflict on `id`, so we don't need OR IGNORE and don't have to
    // inspect `rowsAffected` (which is unreliable on PowerSync views).
    const values = columns.map((c) => row[c] as unknown);
    const sql = buildInsertSql(table, columns);
    await tx.execute(sql, values as never[]);
    inserted += 1;
  }

  return { inserted, skipped };
}

async function runReplace(
  tx: Transaction,
  payload: ImportPayload,
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    mode: "replace",
    inserted: emptyCounts(),
    skipped: emptyCounts(),
  };

  await wipeAllInsideTx(tx, nowUTC());

  for (const table of TABLES_ORDER) {
    const rows = payload.tables[table];
    if (!rows || rows.length === 0) continue;
    const { inserted, skipped } = await insertRows(tx, table, rows);
    summary.inserted[table] = inserted;
    summary.skipped[table] = skipped;
  }

  return summary;
}

async function runMerge(
  tx: Transaction,
  payload: ImportPayload,
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    mode: "merge",
    inserted: emptyCounts(),
    skipped: emptyCounts(),
  };

  for (const table of TABLES_ORDER) {
    if (SINGLETON_PREF_TABLES.has(table)) {
      // Per design: merge mode never overwrites local preferences.
      const rows = payload.tables[table];
      summary.skipped[table] = rows?.length ?? 0;
      continue;
    }
    const rows = payload.tables[table];
    if (!rows || rows.length === 0) continue;
    const { inserted, skipped } = await insertRows(tx, table, rows);
    summary.inserted[table] = inserted;
    summary.skipped[table] = skipped;
  }

  return summary;
}

/**
 * Presents the document picker, reads the JSON file, validates it, and
 * runs the import in a single write transaction. Returns null when the
 * user cancels the picker. Throws `ImportError` for friendly failures.
 */
export async function pickAndImportJson(
  mode: ImportMode,
): Promise<ImportSummary | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (picked.canceled) return null;
  const asset = picked.assets?.[0];
  if (!asset?.uri) {
    throw new ImportError("Couldn't read the selected file.");
  }

  let text: string;
  try {
    text = await new File(asset.uri).text();
  } catch {
    throw new ImportError("Couldn't open the selected file.");
  }

  const payload = parseAndValidate(text);

  let summary: ImportSummary | null = null;
  await db.writeTransaction(async (tx) => {
    summary = mode === "replace"
      ? await runReplace(tx, payload)
      : await runMerge(tx, payload);
  });

  if (mode === "replace") {
    // Replace mode wiped everything — clear stale scheduled notifications
    // exactly like `deleteAllUserData` does. The reactive scheduler will
    // reschedule on the next running entry.
    await cancelAllAppNotifications();
    // If the file lacked singleton pref rows (older partial export), make
    // sure the singletons exist so the rest of the app doesn't see NULLs.
    if ((payload.tables.notification_preferences?.length ?? 0) === 0) {
      await seedNotificationPreferencesIfNeeded();
    }
    if ((payload.tables.user_preferences?.length ?? 0) === 0) {
      await seedUserPreferencesIfNeeded();
    }
  }

  return summary;
}
