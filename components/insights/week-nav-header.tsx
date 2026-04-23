import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { getCurrentTimezone, getTodayDate } from '@/lib/timezone';

interface WeekNavHeaderProps {
  selectedDate: string; // YYYY-MM-DD — any day in the target week
  onDateChange: (date: string) => void;
}

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-CA');
}

function getMondayOfWeek(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  const dow = date.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString('en-CA');
}

function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function WeekNavHeader({ selectedDate, onDateChange }: WeekNavHeaderProps): React.ReactElement {
  const mondayOfSelected = getMondayOfWeek(selectedDate);
  const sundayOfSelected = addDays(mondayOfSelected, 6);
  const mondayOfToday = getMondayOfWeek(getTodayDate(getCurrentTimezone()));
  const isCurrentWeek = mondayOfSelected >= mondayOfToday;

  const label = `${formatShortDate(mondayOfSelected)} – ${formatShortDate(sundayOfSelected)}`;

  const goBack = useCallback(() => {
    onDateChange(addDays(selectedDate, -7));
  }, [selectedDate, onDateChange]);

  const goForward = useCallback(() => {
    if (!isCurrentWeek) onDateChange(addDays(selectedDate, 7));
  }, [selectedDate, onDateChange, isCurrentWeek]);

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.label}>Week</Text>
        <Text style={styles.weekRange}>{label}</Text>
      </View>
      <View style={styles.arrowPill}>
        <Pressable
          onPress={goBack}
          style={({ pressed }) => [styles.arrowButton, pressed && styles.arrowPressed]}
        >
          <Feather name="chevron-left" size={20} color={COLORS.primary} />
        </Pressable>
        <Pressable
          onPress={goForward}
          disabled={isCurrentWeek}
          style={({ pressed }) => [
            styles.arrowButton,
            isCurrentWeek && styles.arrowDisabled,
            pressed && !isCurrentWeek && styles.arrowPressed,
          ]}
        >
          <Feather name="chevron-right" size={20} color={isCurrentWeek ? COLORS.outlineVariant : COLORS.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.labelUppercase,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.xs,
  },
  weekRange: {
    ...TYPOGRAPHY.headingXl,
    color: COLORS.onSurface,
  },
  arrowPill: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceContainerLow,
    padding: 4,
    borderRadius: RADIUS.full,
  },
  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowPressed: {
    backgroundColor: COLORS.surfaceContainer,
  },
  arrowDisabled: {
    opacity: 0.4,
  },
});
