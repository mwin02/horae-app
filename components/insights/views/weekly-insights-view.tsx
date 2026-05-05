import { ActivityBreakdown } from "@/components/insights/activity-breakdown";
import { ActualVsIdeal } from "@/components/insights/actual-vs-ideal";
import { TimeDistribution } from "@/components/insights/time-distribution";
import {
  CustomizableCardList,
  type CardEntry,
} from "@/components/insights/customizable-card-list";
import { DayOfWeekBars } from "@/components/insights/day-of-week-bars";
import { TrackingCoverage } from "@/components/insights/tracking-coverage";
import { WeekOverWeekDelta } from "@/components/insights/week-over-week-delta";
import { SPACING } from "@/constants/theme";
import type { CategoryInsight, DayCoverage } from "@/db/models";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";

interface WeeklyInsightsViewProps {
  selectedDate: string;
  categoryInsights: CategoryInsight[];
  coverage: DayCoverage;
  totalTrackedMinutes: number;
}

export function WeeklyInsightsView({
  selectedDate,
  categoryInsights,
  coverage,
  totalTrackedMinutes,
}: WeeklyInsightsViewProps): React.ReactElement {
  const cards = useMemo<CardEntry[]>(
    () => [
      {
        id: "day-of-week-bars",
        node: <DayOfWeekBars weekDate={selectedDate} />,
      },
      {
        id: "week-over-week",
        node: <WeekOverWeekDelta weekDate={selectedDate} />,
      },
      {
        id: "category-breakdown",
        node: (
          <TimeDistribution
            categoryInsights={categoryInsights}
            totalTrackedMinutes={totalTrackedMinutes}
            period="weekly"
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
            period="weekly"
          />
        ),
      },
      {
        id: "tracking-coverage",
        node: <TrackingCoverage coverage={coverage} period="weekly" />,
      },
    ],
    [categoryInsights, coverage, selectedDate, totalTrackedMinutes],
  );

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <CustomizableCardList period="weekly" cards={cards} />
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
