import { ForgottenTimerModal } from "@/components/timer/forgotten-timer-modal";
import { HomeHeader } from "@/components/home/home-header";
import { ResumeBanner } from "@/components/home/resume-banner";
import { RingTimerHero } from "@/components/home/ring-timer-hero";
import { QuickStartGrid } from "@/components/home/quick-start-grid";
import { SuggestedRow } from "@/components/home/suggested-row";
import { WeeklyStreak } from "@/components/home/weekly-streak";
import { ReviewPromptModal } from "@/components/common/review-prompt-modal";
import { UndoToast } from "@/components/common/undo-toast";
import { SPACING, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import {
  endForgottenEntry,
  deleteEntry,
  getRunningEntry,
  setEntryTags,
} from "@/db/queries";
import { useTimer } from "@/hooks/useTimer";
import { useForgottenTimer } from "@/hooks/useForgottenTimer";
import { useResumableEntry } from "@/hooks/useResumableEntry";
import { useCategoriesByUsage } from "@/hooks/useCategoriesByUsage";
import { useQuickStartActivities } from "@/hooks/useQuickStartActivities";
import { useRecommendedActivity } from "@/hooks/useRecommendedActivity";
import { useTodayClockArcs } from "@/hooks/useTodayClockArcs";
import { sendFeedback } from "@/lib/feedback";
import {
  recordReviewPromptOutcome,
  requestStoreReview,
  shouldShowReviewPrompt,
} from "@/lib/review-prompt";
import { getCurrentTimezone, getTodayDate } from "@/lib/timezone";
import { NewSessionModal } from "@/components/timer/new-session-modal";
import { useUIStore } from "@/store/uiStore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MODAL_DISMISS_DELAY_MS = 450;

export default function HomeScreen(): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { t } = useTranslation();
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
    useCategoriesByUsage();
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
  const [reviewPromptVisible, setReviewPromptVisible] = useState(false);
  // Set after a stop when the user qualifies for the review prompt; the
  // sheet opens once the undo toast is gone so it never covers "Resume".
  const reviewPromptPending = useRef(false);
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
      reviewPromptPending.current = false;
      setUndoToast(null);
    }
  }, [runningEntry, undoToast]);

  const handleStop = useCallback(async (): Promise<void> => {
    const stopping = runningEntry
      ? { entryId: runningEntry.entryId, activityName: runningEntry.activityName }
      : null;
    await stopActivity();
    if (stopping) {
      setUndoToast(stopping);
      reviewPromptPending.current = await shouldShowReviewPrompt();
    }
  }, [runningEntry, stopActivity]);

  const handleUndoStop = useCallback((): void => {
    reviewPromptPending.current = false;
    if (undoToast) {
      void resumeActivity(undoToast.entryId);
    }
  }, [undoToast, resumeActivity]);

  const handleUndoToastDismiss = useCallback((): void => {
    setUndoToast(null);
    if (reviewPromptPending.current) {
      reviewPromptPending.current = false;
      if (!modalVisible && !forgottenEntry) setReviewPromptVisible(true);
    }
  }, [modalVisible, forgottenEntry]);

  const handleReviewEnjoying = useCallback((): void => {
    setReviewPromptVisible(false);
    void recordReviewPromptOutcome("rated");
    // Let the sheet finish sliding out — iOS won't present the native review
    // sheet or mail composer over a Modal that is still dismissing.
    setTimeout(() => void requestStoreReview(), MODAL_DISMISS_DELAY_MS);
  }, []);

  const handleReviewNotEnjoying = useCallback((): void => {
    setReviewPromptVisible(false);
    void recordReviewPromptOutcome("declined");
    setTimeout(() => void sendFeedback("feature"), MODAL_DISMISS_DELAY_MS);
  }, []);

  const handleReviewDismiss = useCallback((): void => {
    setReviewPromptVisible(false);
    void recordReviewPromptOutcome("dismissed");
  }, []);

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
          <ActivityIndicator size="large" color={colors.primary} />
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
        message={
          undoToast
            ? t("home.stoppedToast", { activity: undoToast.activityName })
            : null
        }
        actionLabel={t("home.resume")}
        actionIcon="rotate-ccw"
        onAction={handleUndoStop}
        onDismiss={handleUndoToastDismiss}
      />

      <ReviewPromptModal
        visible={reviewPromptVisible}
        onEnjoying={handleReviewEnjoying}
        onNotEnjoying={handleReviewNotEnjoying}
        onDismiss={handleReviewDismiss}
      />
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.surface,
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
}
