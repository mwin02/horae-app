import { CategoryIcon } from "@/components/common/category-icon";
import { COLORS, FONTS, RADIUS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface SuggestedCardProps {
  activityName: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string | null;
  subtitle: string;
  onPress: () => void;
}

const ICON_TILE_SIZE = 36;

/** Single recommended-activity card, used inside the horizontal carousel. */
export function SuggestedCard({
  activityName,
  categoryName,
  categoryColor,
  categoryIcon,
  subtitle,
  onPress,
}: SuggestedCardProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconTile,
            { backgroundColor: withAlpha(categoryColor, 0.16) },
          ]}
        >
          <CategoryIcon icon={categoryIcon} size={18} color={categoryColor} />
        </View>
        <Text
          style={[styles.eyebrow, { color: categoryColor }]}
          numberOfLines={1}
        >
          {categoryName}
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {activityName}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.startBtn}>
        <Feather name="play" size={12} color={COLORS.onSurface} />
        <Text style={styles.startLabel}>Start</Text>
      </View>
    </Pressable>
  );
}

/**
 * Apply an alpha to a hex color (#RRGGBB) without pulling in a color util.
 * Falls back to the original color if it's not a parseable hex.
 */
function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${m[1]}${a}`;
}

const styles = StyleSheet.create({
  card: {
    width: 240,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outlineVariant,
    gap: SPACING.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  iconTile: {
    width: ICON_TILE_SIZE,
    height: ICON_TILE_SIZE,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    ...TYPOGRAPHY.labelUppercase,
    fontSize: 11,
    flexShrink: 1,
  },
  body: {
    gap: 2,
  },
  title: {
    ...TYPOGRAPHY.heading,
    color: COLORS.onSurface,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: 11,
    paddingHorizontal: SPACING.md,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  startLabel: {
    fontFamily: FONTS.manropeBold,
    fontSize: 14,
    color: COLORS.onSurface,
  },
});
