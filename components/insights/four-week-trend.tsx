import { CategoryIconSwatch } from "./category-icon-swatch";
import { COLORS, FONTS, RADIUS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import {
  useFourWeekTrend,
  type CategoryTrend,
} from "@/hooks/useFourWeekTrend";
import { formatDuration } from "@/lib/timezone";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { deltaPalette, deltaPolarity } from "./delta-polarity";

interface FourWeekTrendProps {
  monthDate: string;
}

const LABEL_COL_WIDTH = 92;
const DELTA_COL_WIDTH = 54;
const MAX_PCT_DISPLAY = 999;
const ROW_GAP = 4;
const SPARK_HEIGHT = 28;
const SPARK_PADDING_Y = 3;

export function FourWeekTrend({
  monthDate,
}: FourWeekTrendProps): React.ReactElement | null {
  const { buckets, categories, isLoading } = useFourWeekTrend(monthDate);

  if (isLoading) return null;

  const hasData =
    categories.length > 0 && categories.some((c) => c.totalSeconds > 0);
  const weekCount = buckets.length;
  const weekLabels = buckets.map((b) => b.label);

  return (
    <View style={styles.container}>
      <View style={styles.eyebrow}>
        <Text style={styles.eyebrowTitle}>WEEKLY TREND</Text>
        {hasData ? (
          <Text style={styles.eyebrowMeta}>
            {weekCount} week{weekCount === 1 ? "" : "s"}
          </Text>
        ) : null}
      </View>

      {!hasData ? (
        <Text style={styles.emptyText}>No tracked time this month</Text>
      ) : (
        <>
          <View style={styles.weekLabelsRow}>
            <View style={styles.weekLabels}>
              {weekLabels.map((label) => (
                <Text key={label} style={styles.weekLabel}>
                  {label}
                </Text>
              ))}
            </View>
          </View>

          <View>
            {categories.map((cat, i) => (
              <TrendRow
                key={cat.category.id}
                trend={cat}
                weekCount={weekCount}
                completeFlags={buckets.map((b) => b.complete)}
                showDivider={i > 0}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ──────────────────────────────────────────────

interface TrendRowProps {
  trend: CategoryTrend;
  weekCount: number;
  completeFlags: boolean[];
  showDivider: boolean;
}

function TrendRow({
  trend,
  weekCount,
  completeFlags,
  showDivider,
}: TrendRowProps): React.ReactElement {
  const { values, category, goalDirection, weeklyTargetSeconds } = trend;

  // Compare first non-zero *complete* week vs most-recent non-zero complete
  // week. Leading zero weeks are skipped so a category that only started
  // appearing mid-month doesn't get a meaningless +100% from "0 → anything".
  // The in-progress week is excluded so partial data doesn't deflate the %.
  // WeekOverWeek already covers last-vs-this-week.
  let firstIdx = -1;
  let lastIdx = -1;
  for (let i = 0; i < values.length; i += 1) {
    if (!completeFlags[i]) continue;
    if (values[i] <= 0) continue;
    if (firstIdx === -1) firstIdx = i;
    lastIdx = i;
  }
  const haveDelta = firstIdx !== -1 && lastIdx !== -1 && lastIdx !== firstIdx;
  const isNew = firstIdx !== -1 && firstIdx === lastIdx;

  const first = haveDelta ? values[firstIdx] : 0;
  const last = haveDelta ? values[lastIdx] : 0;
  const trendUp = haveDelta && last > first;
  const pctChange =
    haveDelta && first > 0 ? Math.round(((last - first) / first) * 100) : 0;

  // Polarity is driven by the goal direction. For `around` we compare the
  // first vs last complete week's distance to the weekly target — green if
  // the latest week is closer, red if farther. Without a target (or with
  // no goal at all) the chip stays neutral.
  const aroundCtx =
    goalDirection === "around" && weeklyTargetSeconds != null
      ? {
          thisSeconds: last,
          lastSeconds: first,
          targetSeconds: weeklyTargetSeconds,
        }
      : undefined;
  const polarity = haveDelta
    ? deltaPolarity(goalDirection, trendUp, aroundCtx)
    : isNew
      ? deltaPolarity(goalDirection, true, aroundCtx)
      : "neutral";
  const { fg: chipColor, bg: chipBg } = deltaPalette(polarity);
  const arrow = trendUp ? "▲" : "▼";

  return (
    <View style={[styles.row, showDivider && styles.rowDivider]}>
      <View style={styles.labelCol}>
        <View style={styles.nameRow}>
          <CategoryIconSwatch
            icon={category.icon}
            color={category.color}
          />
          <Text style={styles.nameText} numberOfLines={1}>
            {category.name}
          </Text>
        </View>
        <Text style={styles.totalText}>{formatDuration(trend.totalSeconds)}</Text>
      </View>

      <View style={styles.sparkCol}>
        <Sparkline
          values={values.slice(0, weekCount)}
          color={category.color}
        />
      </View>

      <View style={[styles.chip, { backgroundColor: chipBg }]}>
        <Text
          style={[styles.chipText, { color: chipColor }]}
          numberOfLines={1}
        >
          {haveDelta
            ? `${arrow} ${Math.min(Math.abs(pctChange), MAX_PCT_DISPLAY)}%`
            : isNew
              ? "new"
              : "—"}
        </Text>
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────

interface SparklineProps {
  values: number[];
  color: string;
}

function Sparkline({ values, color }: SparklineProps): React.ReactElement {
  const [width, setWidth] = React.useState(0);

  if (values.length === 0 || width === 0) {
    return (
      <View
        style={styles.sparkBox}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      />
    );
  }

  const max = Math.max(...values, 1);
  const innerHeight = SPARK_HEIGHT - SPARK_PADDING_Y * 2;
  const n = values.length;
  const stepX = n > 1 ? width / (n - 1) : 0;

  const points = values.map((v, i) => ({
    x: n > 1 ? i * stepX : width / 2,
    y: SPARK_PADDING_Y + innerHeight * (1 - v / max),
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${width.toFixed(1)} ${SPARK_HEIGHT} L 0 ${SPARK_HEIGHT} Z`;

  return (
    <View
      style={styles.sparkBox}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Svg width={width} height={SPARK_HEIGHT}>
        <Path d={areaPath} fill={color} fillOpacity={0.12} />
        <Path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={1.6}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 2.4 : 1.4}
            fill={color}
          />
        ))}
      </Svg>
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
  },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
  },

  // Shared week label row
  weekLabelsRow: {
    flexDirection: "row",
    paddingBottom: 6,
  },
  weekLabels: {
    marginLeft: LABEL_COL_WIDTH + ROW_GAP,
    marginRight: DELTA_COL_WIDTH + ROW_GAP,
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekLabel: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.6,
    color: COLORS.outline,
  },

  // Rows
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: ROW_GAP,
    paddingVertical: 8,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
  },
  labelCol: {
    width: LABEL_COL_WIDTH,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  nameText: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.onSurface,
    flexShrink: 1,
  },
  totalText: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.onSurfaceVariant,
    fontVariant: ["tabular-nums"],
  },
  sparkCol: {
    flex: 1,
    minWidth: 0,
  },
  sparkBox: {
    height: SPARK_HEIGHT,
    width: "100%",
  },
  chip: {
    width: DELTA_COL_WIDTH,
    paddingVertical: 2,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 9,
    lineHeight: 12,
    fontVariant: ["tabular-nums"],
  },
});
