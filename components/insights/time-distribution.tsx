import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CategoryIconSwatch } from "./category-icon-swatch";
import type { CategoryInsight } from "@/db/models";
import { COLORS, FONTS, RADIUS, SPACING, TYPOGRAPHY } from "@/constants/theme";

const MINUTES_PER_DAY = 24 * 60;

type Period = "daily" | "weekly" | "monthly";

interface TimeDistributionProps {
  categoryInsights: CategoryInsight[];
  totalTrackedMinutes: number;
  period: Period;
  selectedDate: string;
}

export function TimeDistribution({
  categoryInsights,
  totalTrackedMinutes,
  period,
  selectedDate,
}: TimeDistributionProps): React.ReactElement {
  const [showPercent, setShowPercent] = useState(false);
  const periodTotalMinutes = getPeriodTotalMinutes(period, selectedDate);
  const tracked = Math.min(totalTrackedMinutes, periodTotalMinutes);
  const untracked = Math.max(0, periodTotalMinutes - tracked);
  const periodPct =
    periodTotalMinutes > 0
      ? Math.min(100, Math.round((tracked / periodTotalMinutes) * 100))
      : 0;
  const periodWord =
    period === "daily" ? "day" : period === "weekly" ? "week" : "month";

  const slices = categoryInsights
    .filter((c) => c.actualMinutes > 0)
    .sort((a, b) => b.actualMinutes - a.actualMinutes);

  return (
    <View style={styles.container}>
      <View style={styles.eyebrow}>
        <Text style={styles.eyebrowTitle}>TIME DISTRIBUTION</Text>
        <Text style={styles.eyebrowMeta}>
          {periodPct}% of {periodWord}
        </Text>
      </View>

      <View style={styles.heroRow}>
        <Text style={styles.heroNumber}>
          {formatSmartDuration(tracked, period)}
        </Text>
        <Text style={styles.heroSub}>
          tracked · {formatSmartDuration(untracked, period)} untracked
        </Text>
      </View>

      <View style={styles.barTrack}>
        {slices.map((s) => (
          <View
            key={s.categoryId}
            style={{ flex: s.actualMinutes, backgroundColor: s.categoryColor }}
          />
        ))}
        {untracked > 0 && (
          <View
            style={{ flex: untracked, backgroundColor: COLORS.outlineVariant }}
          />
        )}
      </View>

      <Pressable
        onPress={() => setShowPercent((v) => !v)}
        style={styles.legend}
      >
        {slices.map((s) => {
          const pct =
            tracked > 0 ? Math.round((s.actualMinutes / tracked) * 100) : 0;
          return (
            <View key={s.categoryId} style={styles.legendItem}>
              <CategoryIconSwatch
                icon={s.categoryIcon}
                color={s.categoryColor}
              />
              <Text style={styles.legendName} numberOfLines={1}>
                {s.categoryName}
              </Text>
              <Text style={styles.legendMeta}>
                {showPercent
                  ? `${pct}%`
                  : formatSmartDuration(s.actualMinutes, period)}
              </Text>
            </View>
          );
        })}
      </Pressable>
    </View>
  );
}

/**
 * Daily values fit in "Hh Mm" (max 24h). Weekly drops minutes once ≥10h.
 * Monthly always rounds to whole hours.
 */
function formatSmartDuration(minutes: number, period: Period): string {
  if (minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const dropMinutes =
    period === "monthly" || (period === "weekly" && hours >= 10);
  if (dropMinutes) {
    const rounded = Math.round(minutes / 60);
    return `${rounded}h`;
  }
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function getPeriodTotalMinutes(period: Period, selectedDate: string): number {
  if (period === "daily") return MINUTES_PER_DAY;
  if (period === "weekly") return MINUTES_PER_DAY * 7;
  const [y, m] = selectedDate.split("-").map((n) => parseInt(n, 10));
  if (!y || !m) return MINUTES_PER_DAY * 30;
  const days = new Date(y, m, 0).getDate();
  return MINUTES_PER_DAY * days;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  eyebrowTitle: {
    ...TYPOGRAPHY.labelUppercase,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.3,
    color: COLORS.onSurfaceVariant,
  },
  eyebrowMeta: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.outline,
    fontVariant: ["tabular-nums"],
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  heroNumber: {
    fontFamily: FONTS.manropeBold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: COLORS.onSurface,
    fontVariant: ["tabular-nums"],
  },
  heroSub: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.outline,
  },
  barTrack: {
    flexDirection: "row",
    height: 14,
    borderRadius: 7,
    overflow: "hidden",
    backgroundColor: COLORS.outlineVariant,
    marginBottom: SPACING.md,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  legendItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingVertical: 3,
    paddingRight: SPACING.sm,
  },
  legendName: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.onSurface,
    flex: 1,
    minWidth: 0,
  },
  legendMeta: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.onSurfaceVariant,
    fontVariant: ["tabular-nums"],
  },
});
