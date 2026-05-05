import { CategoryIcon } from "@/components/common/category-icon";
import { COLORS, FONTS, RADIUS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import type { CategoryInsight } from "@/db/models";
import { formatDuration } from "@/lib/timezone";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, Pattern, Path, Rect } from "react-native-svg";
import { deltaPalette, type DeltaPolarity } from "./delta-polarity";

interface ActualVsIdealProps {
  categoryInsights: CategoryInsight[];
}

export function ActualVsIdeal({
  categoryInsights,
}: ActualVsIdealProps): React.ReactElement {
  const router = useRouter();
  const withTargets = categoryInsights.filter((c) => c.targetMinutes != null);

  const openSettings = useCallback(() => {
    router.push("/ideal-allocations");
  }, [router]);

  const Header = (
    <View style={styles.headerRow}>
      <Text style={styles.sectionLabel}>ACTUAL VS IDEAL</Text>
      <Pressable
        onPress={openSettings}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Set ideal allocations"
        style={({ pressed }) => [
          styles.gearButton,
          pressed && styles.gearButtonPressed,
        ]}
      >
        <Feather name="settings" size={16} color={COLORS.onSurfaceVariant} />
      </Pressable>
    </View>
  );

  if (withTargets.length === 0) {
    return (
      <View style={styles.container}>
        {Header}
        <Text style={styles.emptyText}>
          Set goals for your categories to see how you compare.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Header}
      <View>
        {withTargets.map((insight, i) => (
          <ComparisonRow
            key={insight.categoryId}
            insight={insight}
            isFirst={i === 0}
          />
        ))}
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────

interface ComparisonRowProps {
  insight: CategoryInsight;
  isFirst: boolean;
}

const BAR_HEIGHT = 10;
const OVERSHOOT_WIDTH = 10;

function ComparisonRow({
  insight,
  isFirst,
}: ComparisonRowProps): React.ReactElement {
  const actual = insight.actualMinutes;
  const target = insight.targetMinutes ?? 0;
  const delta = actual - target;

  const direction = insight.goalDirection;
  let polarity: DeltaPolarity;
  if (direction == null) {
    polarity = "neutral";
  } else if (target <= 0) {
    polarity = actual === 0 ? "good" : "bad";
  } else if (direction === "at_least") {
    polarity = actual >= target ? "good" : "bad";
  } else if (direction === "at_most") {
    polarity = actual <= target ? "good" : "bad";
  } else {
    polarity = Math.abs(delta) <= target * 0.2 ? "good" : "bad";
  }
  const chipPalette = deltaPalette(polarity);

  // Bar scale: 1.5x goal so the goal marker sits at ~66%.
  const scaleMax = target > 0 ? target * 1.5 : Math.max(actual, 1);
  const actualPct =
    target > 0
      ? (Math.min(actual, scaleMax) / scaleMax) * 100
      : actual > 0
        ? 100
        : 0;
  const goalPct = target > 0 ? (target / scaleMax) * 100 : 0;
  const overshoot = target > 0 && actual > scaleMax;

  const sign = delta >= 0 ? "+" : "−";

  const [showName, setShowName] = useState(false);
  useEffect(() => {
    if (!showName) return;
    const t = setTimeout(() => setShowName(false), 1800);
    return () => clearTimeout(t);
  }, [showName]);

  const toggleName = useCallback(() => {
    setShowName((v) => !v);
  }, []);

  return (
    <View style={[styles.row, !isFirst && styles.rowDivider]}>
      <View style={styles.rowHeader}>
        <View style={styles.rowHeaderLeft}>
          <Pressable
            onPress={toggleName}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={insight.categoryName}
            style={({ pressed }) => [
              styles.iconSwatch,
              { backgroundColor: insight.categoryColor + "26" },
              pressed && styles.iconSwatchPressed,
            ]}
          >
            <CategoryIcon
              icon={insight.categoryIcon}
              size={14}
              color={insight.categoryColor}
            />
          </Pressable>
          {showName ? (
            <Text style={styles.categoryName} numberOfLines={1}>
              {insight.categoryName}
            </Text>
          ) : (
            <Text style={styles.amountText} numberOfLines={1}>
              {formatDuration(actual * 60)} / {formatDuration(target * 60)}
            </Text>
          )}
        </View>
        <View
          style={[styles.diffChip, { backgroundColor: chipPalette.bg }]}
        >
          <Text style={[styles.diffText, { color: chipPalette.fg }]}>
            {sign}
            {formatDuration(Math.abs(delta) * 60)}
          </Text>
        </View>
      </View>

      {/* Goal label sits above the marker */}
      <View style={styles.barArea}>
        <View style={styles.goalLabelRow}>
          <View
            style={[styles.goalLabelWrap, { left: `${goalPct}%` }]}
          >
            <Text style={styles.goalLabel} numberOfLines={1}>
              GOAL
            </Text>
          </View>
        </View>

        <View style={styles.barTrack}>
          {/* Actual fill */}
          <View
            style={[
              styles.barFill,
              {
                width: `${actualPct}%`,
                backgroundColor: insight.categoryColor,
                minWidth: actual > 0 ? 4 : 0,
              },
            ]}
          />
          {/* Overshoot stripes */}
          {overshoot && (
            <View
              style={[
                styles.overshoot,
                { width: OVERSHOOT_WIDTH },
              ]}
              pointerEvents="none"
            >
              <Svg width="100%" height="100%">
                <Defs>
                  <Pattern
                    id={`stripes-${insight.categoryId}`}
                    patternUnits="userSpaceOnUse"
                    width="6"
                    height="6"
                    patternTransform="rotate(45)"
                  >
                    <Path
                      d="M0,0 L0,6"
                      stroke={insight.categoryColor}
                      strokeWidth="3"
                    />
                  </Pattern>
                </Defs>
                <Rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill={`url(#stripes-${insight.categoryId})`}
                />
              </Svg>
            </View>
          )}
          {/* Goal marker line */}
          <View
            style={[
              styles.goalMarker,
              { left: `${goalPct}%` },
            ]}
            pointerEvents="none"
          />
        </View>
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.xl,
    padding: SPACING["2xl"],
  },
  sectionLabel: {
    ...TYPOGRAPHY.labelUppercase,
    color: COLORS.onSurfaceVariant,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  gearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  gearButtonPressed: {
    backgroundColor: COLORS.surfaceContainer,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurfaceVariant,
  },
  row: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outlineVariant,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  rowHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flex: 1,
    minWidth: 0,
  },
  iconSwatch: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSwatchPressed: {
    opacity: 0.7,
  },
  categoryName: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.onSurface,
    flexShrink: 1,
  },
  amountText: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.onSurface,
    flexShrink: 1,
  },
  diffChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  diffText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  barArea: {
    paddingTop: 12,
  },
  goalLabelRow: {
    height: 0,
    position: "relative",
  },
  goalLabelWrap: {
    position: "absolute",
    top: -12,
    width: 40,
    marginLeft: -20,
    alignItems: "center",
  },
  goalLabel: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 8,
    lineHeight: 10,
    letterSpacing: 0.5,
    color: COLORS.onSurface,
  },
  barTrack: {
    position: "relative",
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: COLORS.outlineVariant,
    overflow: "hidden",
  },
  barFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: BAR_HEIGHT / 2,
  },
  overshoot: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
  },
  goalMarker: {
    position: "absolute",
    top: -2,
    bottom: -2,
    width: 2,
    marginLeft: -1,
    backgroundColor: COLORS.onSurface,
    borderRadius: 1,
  },
});
