import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@powersync/react';

/** How recent (ms) a stopped entry must be to be considered resumable. */
const RESUMABLE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Most-recently-stopped entry, exposed only when no timer is currently
 * running and the stop happened within {@link RESUMABLE_WINDOW_MS}.
 *
 * Backed by a single SQL query that returns at most one row — the latest
 * candidate. The window check happens in JS so the cutoff isn't baked into
 * the SQL string (which would never re-evaluate on its own).
 */
const RESUMABLE_QUERY = `
  WITH running AS (
    SELECT 1 FROM time_entries
    WHERE ended_at IS NULL AND deleted_at IS NULL
    LIMIT 1
  )
  SELECT
    te.id          AS entry_id,
    te.activity_id AS activity_id,
    te.ended_at    AS ended_at,
    a.name         AS activity_name,
    c.name         AS category_name,
    c.color        AS category_color
  FROM time_entries te
  JOIN activities a ON a.id = te.activity_id
  JOIN categories c ON c.id = a.category_id
  WHERE te.deleted_at IS NULL
    AND te.ended_at IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM running)
  ORDER BY te.ended_at DESC
  LIMIT 1
`;

interface ResumableRow {
  entry_id: string;
  activity_id: string;
  ended_at: string;
  activity_name: string;
  category_name: string;
  category_color: string;
}

export interface ResumableEntry {
  entryId: string;
  activityId: string;
  activityName: string;
  categoryName: string;
  categoryColor: string;
  endedAt: Date;
}

export function useResumableEntry(): ResumableEntry | null {
  const { data } = useQuery<ResumableRow>(RESUMABLE_QUERY);
  const row = data.length > 0 ? data[0] : null;
  const [, forceTick] = useState(0);

  // Schedule a re-render when the window expires so the banner disappears
  // even if the user sits idle and nothing else triggers a render.
  useEffect(() => {
    if (!row) return;
    const remaining = RESUMABLE_WINDOW_MS - (Date.now() - new Date(row.ended_at).getTime());
    if (remaining <= 0) return;
    const handle = setTimeout(() => forceTick((n) => n + 1), remaining);
    return () => clearTimeout(handle);
  }, [row]);

  return useMemo(() => {
    if (!row) return null;
    const endedAt = new Date(row.ended_at);
    if (Date.now() - endedAt.getTime() > RESUMABLE_WINDOW_MS) return null;
    return {
      entryId: row.entry_id,
      activityId: row.activity_id,
      activityName: row.activity_name,
      categoryName: row.category_name,
      categoryColor: row.category_color,
      endedAt,
    };
  }, [row]);
}
