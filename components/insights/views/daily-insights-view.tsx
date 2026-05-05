import { ActivityBreakdown } from "@/components/insights/activity-breakdown";
import { ActualVsIdeal } from "@/components/insights/actual-vs-ideal";
import { TimeDistribution } from "@/components/insights/time-distribution";
import {
  CustomizableCardList,
  type CardEntry,
} from "@/components/insights/customizable-card-list";
import { DayRhythmStrip } from "@/components/insights/day-rhythm-strip";
import { TrackingCoverage } from "@/components/insights/tracking-coverage";
import { WeekStrip } from "@/components/timeline/week-strip";
import { SPACING } from "@/constants/theme";
import type { CategoryInsight, DayCoverage } from "@/db/models";
import React, { useCallback, useMemo, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

const WEEK_STRIP_HEIGHT = 88;

interface DailyInsightsViewProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  categoryInsights: CategoryInsight[];
  coverage: DayCoverage;
  totalTrackedMinutes: number;
  editMode: boolean;
  onEditModeChange: (editing: boolean) => void;
}

export function DailyInsightsView({
  selectedDate,
  onDateChange,
  categoryInsights,
  coverage,
  totalTrackedMinutes,
  editMode,
  onEditModeChange,
}: DailyInsightsViewProps): React.ReactElement {
  // DraggableFlatList owns the scroll handler internally and only forwards
  // the offset via the JS callback `onScrollOffsetChange`. We push that into
  // a legacy Animated.Value to drive the WeekStrip collapse cheaply.
  const scrollY = useRef(new Animated.Value(0)).current;
  const handleScrollOffsetChange = useCallback(
    (offset: number) => {
      scrollY.setValue(offset);
    },
    [scrollY],
  );

  const weekStripHeight = scrollY.interpolate({
    inputRange: [0, WEEK_STRIP_HEIGHT],
    outputRange: [WEEK_STRIP_HEIGHT, 0],
    extrapolate: "clamp",
  });
  const weekStripOpacity = scrollY.interpolate({
    inputRange: [0, WEEK_STRIP_HEIGHT * 0.6],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const cards = useMemo<CardEntry[]>(
    () => [
      {
        id: "day-rhythm-strip",
        label: "Day rhythm",
        node: <DayRhythmStrip date={selectedDate} />,
      },
      {
        id: "category-breakdown",
        label: "Time distribution",
        node: (
          <TimeDistribution
            categoryInsights={categoryInsights}
            totalTrackedMinutes={totalTrackedMinutes}
            period="daily"
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
            period="daily"
          />
        ),
      },
      {
        id: "tracking-coverage",
        label: "Tracking coverage",
        node: <TrackingCoverage coverage={coverage} period="daily" />,
      },
    ],
    [categoryInsights, coverage, selectedDate, totalTrackedMinutes],
  );

  const header = (
    <Animated.View
      style={[
        styles.weekStripWrapper,
        { height: weekStripHeight, opacity: weekStripOpacity },
      ]}
    >
      <WeekStrip selectedDate={selectedDate} onDateChange={onDateChange} />
    </Animated.View>
  );

  return (
    <CustomizableCardList
      period="daily"
      cards={cards}
      ListHeaderComponent={header}
      onScrollOffsetChange={handleScrollOffsetChange}
      editMode={editMode}
      onEditModeChange={onEditModeChange}
    />
  );
}

const styles = StyleSheet.create({
  weekStripWrapper: {
    marginHorizontal: -SPACING.xl,
    marginBottom: SPACING.lg,
    overflow: "hidden",
  },
});
