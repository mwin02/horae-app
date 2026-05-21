import { CategoryIcon } from "@/components/common/category-icon";
import { FONTS, RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
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
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.card}>
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

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.startBtn,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Feather name="play" size={12} color={colors.onSurface} />
        <Text style={styles.startLabel}>Start</Text>
      </Pressable>
    </View>
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

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    card: {
      width: 240,
      backgroundColor: c.surfaceContainerLowest,
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.outlineVariant,
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
      color: c.onSurface,
    },
    subtitle: {
      ...TYPOGRAPHY.bodySmall,
      color: c.onSurfaceVariant,
    },
    startBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.sm,
      paddingVertical: 11,
      paddingHorizontal: SPACING.md,
      borderRadius: 999,
      backgroundColor: c.surfaceContainerLow,
    },
    startLabel: {
      fontFamily: FONTS.manropeBold,
      fontSize: 14,
      color: c.onSurface,
    },
  });
}
