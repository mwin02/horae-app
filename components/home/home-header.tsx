import { FONTS, RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
import { getIntlLocale } from "@/lib/i18n";
import { formatDuration, getCurrentTimezone } from "@/lib/timezone";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

interface HomeHeaderProps {
  totalTrackedSeconds: number;
}

function formatTodayDate(timezone: string): string {
  return new Date().toLocaleDateString(getIntlLocale(), {
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
  const { t, i18n } = useTranslation();
  const dateLabel = useMemo(
    () => formatTodayDate(getCurrentTimezone()),
    // Re-format when the UI language changes.
    [i18n.language],
  );
  const totalLabel = t("home.trackedToday", {
    duration: formatDuration(totalTrackedSeconds),
  });

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.date}>{dateLabel}</Text>
        {/* i18n-ignore-next-line: brand name */}
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
