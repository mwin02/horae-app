import { ForgottenTimerModal } from "@/components/timer/forgotten-timer-modal";
import { HomeHeader } from "@/components/home/home-header";
import { ResumeBanner } from "@/components/home/resume-banner";
import { RingTimerHero } from "@/components/home/ring-timer-hero";
import { QuickStartGrid } from "@/components/home/quick-start-grid";
import { SuggestedRow } from "@/components/home/suggested-row";
import { WeeklyStreak } from "@/components/home/weekly-streak";
import { UndoToast } from "@/components/common/undo-toast";
import { COLORS, SPACING } from "@/constants/theme";
import {
  endForgottenEntry,
  deleteEntry,
  getRunningEntry,
  setEntryTags,
} from "@/db/queries";
import { useTimer } from "@/hooks/useTimer";
import { useForgottenTimer } from "@/hooks/useForgottenTimer";
import { useResumableEntry } from "@/hooks/useResumableEntry";
import { useCategoriesWithActivities } from "@/hooks/useCategoriesWithActivities";
import { useQuickStartActivities } from "@/hooks/useQuickStartActivities";
import { useRecommendedActivity } from "@/hooks/useRecommendedActivity";
import { useTodayClockArcs } from "@/hooks/useTodayClockArcs";
import { getCurrentTimezone, getTodayDate } from "@/lib/timezone";
import { NewSessionModal } from "@/components/timer/new-session-modal";
import { useUIStore } from "@/store/uiStore";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen(): React.ReactElement {
  const {
    runningEntry,
    isLoading,
    startActivity,
    stopActivity,
    switchActivity,
    resumeActivity,
  } = useTimer();
  const resumableEntry = useResumableEntry();
  const { categories, isLoading: categoriesLoading } =
    useCategoriesWithActivities();
  const { activities: quickStartActivities } = useQuickStartActivities();
  const { recommendations } = useRecommendedActivity(
    runningEntry?.activityId ?? null,
  );
  const { arcs, nowMinutes, totalTrackedSeconds } = useTodayClockArcs();
  const { forgottenEntry, recommendedEndAt, snoozeForgotten } =
    useForgottenTimer();
  const [modalVisible, setModalVisible] = useState(false);
  const [undoToast, setUndoToast] = useState<{
    entryId: string;
    activityName: string;
  } | null>(null);
  const pendingHomeAction = useUIStore((s) => s.pendingHomeAction);
  const setPendingHomeAction = useUIStore((s) => s.setPendingHomeAction);

  // Consume deep-link triggers (e.g. the home-screen widget's "Tap to
  // start" CTA). Runs once per flag flip from `useTimerDeepLinks`.
  useEffect(() => {
    if (pendingHomeAction === "newSession") {
      setModalVisible(true);
      setPendingHomeAction(null);
    }
  }, [pendingHomeAction, setPendingHomeAction]);

  // Drop the undo toast if a different timer starts — undoing the previous
  // stop would silently no-op since a timer is already running.
  useEffect(() => {
    if (runningEntry && undoToast && runningEntry.entryId !== undoToast.entryId) {
      setUndoToast(null);
    }
  }, [runningEntry, undoToast]);

  const handleStop = useCallback(async (): Promise<void> => {
    const stopping = runningEntry
      ? { entryId: runningEntry.entryId, activityName: runningEntry.activityName }
      : null;
    await stopActivity();
    if (stopping) setUndoToast(stopping);
  }, [runningEntry, stopActivity]);

  const handleUndoStop = useCallback((): void => {
    if (undoToast) {
      void resumeActivity(undoToast.entryId);
    }
  }, [undoToast, resumeActivity]);

  const handleResumeBanner = useCallback((): void => {
    if (resumableEntry) {
      void resumeActivity(resumableEntry.entryId);
    }
  }, [resumableEntry, resumeActivity]);

  const handleForgottenStop = useCallback(
    async (endedAt: Date): Promise<void> => {
      if (forgottenEntry) {
        await endForgottenEntry(forgottenEntry.entryId, endedAt);
      }
    },
    [forgottenEntry],
  );

  const handleForgottenDiscard = useCallback(async (): Promise<void> => {
    if (forgottenEntry) {
      await deleteEntry(forgottenEntry.entryId);
    }
  }, [forgottenEntry]);

  const handleActivityPress = useCallback(
    async (activityId: string): Promise<void> => {
      if (runningEntry) {
        if (runningEntry.activityId !== activityId) {
          await switchActivity(activityId);
        }
      } else {
        await startActivity(activityId);
      }
    },
    [runningEntry, switchActivity, startActivity],
  );

  const handleStartFromModal = useCallback(
    async (activityId: string, tagIds: string[]): Promise<void> => {
      if (runningEntry) {
        // Switch path: tags are applied after the switch transaction lands.
        // Local SQLite writes serialize, so the new entry exists by the time
        // we read it back.
        await switchActivity(activityId);
        if (tagIds.length > 0) {
          const newEntry = await getRunningEntry();
          if (newEntry) await setEntryTags(newEntry.id, tagIds);
        }
      } else {
        await startActivity(activityId, tagIds);
      }
      setModalVisible(false);
    },
    [runningEntry, switchActivity, startActivity],
  );

  if (isLoading || categoriesLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <HomeHeader totalTrackedSeconds={totalTrackedSeconds} />

        {/* Ring timer hero */}
        <View style={styles.timerCardWrapper}>
          <RingTimerHero
            arcs={arcs}
            nowMinutes={nowMinutes}
            runningEntry={runningEntry}
            onStartPress={() => setModalVisible(true)}
            onStop={handleStop}
          />
        </View>

        {/* Resume affordance — only shown when no timer is running and the
            most recent stop is within the resumable window. */}
        {!runningEntry && resumableEntry && (
          <ResumeBanner
            activityName={resumableEntry.activityName}
            categoryColor={resumableEntry.categoryColor}
            onPress={handleResumeBanner}
          />
        )}

        {/* Suggested for you */}
        <SuggestedRow
          recommendations={recommendations}
          onSelect={handleActivityPress}
        />

        {/* Quick Start grid */}
        <QuickStartGrid
          activities={quickStartActivities}
          activeActivityId={runningEntry?.activityId ?? null}
          onActivityPress={handleActivityPress}
        />

        {/* Weekly streak — current-week progress against weekly goals.
            Renders null when the user has no weekly goals yet. */}
        <WeeklyStreak weekDate={getTodayDate(getCurrentTimezone())} />
      </ScrollView>

      {/* New Session Modal */}
      <NewSessionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onStartActivity={handleStartFromModal}
        categories={categories}
      />

      {/* Forgotten Timer Modal */}
      <ForgottenTimerModal
        entry={forgottenEntry}
        recommendedEndAt={recommendedEndAt}
        onConfirmStop={handleForgottenStop}
        onDismiss={snoozeForgotten}
        onDiscard={handleForgottenDiscard}
      />

      {/* Undo toast for accidental stops */}
      <UndoToast
        message={undoToast ? `Stopped ${undoToast.activityName}` : null}
        actionLabel="Resume"
        actionIcon="rotate-ccw"
        onAction={handleUndoStop}
        onDismiss={() => setUndoToast(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  timerCardWrapper: {
    marginBottom: SPACING["3xl"],
  },
});
