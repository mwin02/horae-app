import { useMemo } from "react";
import { useQuery } from "@powersync/react";
import {
  DEFAULT_ORDERS,
  INSIGHT_PREFERENCES_QUERY,
  parseIdList,
  type InsightCardId,
} from "@/db/queries/insight-preferences";
import type { InsightsPeriod } from "@/db/queries/user-preferences";

interface FlatRow {
  id: string;
  daily_order: string | null;
  weekly_order: string | null;
  monthly_order: string | null;
  daily_hidden: string | null;
  weekly_hidden: string | null;
  monthly_hidden: string | null;
}

export interface InsightPreferences {
  orders: Record<InsightsPeriod, InsightCardId[]>;
  hidden: Record<InsightsPeriod, Set<InsightCardId>>;
}

export interface UseInsightPreferencesResult {
  preferences: InsightPreferences;
  isLoading: boolean;
}

/**
 * Reactive read of the singleton insight_preferences row. NULL columns and
 * missing rows fall back to DEFAULT_ORDERS — callers never branch on absence.
 */
export function useInsightPreferences(): UseInsightPreferencesResult {
  const { data, isLoading } = useQuery<FlatRow>(INSIGHT_PREFERENCES_QUERY);

  const preferences = useMemo<InsightPreferences>(() => {
    const row = data[0];
    const orderFor = (period: InsightsPeriod, raw: string | null | undefined) => {
      const parsed = parseIdList(raw ?? null);
      return parsed.length > 0 ? parsed : DEFAULT_ORDERS[period];
    };
    const hiddenFor = (raw: string | null | undefined) =>
      new Set<InsightCardId>(parseIdList(raw ?? null));
    return {
      orders: {
        daily: orderFor("daily", row?.daily_order),
        weekly: orderFor("weekly", row?.weekly_order),
        monthly: orderFor("monthly", row?.monthly_order),
      },
      hidden: {
        daily: hiddenFor(row?.daily_hidden),
        weekly: hiddenFor(row?.weekly_hidden),
        monthly: hiddenFor(row?.monthly_hidden),
      },
    };
  }, [data]);

  return { preferences, isLoading };
}
