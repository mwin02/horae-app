import { ActivityBreakdown } from "@/components/insights/activity-breakdown";
import { ActualVsIdeal } from "@/components/insights/actual-vs-ideal";
import { CalendarHeatmap } from "@/components/insights/calendar-heatmap";
import { TimeDistribution } from "@/components/insights/time-distribution";
import {
  CustomizableCardList,
  type CardEntry,
} from "@/components/insights/customizable-card-list";
import { FourWeekTrend } from "@/components/insights/four-week-trend";
import { TopActivitiesRanked } from "@/components/insights/top-activities-ranked";
import { TrackingCoverage } from "@/components/insights/tracking-coverage";
import { SPACING } from "@/constants/theme";
import type { CategoryInsight, DayCoverage } from "@/db/models";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";

interface MonthlyInsightsViewProps {
  selectedDate: string;
  categoryInsights: CategoryInsight[];
  coverage: DayCoverage;
  totalTrackedMinutes: number;
  onDayPress: (date: string) => void;
}

export function MonthlyInsightsView({
  selectedDate,
  categoryInsights,
  coverage,
  totalTrackedMinutes,
  onDayPress,
}: MonthlyInsightsViewProps): React.ReactElement {
  const cards = useMemo<CardEntry[]>(
    () => [
      {
        id: "calendar-heatmap",
        node: (
          <CalendarHeatmap monthDate={selectedDate} onDayPress={onDayPress} />
        ),
      },
      {
        id: "category-breakdown",
        node: (
          <TimeDistribution
            categoryInsights={categoryInsights}
            totalTrackedMinutes={totalTrackedMinutes}
            period="monthly"
            selectedDate={selectedDate}
          />
        ),
      },
      {
        id: "actual-vs-ideal",
        node: <ActualVsIdeal categoryInsights={categoryInsights} />,
      },
      {
        id: "activity-breakdown",
        node: (
          <ActivityBreakdown
            categoryInsights={categoryInsights}
            selectedDate={selectedDate}
            period="monthly"
          />
        ),
      },
      {
        id: "four-week-trend",
        node: <FourWeekTrend monthDate={selectedDate} />,
      },
      {
        id: "top-activities",
        node: <TopActivitiesRanked monthDate={selectedDate} />,
      },
      {
        id: "tracking-coverage",
        node: <TrackingCoverage coverage={coverage} period="monthly" />,
      },
    ],
    [categoryInsights, coverage, onDayPress, selectedDate, totalTrackedMinutes],
  );

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <CustomizableCardList period="monthly" cards={cards} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING["5xl"],
    gap: SPACING.lg,
  },
});
