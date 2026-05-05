import { COLORS, FONTS, RADIUS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import {
  useWeekOverWeekDelta,
  type WeekOverWeekRow,
} from "@/hooks/useWeekOverWeekDelta";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface WeekOverWeekDeltaProps {
  weekDate: string;
}

const LABEL_COL_WIDTH = 86;
const CHIP_COL_WIDTH = 64;
const COL_GAP = 8;
const NOW_BAR_HEIGHT = 8;
const PREV_BAR_HEIGHT = 4;
const VALUE_COL_WIDTH = 42;

/** Below this we render "0m" rather than a tiny sliver. */
const NEAR_ZERO_SECONDS = 30;

/** At/above this magnitude, drop minutes from the duration label. */
const HOUR_ONLY_THRESHOLD_SECONDS = 10 * 3600;

/** Compact duration: "47h" past 10h, otherwise "Hh Mm" / "Mm". Rounds to nearest. */
function formatCompactDuration(totalSeconds: number): string {
  if (totalSeconds >= HOUR_ONLY_THRESHOLD_SECONDS) {
    return `${Math.round(totalSeconds / 3600)}h`;
  }
  const minutesTotal = Math.round(totalSeconds / 60);
  const hours = Math.floor(minutesTotal / 60);
  const minutes = minutesTotal % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function WeekOverWeekDelta({
  weekDate,
}: WeekOverWeekDeltaProps): React.ReactElement | null {
  const { rows, isLoading } = useWeekOverWeekDelta(weekDate);

  if (isLoading) return null;

  const hasData = rows.some(
    (r) => r.thisWeekSeconds > 0 || r.lastWeekSeconds > 0,
  );

  return (
    <View style={styles.container}>
      <View style={styles.eyebrow}>
        <Text style={styles.eyebrowTitle}>WEEK OVER WEEK</Text>
        {hasData ? (
          <View style={styles.legend}>
            <LegendSwatch color={COLORS.outlineVariant} label="last week" />
          </View>
        ) : null}
      </View>

      {!hasData ? (
        <Text style={styles.emptyText}>
          No tracked time this week or last
        </Text>
      ) : (
        <View>
          {rows.map((row, i) => (
            <DeltaRow
              key={row.categoryId}
              row={row}
              showDivider={i > 0}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ──────────────────────────────────────────────

function LegendSwatch({
  color,
  label,
}: {
  color: string;
  label: string;
}): React.ReactElement {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

// ──────────────────────────────────────────────

interface ChipStyle {
  fg: string;
  bg: string;
  text: string;
}

function resolveChip(row: WeekOverWeekRow): ChipStyle {
  const now = row.thisWeekSeconds;
  const prev = row.lastWeekSeconds;
  const noData = now < NEAR_ZERO_SECONDS && prev < NEAR_ZERO_SECONDS;
  const newWeek = prev < NEAR_ZERO_SECONDS && now >= NEAR_ZERO_SECONDS;
  const dropped = now < NEAR_ZERO_SECONDS && prev >= NEAR_ZERO_SECONDS;

  if (noData) {
    return {
      fg: COLORS.outline,
      bg: COLORS.surfaceContainer,
      text: "—",
    };
  }

  // For at_most goals, more time is bad. Otherwise more is good.
  const moreIsBad = row.goalDirection === "at_most";
  const goodChip = {
    fg: COLORS.secondary,
    bg: COLORS.secondaryContainer,
  };
  const badChip = {
    fg: COLORS.error,
    bg: COLORS.errorContainer,
  };

  if (newWeek) {
    const palette = moreIsBad ? badChip : goodChip;
    return { ...palette, text: "new" };
  }

  if (dropped) {
    // Going to zero is "better" for at_most categories. For at_least and
    // around it's a regression — but we still show muted "0m" because the
    // absent magnitude isn't meaningful as a delta.
    if (moreIsBad) {
      return { ...goodChip, text: "0m" };
    }
    return {
      fg: COLORS.outline,
      bg: COLORS.surfaceContainer,
      text: "0m",
    };
  }

  const delta = now - prev;
  const up = delta > 0;
  const isBad = up ? moreIsBad : !moreIsBad;
  const palette = isBad ? badChip : goodChip;
  const symbol = up ? "+" : "−";
  return {
    ...palette,
    text: `${symbol}${formatCompactDuration(Math.abs(delta))}`,
  };
}

interface DeltaRowProps {
  row: WeekOverWeekRow;
  showDivider: boolean;
}

function DeltaRow({ row, showDivider }: DeltaRowProps): React.ReactElement {
  const chip = resolveChip(row);
  // Scale within the row so within-category comparison stays legible even
  // when other categories dwarf this one.
  const rowMax = Math.max(row.thisWeekSeconds, row.lastWeekSeconds);
  const nowPct = rowMax > 0 ? (row.thisWeekSeconds / rowMax) * 100 : 0;
  const prevPct = rowMax > 0 ? (row.lastWeekSeconds / rowMax) * 100 : 0;

  return (
    <View style={[styles.row, showDivider && styles.rowDivider]}>
      <View style={styles.labelCol}>
        <View
          style={[styles.dot, { backgroundColor: row.categoryColor }]}
        />
        <Text style={styles.nameText} numberOfLines={1}>
          {row.categoryName}
        </Text>
      </View>

      <View style={styles.barsCol}>
        <BarLine
          pct={nowPct}
          color={row.categoryColor}
          height={NOW_BAR_HEIGHT}
          minWidthIfPositive={row.thisWeekSeconds > 0}
          valueText={
            row.thisWeekSeconds >= NEAR_ZERO_SECONDS
              ? formatCompactDuration(row.thisWeekSeconds)
              : "0m"
          }
          valueStrong
        />
        <BarLine
          pct={prevPct}
          color={COLORS.outlineVariant}
          height={PREV_BAR_HEIGHT}
          minWidthIfPositive={row.lastWeekSeconds > 0}
          valueText={
            row.lastWeekSeconds >= NEAR_ZERO_SECONDS
              ? formatCompactDuration(row.lastWeekSeconds)
              : "0m"
          }
          valueStrong={false}
        />
      </View>

      <View style={[styles.chip, { backgroundColor: chip.bg }]}>
        <Text
          style={[styles.chipText, { color: chip.fg }]}
          numberOfLines={1}
        >
          {chip.text}
        </Text>
      </View>
    </View>
  );
}

interface BarLineProps {
  pct: number;
  color: string;
  height: number;
  minWidthIfPositive: boolean;
  valueText: string;
  valueStrong: boolean;
}

function BarLine({
  pct,
  color,
  height,
  minWidthIfPositive,
  valueText,
  valueStrong,
}: BarLineProps): React.ReactElement {
  return (
    <View style={styles.barRow}>
      <View style={styles.barTrack}>
        <View
          style={{
            width: `${Math.min(pct, 100)}%`,
            height,
            backgroundColor: color,
            borderRadius: 2,
            minWidth: minWidthIfPositive ? 2 : 0,
          }}
        />
      </View>
      <Text
        style={[
          styles.valueText,
          valueStrong ? styles.valueTextStrong : styles.valueTextMuted,
        ]}
        numberOfLines={1}
      >
        {valueText}
      </Text>
    </View>
  );
}

// ──────────────────────────────────────────────

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
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  eyebrowTitle: {
    ...TYPOGRAPHY.labelUppercase,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.3,
    color: COLORS.onSurfaceVariant,
  },
  legend: {
    flexDirection: "row",
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 10,
    lineHeight: 12,
    color: COLORS.onSurfaceVariant,
  },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: COL_GAP,
    paddingVertical: 8,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
  },
  labelCol: {
    width: LABEL_COL_WIDTH,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  nameText: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.onSurface,
    flexShrink: 1,
  },

  barsCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  barTrack: {
    flex: 1,
    height: NOW_BAR_HEIGHT,
    justifyContent: "center",
  },
  valueText: {
    width: VALUE_COL_WIDTH,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  valueTextStrong: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 10,
    lineHeight: 12,
    color: COLORS.onSurface,
  },
  valueTextMuted: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 10,
    lineHeight: 12,
    color: COLORS.outline,
  },

  chip: {
    width: CHIP_COL_WIDTH,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 10,
    lineHeight: 12,
    fontVariant: ["tabular-nums"],
  },
});
