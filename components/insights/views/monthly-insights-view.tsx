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
import type { CategoryInsight, DayCoverage } from "@/db/models";
import React, { useMemo } from "react";

interface MonthlyInsightsViewProps {
  selectedDate: string;
  categoryInsights: CategoryInsight[];
  coverage: DayCoverage;
  totalTrackedMinutes: number;
  onDayPress: (date: string) => void;
  editMode: boolean;
  onEditModeChange: (editing: boolean) => void;
}

export function MonthlyInsightsView({
  selectedDate,
  categoryInsights,
  coverage,
  totalTrackedMinutes,
  onDayPress,
  editMode,
  onEditModeChange,
}: MonthlyInsightsViewProps): React.ReactElement {
  const cards = useMemo<CardEntry[]>(
    () => [
      {
        id: "calendar-heatmap",
        label: "Calendar heatmap",
        node: (
          <CalendarHeatmap monthDate={selectedDate} onDayPress={onDayPress} />
        ),
      },
      {
        id: "category-breakdown",
        label: "Time distribution",
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
        label: "Actual vs ideal",
        node: <ActualVsIdeal categoryInsights={categoryInsights} />,
      },
      {
        id: "activity-breakdown",
        label: "Activity breakdown",
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
        label: "Weekly trend",
        node: <FourWeekTrend monthDate={selectedDate} />,
      },
      {
        id: "top-activities",
        label: "Top activities",
        node: <TopActivitiesRanked monthDate={selectedDate} />,
      },
      {
        id: "tracking-coverage",
        label: "Tracking coverage",
        node: <TrackingCoverage coverage={coverage} period="monthly" />,
      },
    ],
    [categoryInsights, coverage, onDayPress, selectedDate, totalTrackedMinutes],
  );

  return (
    <CustomizableCardList
      period="monthly"
      cards={cards}
      editMode={editMode}
      onEditModeChange={onEditModeChange}
    />
  );
}
