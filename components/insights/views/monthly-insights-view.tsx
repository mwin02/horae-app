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
import { useTranslation } from "react-i18next";

interface MonthlyInsightsViewProps {
  selectedDate: string;
  categoryInsights: CategoryInsight[];
  coverage: DayCoverage;
  totalTrackedMinutes: number;
  onDayPress: (date: string) => void;
  onWeekPress: (weekDate: string) => void;
  editMode: boolean;
  onEditModeChange: (editing: boolean) => void;
}

export function MonthlyInsightsView({
  selectedDate,
  categoryInsights,
  coverage,
  totalTrackedMinutes,
  onDayPress,
  onWeekPress,
  editMode,
  onEditModeChange,
}: MonthlyInsightsViewProps): React.ReactElement {
  const { t } = useTranslation();
  const cards = useMemo<CardEntry[]>(
    () => [
      {
        id: "calendar-heatmap",
        label: t("insightsCards.calendarHeatmap"),
        node: (
          <CalendarHeatmap monthDate={selectedDate} onDayPress={onDayPress} />
        ),
      },
      {
        id: "category-breakdown",
        label: t("insightsCards.timeDistribution"),
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
            period="monthly"
          />
        ),
      },
      {
        id: "four-week-trend",
        label: t("insightsCards.weeklyTrend"),
        node: (
          <FourWeekTrend
            monthDate={selectedDate}
            onWeekPress={onWeekPress}
          />
        ),
      },
      {
        id: "top-activities",
        label: t("insightsCards.topActivities"),
        node: <TopActivitiesRanked monthDate={selectedDate} />,
      },
      {
        id: "tracking-coverage",
        label: t("insightsCards.trackingCoverage"),
        node: <TrackingCoverage coverage={coverage} period="monthly" />,
      },
    ],
    [categoryInsights, coverage, onDayPress, onWeekPress, selectedDate, totalTrackedMinutes, t],
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
