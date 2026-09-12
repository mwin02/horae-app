import { FONTS, RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";
import type { DayCoverage } from "@/db/models";
import { formatDuration } from "@/lib/timezone";
import type { TFunction } from "i18next";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, StyleSheet, Text, View } from "react-native";

interface TrackingCoverageProps {
  coverage: DayCoverage;
  period: "daily" | "weekly" | "monthly";
}

export function TrackingCoverage({
  coverage,
  period,
}: TrackingCoverageProps): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const { trackedMinutes, coveragePercent } = coverage;

  const trackedHours = formatDuration(trackedMinutes * 60);

  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animatedWidth.setValue(0);
    Animated.timing(animatedWidth, {
      toValue: coveragePercent,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [coveragePercent, animatedWidth]);

  // Pick an encouraging message based on coverage level
  const message = getCoverageMessage(coveragePercent, period, t);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>{t("trackingCoverage.title")}</Text>

      {/* Big percentage */}
      <View style={styles.percentRow}>
        <Text style={styles.percentValue}>{coveragePercent}</Text>
        <Text style={styles.percentSign}>%</Text>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        {period === "daily"
          ? t("trackingCoverage.trackedToday", { duration: trackedHours })
          : period === "weekly"
            ? t("trackingCoverage.trackedThisWeek", { duration: trackedHours })
            : t("trackingCoverage.trackedThisMonth", { duration: trackedHours })}
      </Text>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>

      {/* Encouragement message */}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

// ──────────────────────────────────────────────

function getCoverageMessage(
  percent: number,
  period: "daily" | "weekly" | "monthly",
  t: TFunction,
): string {
  // Whole sentences per period — "today" / "this week" change the grammar
  // around them in other languages.
  const pick = (daily: string, weekly: string, monthly: string): string =>
    period === "daily" ? daily : period === "weekly" ? weekly : monthly;

  if (percent >= 90) {
    return pick(
      t("trackingCoverage.amazingDaily"),
      t("trackingCoverage.amazingWeekly"),
      t("trackingCoverage.amazingMonthly"),
    );
  }
  if (percent >= 70) {
    return pick(
      t("trackingCoverage.greatDaily"),
      t("trackingCoverage.greatWeekly"),
      t("trackingCoverage.greatMonthly"),
    );
  }
  if (percent >= 40) {
    return pick(
      t("trackingCoverage.buildingDaily"),
      t("trackingCoverage.buildingWeekly"),
      t("trackingCoverage.buildingMonthly"),
    );
  }
  if (percent > 0) return t("trackingCoverage.gaps");
  return pick(
    t("trackingCoverage.startDaily"),
    t("trackingCoverage.startWeekly"),
    t("trackingCoverage.startMonthly"),
  );
}

// ──────────────────────────────────────────────

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.surfaceContainerLow,
      borderRadius: RADIUS.xl,
      padding: SPACING["2xl"],
    },
    sectionLabel: {
      ...TYPOGRAPHY.labelUppercase,
      color: c.onSurfaceVariant,
      marginBottom: SPACING.lg,
    },
    percentRow: {
      flexDirection: "row",
      alignItems: "baseline",
    },
    percentValue: {
      fontFamily: FONTS.manropeExtraBold,
      fontSize: 48,
      lineHeight: 48,
      letterSpacing: -2,
      color: c.primary,
      fontVariant: ["tabular-nums"],
    },
    percentSign: {
      fontFamily: FONTS.manropeBold,
      fontSize: 24,
      lineHeight: 28,
      color: c.primary,
      marginLeft: 2,
    },
    subtitle: {
      ...TYPOGRAPHY.body,
      color: c.onSurfaceVariant,
      marginTop: SPACING.xs,
      marginBottom: SPACING.xl,
    },
    progressTrack: {
      height: 10,
      borderRadius: 5,
      backgroundColor: c.surfaceContainer,
      overflow: "hidden",
      marginBottom: SPACING.md,
    },
    progressFill: {
      height: "100%",
      borderRadius: 5,
      backgroundColor: c.primary,
    },
    message: {
      ...TYPOGRAPHY.bodySmall,
      color: c.onSurfaceVariant,
    },
  });
}
