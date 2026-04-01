import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateHeader } from '@/components/timeline/date-header';
import { WeekStrip } from '@/components/timeline/week-strip';
import { TimelineCanvas } from '@/components/timeline/timeline-canvas';
import { useTimelineData } from '@/hooks/useTimelineData';
import { useUIStore } from '@/store/uiStore';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/theme';

export default function TimelineScreen(): React.ReactElement {
  const selectedDate = useUIStore((s) => s.selectedDate);
  const setSelectedDate = useUIStore((s) => s.setSelectedDate);
  const { items, isLoading, rangeStartMinutes, rangeEndMinutes, timezone } =
    useTimelineData(selectedDate);

  const handleEntryPress = useCallback((entryId: string) => {
    // TODO: open EntryDetailModal
    console.log('Entry pressed:', entryId);
  }, []);

  const handleGapPress = useCallback((startedAt: Date, endedAt: Date) => {
    // TODO: open GapFillModal
    console.log('Gap pressed:', startedAt.toISOString(), endedAt.toISOString());
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <DateHeader selectedDate={selectedDate} onDateChange={setSelectedDate} />
      <WeekStrip selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={COLORS.primary} />
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No activity</Text>
          <Text style={styles.emptySubtitle}>
            Start a timer on the Focus tab to see entries here.
          </Text>
        </View>
      ) : (
        <TimelineCanvas
          items={items}
          rangeStartMinutes={rangeStartMinutes}
          rangeEndMinutes={rangeEndMinutes}
          timezone={timezone}
          selectedDate={selectedDate}
          onEntryPress={handleEntryPress}
          onGapPress={handleGapPress}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  loader: {
    marginTop: SPACING['3xl'],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: SPACING['5xl'],
  },
  emptyTitle: {
    ...TYPOGRAPHY.heading,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.outlineVariant,
    textAlign: 'center',
    paddingHorizontal: SPACING['3xl'],
  },
});
