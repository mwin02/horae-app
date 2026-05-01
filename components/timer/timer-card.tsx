import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { RecommendedActivity, RunningTimer } from '@/db/models';
import { formatTimerDisplay } from '@/lib/timezone';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';
import { GlassCard } from '@/components/common/glass-card';
import { CategoryChip } from '@/components/common/category-chip';
import { PulsingDots } from '@/components/common/pulsing-dots';
import { GradientButton } from '@/components/common/gradient-button';
import { StopButton } from '@/components/timer/stop-button';

interface TimerCardProps {
  runningEntry: RunningTimer | null;
  recommendations: RecommendedActivity[];
  onStop: () => void;
  onStartPress: () => void;
  onRecommendationPress: (activityId: string) => void;
}

export function TimerCard({
  runningEntry,
  recommendations,
  onStop,
  onStartPress,
  onRecommendationPress,
}: TimerCardProps): React.ReactElement {
  const isActive = runningEntry !== null;
  const [pageWidth, setPageWidth] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const totalPages = recommendations.length + 1; // +1 for the generic CTA page
  const showDots = !isActive && totalPages > 1 && pageWidth > 0;

  const handleMomentumEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>,
  ): void => {
    if (pageWidth <= 0) return;
    const idx = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    setPageIndex(idx);
  };

  return (
    <GlassCard>
      <View style={styles.wrapper}>
        {/* Active state — always in flow to define the card height */}
        <View
          style={{ opacity: isActive ? 1 : 0 }}
          pointerEvents={isActive ? 'auto' : 'none'}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.sessionLabel}>Current Session</Text>
              <Text style={styles.activityName} numberOfLines={1}>
                {runningEntry?.activityName ?? ' '}
              </Text>
            </View>
            <CategoryChip
              name={runningEntry?.categoryName ?? ' '}
              color={runningEntry?.categoryColor ?? COLORS.onSurfaceVariant}
            />
          </View>

          <View style={styles.timerSection}>
            <Text style={styles.timerDisplay}>
              {formatTimerDisplay(runningEntry?.elapsedSeconds ?? 0)}
            </Text>
            <PulsingDots />
          </View>

          <View style={styles.stopRow}>
            <StopButton onPress={onStop} />
          </View>
        </View>

        {/* Idle state — absolute overlay, paged carousel */}
        {!isActive && (
          <View
            style={styles.idleOverlay}
            pointerEvents="auto"
            onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}
          >
            {pageWidth > 0 && (
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleMomentumEnd}
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
              >
                {recommendations.map((rec) => (
                  <View
                    key={rec.activityId}
                    style={[styles.page, { width: pageWidth }]}
                  >
                    <Text style={styles.suggestedLabel}>Suggested for you</Text>
                    <Text style={styles.recommendedName} numberOfLines={1}>
                      {rec.activityName}
                    </Text>
                    <CategoryChip
                      name={rec.categoryName}
                      color={rec.categoryColor}
                    />
                    <GradientButton
                      shape="pill"
                      label={`Start ${rec.activityName}`}
                      onPress={() => onRecommendationPress(rec.activityId)}
                      style={styles.startButton}
                    >
                      <Feather name="play" size={18} color={COLORS.onPrimary} />
                    </GradientButton>
                  </View>
                ))}

                <View style={[styles.page, { width: pageWidth }]}>
                  <Feather
                    name="clock"
                    size={40}
                    color={COLORS.onSurfaceVariant}
                  />
                  <Text style={styles.idleTitle}>Ready to focus?</Text>
                  <Text style={styles.idleSubtitle}>
                    Start tracking your time
                  </Text>
                  <GradientButton
                    shape="pill"
                    label="Start Activity"
                    onPress={onStartPress}
                    style={styles.startButton}
                  >
                    <Feather name="play" size={18} color={COLORS.onPrimary} />
                  </GradientButton>
                </View>
              </ScrollView>
            )}

            {showDots && (
              <View style={styles.dotsRow} pointerEvents="none">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === pageIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING['3xl'],
  },
  headerLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },
  sessionLabel: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  activityName: {
    ...TYPOGRAPHY.headingXl,
    color: COLORS.onSurface,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  timerDisplay: {
    ...TYPOGRAPHY.timerDisplay,
    color: COLORS.onSurface,
  },
  stopRow: {
    alignItems: 'center',
  },
  idleOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'stretch',
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  idleTitle: {
    ...TYPOGRAPHY.heading,
    color: COLORS.onSurface,
    marginTop: SPACING.sm,
  },
  idleSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurfaceVariant,
  },
  startButton: {
    marginTop: SPACING.lg,
    alignSelf: 'stretch',
    marginHorizontal: SPACING.lg,
  },
  suggestedLabel: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  recommendedName: {
    ...TYPOGRAPHY.headingXl,
    color: COLORS.onSurface,
    textAlign: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: SPACING.lg,
  },
  dotsRow: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.onSurfaceVariant,
    opacity: 0.3,
  },
  dotActive: {
    opacity: 1,
    backgroundColor: COLORS.primary,
  },
});
