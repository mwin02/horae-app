import { StyleSheet, Pressable, ScrollView, ActivityIndicator, View, Text } from 'react-native';
import { useQuery } from '@powersync/react';
import { useTimer } from '@/hooks/useTimer';
import { formatTimerDisplay } from '@/lib/timezone';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import { GlassCard } from '@/components/common/glass-card';
import { GradientButton } from '@/components/common/gradient-button';
import { CategoryChip } from '@/components/common/category-chip';
import { CategoryIcon } from '@/components/common/category-icon';
import { PulsingDots } from '@/components/common/pulsing-dots';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ActivityRow {
  id: string;
  name: string;
  category_name: string;
  category_color: string;
  category_icon: string;
}

const ACTIVITIES_QUERY = `
  SELECT
    a.id,
    a.name,
    c.name AS category_name,
    c.color AS category_color,
    c.icon AS category_icon
  FROM activities a
  JOIN categories c ON c.id = a.category_id
  WHERE a.is_archived = 0 AND a.deleted_at IS NULL
    AND c.is_archived = 0 AND c.deleted_at IS NULL
  ORDER BY c.sort_order, a.sort_order, a.name
`;

export default function HomeScreen(): React.ReactElement {
  const { runningEntry, isLoading, startActivity, stopActivity, switchActivity } = useTimer();
  const { data: activities } = useQuery<ActivityRow>(ACTIVITIES_QUERY);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.title}>Chronometer</Text>

        {/* Timer Card — Active State */}
        {runningEntry ? (
          <GlassCard style={styles.timerCard}>
            <Text style={styles.sessionLabel}>Current Session</Text>
            <Text style={styles.activityName}>{runningEntry.activityName}</Text>
            <CategoryChip name={runningEntry.categoryName} color={runningEntry.categoryColor} />
            <Text style={styles.timerDisplay}>
              {formatTimerDisplay(runningEntry.elapsedSeconds)}
            </Text>
            <PulsingDots />
            <View style={styles.stopButtonRow}>
              <GradientButton shape="circle" size={80} onPress={stopActivity}>
                <View style={styles.stopIcon} />
              </GradientButton>
            </View>
          </GlassCard>
        ) : (
          /* Timer Card — Idle State */
          <GlassCard style={styles.timerCard}>
            <View style={styles.idleContent}>
              <CategoryIcon icon="moon" size={32} color={COLORS.onSurfaceVariant} />
              <Text style={styles.idleTitle}>No timer running</Text>
              <Text style={styles.idleSubtitle}>Tap an activity below to start</Text>
            </View>
          </GlassCard>
        )}

        {/* Component Showcase: Category Chips */}
        <Text style={styles.sectionTitle}>Category Chips</Text>
        <View style={styles.chipRow}>
          <CategoryChip name="Work" color="#4A90D9" />
          <CategoryChip name="Health" color="#E74C3C" />
          <CategoryChip name="Sleep" color="#8E44AD" />
          <CategoryChip name="Social" color="#E91E63" />
        </View>

        {/* Component Showcase: Category Icons */}
        <Text style={styles.sectionTitle}>Category Icons</Text>
        <View style={styles.iconRow}>
          {['briefcase', 'heart', 'moon', 'utensils', 'users', 'book', 'gamepad', 'spa', 'home', 'plane'].map(
            (icon) => (
              <View key={icon} style={styles.iconBox}>
                <CategoryIcon icon={icon} size={24} color={COLORS.primary} />
                <Text style={styles.iconLabel}>{icon}</Text>
              </View>
            ),
          )}
        </View>

        {/* Component Showcase: Gradient Buttons */}
        <Text style={styles.sectionTitle}>Gradient Buttons</Text>
        <View style={styles.buttonRow}>
          <GradientButton
            shape="pill"
            label="Start Activity"
            onPress={() => {
              // placeholder
            }}
          />
        </View>
        <View style={styles.buttonRow}>
          <GradientButton
            shape="circle"
            size={80}
            onPress={() => {
              // placeholder
            }}
          >
            <View style={styles.stopIcon} />
          </GradientButton>
        </View>

        {/* Activity List (still functional for testing timer) */}
        <Text style={styles.sectionTitle}>Activities</Text>
        {activities.map((activity) => (
          <Pressable
            key={activity.id}
            style={[
              styles.activityRow,
              runningEntry?.activityId === activity.id && styles.activityRowActive,
            ]}
            onPress={() => {
              if (runningEntry) {
                if (runningEntry.activityId !== activity.id) {
                  switchActivity(activity.id);
                }
              } else {
                startActivity(activity.id);
              }
            }}
          >
            <CategoryIcon icon={activity.category_icon} size={18} color={activity.category_color} />
            <View style={styles.activityText}>
              <Text style={styles.activityRowName}>{activity.name}</Text>
              <Text style={[styles.activityCategoryName, { color: activity.category_color }]}>
                {activity.category_name}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  title: {
    ...TYPOGRAPHY.headingXl,
    color: COLORS.onSurface,
    marginBottom: SPACING['2xl'],
  },
  timerCard: {
    marginBottom: SPACING['3xl'],
  },
  sessionLabel: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  activityName: {
    ...TYPOGRAPHY.headingXl,
    color: COLORS.onSurface,
    marginBottom: SPACING.md,
  },
  timerDisplay: {
    ...TYPOGRAPHY.timerDisplay,
    color: COLORS.onSurface,
    textAlign: 'center',
    marginTop: SPACING['3xl'],
  },
  stopButtonRow: {
    alignItems: 'center',
    marginTop: SPACING['2xl'],
  },
  stopIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  idleContent: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING['2xl'],
  },
  idleTitle: {
    ...TYPOGRAPHY.heading,
    color: COLORS.onSurface,
  },
  idleSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurfaceVariant,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading,
    color: COLORS.onSurface,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  iconBox: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  iconLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  buttonRow: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
  },
  activityRowActive: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  activityText: {
    flex: 1,
  },
  activityRowName: {
    ...TYPOGRAPHY.titleMd,
    color: COLORS.onSurface,
  },
  activityCategoryName: {
    ...TYPOGRAPHY.bodySmall,
    marginTop: 2,
  },
});
