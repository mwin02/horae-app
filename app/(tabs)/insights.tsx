import { ActivityBreakdown } from "@/components/insights/activity-breakdown";
import { ActualVsIdeal } from "@/components/insights/actual-vs-ideal";
import { CategoryBreakdown } from "@/components/insights/category-breakdown";
import { PeriodToggle } from "@/components/insights/period-toggle";
import { TrackingCoverage } from "@/components/insights/tracking-coverage";
import { WeekNavHeader } from "@/components/insights/week-nav-header";
import { DateHeader } from "@/components/timeline/date-header";
import { WeekStrip } from "@/components/timeline/week-strip";
import { COLORS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import { useInsightsData, type InsightsPeriod } from "@/hooks/useInsightsData";
import { getCurrentTimezone, getTodayDate } from "@/lib/timezone";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function InsightsScreen(): React.ReactElement {
  const today = getTodayDate(getCurrentTimezone());
  const [period, setPeriod] = useState<InsightsPeriod>("daily");
  const [dailyDate, setDailyDate] = useState<string>(today);
  const [weeklyDate, setWeeklyDate] = useState<string>(today);

  const activeDate = period === "daily" ? dailyDate : weeklyDate;
  const { categoryInsights, coverage, totalTrackedMinutes, isLoading } =
    useInsightsData(activeDate, period);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <PeriodToggle period={period} onPeriodChange={setPeriod} />

      {period === "daily" ? (
        <>
          <DateHeader selectedDate={dailyDate} onDateChange={setDailyDate} />
          <WeekStrip selectedDate={dailyDate} onDateChange={setDailyDate} />
        </>
      ) : (
        <WeekNavHeader selectedDate={weeklyDate} onDateChange={setWeeklyDate} />
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={COLORS.primary} />
      ) : categoryInsights.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptyBody}>
            Start tracking activities to see your insights here.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <CategoryBreakdown
            categoryInsights={categoryInsights}
            totalTrackedMinutes={totalTrackedMinutes}
          />

          <ActualVsIdeal categoryInsights={categoryInsights} />

          <ActivityBreakdown
            categoryInsights={categoryInsights}
            selectedDate={activeDate}
            period={period}
          />

          <TrackingCoverage coverage={coverage} period={period} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.headingXl,
    color: COLORS.onSurface,
  },
  loader: {
    marginTop: SPACING["3xl"],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING["5xl"],
    gap: SPACING.lg,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING["3xl"],
  },
  emptyTitle: {
    ...TYPOGRAPHY.heading,
    color: COLORS.onSurface,
    marginBottom: SPACING.sm,
  },
  emptyBody: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
  },
});
