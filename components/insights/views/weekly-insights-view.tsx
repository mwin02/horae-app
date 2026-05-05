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
import type { CategoryInsight, DayCoverage } from "@/db/models";
import React, { useMemo } from "react";

interface WeeklyInsightsViewProps {
  selectedDate: string;
  categoryInsights: CategoryInsight[];
  coverage: DayCoverage;
  totalTrackedMinutes: number;
  editMode: boolean;
  onEditModeChange: (editing: boolean) => void;
}

export function WeeklyInsightsView({
  selectedDate,
  categoryInsights,
  coverage,
  totalTrackedMinutes,
  editMode,
  onEditModeChange,
}: WeeklyInsightsViewProps): React.ReactElement {
  const cards = useMemo<CardEntry[]>(
    () => [
      {
        id: "day-of-week-bars",
        label: "Day-of-week bars",
        node: <DayOfWeekBars weekDate={selectedDate} />,
      },
      {
        id: "week-over-week",
        label: "Week over week",
        node: <WeekOverWeekDelta weekDate={selectedDate} />,
      },
      {
        id: "category-breakdown",
        label: "Time distribution",
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
            period="weekly"
          />
        ),
      },
      {
        id: "tracking-coverage",
        label: "Tracking coverage",
        node: <TrackingCoverage coverage={coverage} period="weekly" />,
      },
    ],
    [categoryInsights, coverage, selectedDate, totalTrackedMinutes],
  );

  return (
    <CustomizableCardList
      period="weekly"
      cards={cards}
      editMode={editMode}
      onEditModeChange={onEditModeChange}
    />
  );
}
