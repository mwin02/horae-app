import { FONTS, RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
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
  const styles = useThemedStyles(makeStyles);
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

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
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
      color: c.onSurfaceVariant,
      marginBottom: 2,
    },
    title: {
      ...TYPOGRAPHY.headingXl,
      color: c.onSurface,
    },
    pill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: RADIUS.full,
      backgroundColor: c.surfaceContainerLowest,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.outlineVariant,
      marginLeft: SPACING.md,
    },
    pillText: {
      fontFamily: FONTS.jakartaSemiBold,
      fontSize: 13,
      color: c.onSurface,
    },
  });
}
