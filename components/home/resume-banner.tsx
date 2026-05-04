import { COLORS, FONTS, RADIUS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface ResumeBannerProps {
  activityName: string;
  categoryColor: string;
  onPress: () => void;
}

/**
 * Compact "Resume [Activity]" affordance shown on the home screen when no
 * timer is running but a recently-stopped entry can still be re-opened.
 */
export function ResumeBanner({
  activityName,
  categoryColor,
  onPress,
}: ResumeBannerProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.dot, { backgroundColor: categoryColor }]} />
      <View style={styles.textCol}>
        <Text style={styles.label}>Resume</Text>
        <Text style={styles.activity} numberOfLines={1}>
          {activityName}
        </Text>
      </View>
      <View style={styles.iconWrap}>
        <Feather name="play" size={16} color={COLORS.onSurface} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING["2xl"],
    gap: SPACING.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  textCol: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    gap: SPACING.sm,
  },
  label: {
    ...TYPOGRAPHY.labelUppercase,
    color: COLORS.onSurfaceVariant,
  },
  activity: {
    fontFamily: FONTS.manropeBold,
    fontSize: 15,
    color: COLORS.onSurface,
    flexShrink: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
});
