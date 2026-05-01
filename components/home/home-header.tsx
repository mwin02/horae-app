import { COLORS, FONTS, RADIUS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import { formatDuration, getCurrentTimezone } from "@/lib/timezone";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

interface HomeHeaderProps {
  totalTrackedSeconds: number;
}

function formatTodayDate(timezone: string): string {
  return new Date().toLocaleDateString("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function HomeHeader({
  totalTrackedSeconds,
}: HomeHeaderProps): React.ReactElement {
  const dateLabel = useMemo(() => formatTodayDate(getCurrentTimezone()), []);
  const totalLabel = `${formatDuration(totalTrackedSeconds)} today`;

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.date}>{dateLabel}</Text>
        <Text style={styles.title}>Horae</Text>
      </View>
      <View style={styles.pill}>
        <Text style={styles.pillText}>{totalLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: SPACING.xl,
  },
  left: {
    flex: 1,
    minWidth: 0,
  },
  date: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginBottom: 2,
  },
  title: {
    ...TYPOGRAPHY.headingXl,
    color: COLORS.onSurface,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outlineVariant,
    marginLeft: SPACING.md,
  },
  pillText: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 13,
    color: COLORS.onSurface,
  },
});
