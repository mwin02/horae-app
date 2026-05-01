import { CategoryIcon } from "@/components/common/category-icon";
import { COLORS, FONTS, RADIUS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import type { QuickStartActivity } from "@/hooks/useQuickStartActivities";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface QuickStartGridProps {
  activities: QuickStartActivity[];
  activeActivityId: string | null;
  onActivityPress: (activityId: string) => void;
}

const TILE_WIDTH = 168;

/**
 * Quick Start: a horizontally-scrollable 2-row grid of all activities,
 * ordered by all-time usage. Each column holds two stacked tiles so the
 * row scrolls as a paired unit.
 */
export function QuickStartGrid({
  activities,
  activeActivityId,
  onActivityPress,
}: QuickStartGridProps): React.ReactElement | null {
  const router = useRouter();

  // Pair activities into [top, bottom] columns. The most-used activities
  // fill the top row first, then the bottom — so column N contains
  // ranks 2N and 2N+1.
  const columns = useMemo(() => {
    const pairs: Array<[QuickStartActivity, QuickStartActivity | undefined]> = [];
    for (let i = 0; i < activities.length; i += 2) {
      pairs.push([activities[i], activities[i + 1]]);
    }
    return pairs;
  }, [activities]);

  if (activities.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Quick Start</Text>
        <Pressable
          onPress={() => router.push("/manage-activities")}
          hitSlop={8}
          style={styles.manageBtn}
        >
          <Feather name="settings" size={12} color={COLORS.onSurfaceVariant} />
          <Text style={styles.manageLabel}>Manage</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {columns.map(([top, bottom]) => (
          <View key={top.id} style={styles.column}>
            <Tile
              activity={top}
              isActive={activeActivityId === top.id}
              onPress={onActivityPress}
            />
            {bottom ? (
              <Tile
                activity={bottom}
                isActive={activeActivityId === bottom.id}
                onPress={onActivityPress}
              />
            ) : (
              <View style={styles.tileSpacer} />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

interface TileProps {
  activity: QuickStartActivity;
  isActive: boolean;
  onPress: (activityId: string) => void;
}

function Tile({ activity, isActive, onPress }: TileProps): React.ReactElement {
  return (
    <Pressable
      onPress={() => onPress(activity.id)}
      style={({ pressed }) => [
        styles.tile,
        isActive && styles.tileActive,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <View
        style={[
          styles.iconTile,
          { backgroundColor: withAlpha(activity.categoryColor, 0.16) },
        ]}
      >
        <CategoryIcon
          icon={activity.icon}
          size={16}
          color={activity.categoryColor}
        />
      </View>
      <View style={styles.tileText}>
        <Text
          style={[styles.eyebrow, { color: activity.categoryColor }]}
          numberOfLines={1}
        >
          {activity.categoryName}
        </Text>
        <Text style={styles.tileLabel} numberOfLines={1}>
          {activity.name}
        </Text>
      </View>
    </Pressable>
  );
}

function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${m[1]}${a}`;
}

const TILE_HEIGHT = 56;

const styles = StyleSheet.create({
  wrap: {
    marginBottom: SPACING["3xl"],
    marginHorizontal: -SPACING.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  heading: {
    ...TYPOGRAPHY.heading,
    color: COLORS.onSurface,
  },
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  manageLabel: {
    ...TYPOGRAPHY.labelUppercase,
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  column: {
    width: TILE_WIDTH,
    gap: SPACING.sm,
  },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: TILE_HEIGHT,
  },
  tileActive: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  tileSpacer: {
    height: TILE_HEIGHT,
  },
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  tileText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    ...TYPOGRAPHY.labelUppercase,
    fontSize: 10,
  },
  tileLabel: {
    fontFamily: FONTS.manropeBold,
    fontSize: 14,
    color: COLORS.onSurface,
  },
});
