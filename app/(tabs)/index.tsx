import { TimerCard } from "@/components/timer/timer-card";
import { QuickSwitchSection } from "@/components/timer/quick-switch-section";
import { COLORS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import { useTimer } from "@/hooks/useTimer";
import { useCategoriesWithActivities } from "@/hooks/useCategoriesWithActivities";
import { NewSessionModal } from "@/components/timer/new-session-modal";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
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
  const [modalVisible, setModalVisible] = useState(false);

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
    async (activityId: string): Promise<void> => {
      if (runningEntry) {
        await switchActivity(activityId);
      } else {
        await startActivity(activityId);
      }
      setModalVisible(false);
    },
    [runningEntry, switchActivity, startActivity],
  );

  if (isLoading || categoriesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Chronometer</Text>

        {/* Timer Card */}
        <View style={styles.timerCardWrapper}>
          <TimerCard
            runningEntry={runningEntry}
            onStop={stopActivity}
            onStartPress={() => setModalVisible(true)}
          />
        </View>

        {/* Quick Switch Carousel */}
        <QuickSwitchSection
          categories={categories}
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
  title: {
    ...TYPOGRAPHY.headingXl,
    color: COLORS.onSurface,
    marginBottom: SPACING["2xl"],
  },
  timerCardWrapper: {
    marginBottom: SPACING["3xl"],
  },
});
