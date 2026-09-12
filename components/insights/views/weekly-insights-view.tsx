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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const cards = useMemo<CardEntry[]>(
    () => [
      {
        id: "day-of-week-bars",
        label: t("insightsCards.dayOfWeekBars"),
        node: <DayOfWeekBars weekDate={selectedDate} />,
      },
      {
        id: "week-over-week",
        label: t("insightsCards.weekOverWeek"),
        node: <WeekOverWeekDelta weekDate={selectedDate} />,
      },
      {
        id: "category-breakdown",
        label: t("insightsCards.timeDistribution"),
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
        label: t("insightsCards.actualVsIdeal"),
        node: <ActualVsIdeal categoryInsights={categoryInsights} />,
      },
      {
        id: "activity-breakdown",
        label: t("insightsCards.activityBreakdown"),
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
        label: t("insightsCards.trackingCoverage"),
        node: <TrackingCoverage coverage={coverage} period="weekly" />,
      },
    ],
    [categoryInsights, coverage, selectedDate, totalTrackedMinutes, t],
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
