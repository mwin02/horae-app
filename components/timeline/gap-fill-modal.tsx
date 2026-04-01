import { CategoryChip } from "@/components/common/category-chip";
import { GradientButton } from "@/components/common/gradient-button";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import { createRetroactiveEntry } from "@/db/queries";
import {
  useCategoriesWithActivities,
} from "@/hooks/useCategoriesWithActivities";
import {
  formatDuration,
  formatTimeInTimezone,
  getCurrentTimezone,
} from "@/lib/timezone";
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface GapFillModalProps {
  gap: { startedAt: Date; endedAt: Date } | null;
  onClose: () => void;
}

export function GapFillModal({
  gap,
  onClose,
}: GapFillModalProps): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const { categories } = useCategoriesWithActivities();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const timezone = getCurrentTimezone();

  const filteredActivities = useMemo(() => {
    if (!selectedCategoryId) {
      return categories.flatMap((c) => c.activities);
    }
    const category = categories.find((c) => c.id === selectedCategoryId);
    return category?.activities ?? [];
  }, [categories, selectedCategoryId]);

  const handleSelectActivity = useCallback(
    async (activityId: string): Promise<void> => {
      if (!gap || saving) return;
      setSaving(true);
      try {
        await createRetroactiveEntry({
          activityId,
          startedAt: gap.startedAt,
          endedAt: gap.endedAt,
          timezone,
        });
        onClose();
      } finally {
        setSaving(false);
      }
    },
    [gap, timezone, onClose, saving],
  );

  if (!gap) return null;

  const durationSeconds = Math.round(
    (gap.endedAt.getTime() - gap.startedAt.getTime()) / 1000,
  );
  const startLabel = formatTimeInTimezone(gap.startedAt.toISOString(), timezone);
  const endLabel = formatTimeInTimezone(gap.endedAt.toISOString(), timezone);

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.lg }]}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Fill Gap</Text>
              <Text style={styles.headerSubtitle}>
                What were you doing?
              </Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={8}
            >
              <Feather name="x" size={20} color={COLORS.onSurfaceVariant} />
            </Pressable>
          </View>

          {/* Gap time info */}
          <View style={styles.timeCard}>
            <View style={styles.timeRow}>
              <Feather name="clock" size={14} color={COLORS.onSurfaceVariant} />
              <Text style={styles.timeText}>
                {startLabel} – {endLabel}
              </Text>
              <Text style={styles.durationText}>
                {formatDuration(durationSeconds)}
              </Text>
            </View>
          </View>

          {/* Category filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            <Pressable
              style={[
                styles.filterChip,
                !selectedCategoryId && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategoryId(null)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  !selectedCategoryId && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </Pressable>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() =>
                  setSelectedCategoryId(
                    cat.id === selectedCategoryId ? null : cat.id,
                  )
                }
                style={
                  cat.id === selectedCategoryId
                    ? styles.selectedChipWrapper
                    : undefined
                }
              >
                <CategoryChip name={cat.name} color={cat.color} />
              </Pressable>
            ))}
          </ScrollView>

          {/* Activity list */}
          <FlatList
            data={filteredActivities}
            keyExtractor={(item) => item.id}
            style={styles.activityList}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.activityRow,
                  pressed && styles.activityRowPressed,
                ]}
                onPress={() => handleSelectActivity(item.id)}
                disabled={saving}
              >
                <View
                  style={[
                    styles.activityDot,
                    { backgroundColor: item.categoryColor },
                  ]}
                />
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName}>{item.name}</Text>
                  <Text style={styles.activityCategory}>
                    {item.categoryName}
                  </Text>
                </View>
                <Feather
                  name="plus"
                  size={18}
                  color={COLORS.onSurfaceVariant}
                />
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No activities found</Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: SPACING["2xl"],
    paddingTop: SPACING.md,
    maxHeight: "80%",
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.outlineVariant,
    alignSelf: "center",
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING["2xl"],
  },
  headerTitle: {
    ...TYPOGRAPHY.headingXl,
    color: COLORS.onSurface,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.labelUppercase,
    color: COLORS.onSurfaceVariant,
    marginTop: SPACING.xs,
  },
  closeButton: {
    padding: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  timeCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  timeText: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurfaceVariant,
    flex: 1,
  },
  durationText: {
    ...TYPOGRAPHY.titleMd,
    color: COLORS.onSurface,
  },
  categoryRow: {
    gap: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: COLORS.onPrimary,
  },
  selectedChipWrapper: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  activityList: {
    maxHeight: 300,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  activityRowPressed: {
    backgroundColor: COLORS.surfaceContainerLow,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    ...TYPOGRAPHY.titleMd,
    color: COLORS.onSurface,
  },
  activityCategory: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.outlineVariant,
    textAlign: "center",
    paddingVertical: SPACING["3xl"],
  },
});
