import { ForgottenTimerModal } from "@/components/timer/forgotten-timer-modal";
import { HomeHeader } from "@/components/home/home-header";
import { RingTimerHero } from "@/components/home/ring-timer-hero";
import { QuickStartGrid } from "@/components/home/quick-start-grid";
import { SuggestedRow } from "@/components/home/suggested-row";
import { COLORS, SPACING } from "@/constants/theme";
import {
  endForgottenEntry,
  deleteEntry,
  getRunningEntry,
  setEntryTags,
} from "@/db/queries";
import { useTimer } from "@/hooks/useTimer";
import { useForgottenTimer } from "@/hooks/useForgottenTimer";
import { useCategoriesWithActivities } from "@/hooks/useCategoriesWithActivities";
import { useQuickStartActivities } from "@/hooks/useQuickStartActivities";
import { useRecommendedActivity } from "@/hooks/useRecommendedActivity";
import { useTodayClockArcs } from "@/hooks/useTodayClockArcs";
import { NewSessionModal } from "@/components/timer/new-session-modal";
import React, { useCallback, useState } from "react";
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
  } = useTimer();
  const { categories, isLoading: categoriesLoading } =
    useCategoriesWithActivities();
  const { activities: quickStartActivities } = useQuickStartActivities();
  const { recommendations } = useRecommendedActivity();
  const { arcs, nowMinutes, totalTrackedSeconds } = useTodayClockArcs();
  const { forgottenEntry, dismissForgotten } = useForgottenTimer();
  const [modalVisible, setModalVisible] = useState(false);

  const handleForgottenStop = useCallback(
    async (endedAt: Date): Promise<void> => {
      if (forgottenEntry) {
        await endForgottenEntry(forgottenEntry.entryId, endedAt);
        dismissForgotten();
      }
    },
    [forgottenEntry, dismissForgotten],
  );

  const handleForgottenDiscard = useCallback(async (): Promise<void> => {
    if (forgottenEntry) {
      await deleteEntry(forgottenEntry.entryId);
      dismissForgotten();
    }
  }, [forgottenEntry, dismissForgotten]);

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
            onStop={stopActivity}
          />
        </View>

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
        onConfirmStop={handleForgottenStop}
        onDismiss={dismissForgotten}
        onDiscard={handleForgottenDiscard}
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
