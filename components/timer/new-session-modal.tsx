import { CategoryIcon } from "@/components/common/category-icon";
import { CategoryIconSwatch } from "@/components/insights/category-icon-swatch";
import { GradientButton } from "@/components/common/gradient-button";
import { TagChip } from "@/components/common/tag-chip";
import { TagPicker } from "@/components/common/tag-picker";
import { RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import type { ActivityItem, CategoryWithActivities } from "@/db/models";
import { useTags } from "@/hooks/useTags";
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface NewSessionModalProps {
  visible: boolean;
  onClose: () => void;
  onStartActivity: (activityId: string, tagIds: string[]) => void;
  categories: CategoryWithActivities[];
}

export function NewSessionModal({
  visible,
  onClose,
  onStartActivity,
  categories,
}: NewSessionModalProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const { tags: allTags } = useTags();

  const selectedTags = useMemo(
    () => allTags.filter((t) => selectedTagIds.includes(t.id)),
    [allTags, selectedTagIds],
  );

  // Reset state when modal opens/closes
  const handleClose = useCallback((): void => {
    setSelectedCategoryId(null);
    setSelectedActivityId(null);
    setSearchQuery("");
    setSelectedTagIds([]);
    onClose();
  }, [onClose]);

  const handleStart = useCallback((): void => {
    if (selectedActivityId) {
      onStartActivity(selectedActivityId, selectedTagIds);
      setSelectedCategoryId(null);
      setSelectedActivityId(null);
      setSearchQuery("");
      setSelectedTagIds([]);
    }
  }, [selectedActivityId, selectedTagIds, onStartActivity]);

  const handleCategoryPress = useCallback((categoryId: string): void => {
    setSelectedCategoryId((prev) => (prev === categoryId ? null : categoryId));
    setSelectedActivityId(null);
  }, []);

  // Filter activities based on selected category and search query
  const filteredActivities = useMemo((): ActivityItem[] => {
    const query = searchQuery.toLowerCase().trim();
    const allActivities: ActivityItem[] = [];

    for (const category of categories) {
      if (selectedCategoryId && category.id !== selectedCategoryId) continue;

      for (const activity of category.activities) {
        if (query && !activity.name.toLowerCase().includes(query)) continue;
        allActivities.push(activity);
      }
    }

    return allActivities;
  }, [categories, selectedCategoryId, searchQuery]);

  const renderActivityItem = useCallback(
    ({ item }: { item: ActivityItem }): React.ReactElement => {
      const isSelected = item.id === selectedActivityId;
      return (
        <Pressable
          style={[styles.activityRow, isSelected && styles.activityRowSelected]}
          onPress={() => setSelectedActivityId(item.id)}
        >
          <CategoryIconSwatch
            icon={item.icon}
            color={item.categoryColor}
            size={28}
            iconSize={16}
          />
          <Text style={styles.activityName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text
            style={[styles.activityCategory, { color: item.categoryColor }]}
            numberOfLines={1}
          >
            {item.categoryName}
          </Text>
          {isSelected && (
            <Feather name="check-circle" size={18} color={colors.primary} />
          )}
        </Pressable>
      );
    },
    [selectedActivityId],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.lg }]}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Close */}
          <View style={styles.closeRow}>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={22} color={colors.onSurface} />
            </Pressable>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Feather name="search" size={18} color={colors.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder="What are you working on?"
              placeholderTextColor={colors.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
          </View>

          {/* Category grid — horizontal scroll, single row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
            style={styles.categoryScroll}
          >
            {categories.map((category) => {
              const isSelected = category.id === selectedCategoryId;
              return (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    {
                      backgroundColor: isSelected
                        ? category.color + "26"
                        : category.color + "12",
                    },
                  ]}
                  onPress={() => handleCategoryPress(category.id)}
                >
                  <CategoryIcon
                    icon={category.icon ?? "circle"}
                    size={22}
                    color={category.color}
                  />
                  <Text
                    style={[
                      styles.categoryCardName,
                      { color: category.color },
                    ]}
                    numberOfLines={1}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Activities list */}
          <View style={styles.activitiesHeader}>
            <Text style={styles.sectionLabel}>
              {selectedCategoryId ? "Activities" : "Top Activities"}
            </Text>
            {selectedCategoryId && (
              <Pressable onPress={() => setSelectedCategoryId(null)}>
                <Text style={styles.viewAllText}>View All</Text>
              </Pressable>
            )}
          </View>

          <FlatList
            data={filteredActivities}
            keyExtractor={(item) => item.id}
            renderItem={renderActivityItem}
            style={styles.activityList}
            contentContainerStyle={styles.activityListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />

          {/* Tags affordance */}
          <Pressable
            style={styles.tagsRow}
            onPress={() => setTagPickerOpen(true)}
          >
            <Feather name="tag" size={14} color={colors.onSurfaceVariant} />
            {selectedTags.length === 0 ? (
              <Text style={styles.tagsPlaceholder}>Add tags (optional)</Text>
            ) : (
              <View style={styles.tagChipsRow}>
                {selectedTags.map((t) => (
                  <TagChip key={t.id} name={t.name} color={t.color} />
                ))}
              </View>
            )}
            <Feather
              name="chevron-right"
              size={16}
              color={colors.onSurfaceVariant}
            />
          </Pressable>

          {/* Start button */}
          <GradientButton
            shape="pill"
            label="Start Activity"
            onPress={handleStart}
            disabled={!selectedActivityId}
          >
            <Feather name="play" size={18} color={colors.onPrimary} />
          </GradientButton>
        </View>

        <TagPicker
          visible={tagPickerOpen}
          initialSelectedIds={selectedTagIds}
          onClose={() => setTagPickerOpen(false)}
          onConfirm={setSelectedTagIds}
        />
      </View>
    </Modal>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: c.surfaceContainerLowest,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: SPACING["2xl"],
    paddingTop: SPACING.md,
    height: "85%",
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.outlineVariant,
    alignSelf: "center",
    marginBottom: SPACING.lg,
  },
  closeRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: SPACING.lg,
  },
  closeButton: {
    padding: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: c.surfaceContainerLow,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: c.surfaceContainerLow,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING["2xl"],
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: c.onSurface,
    padding: 0,
  },
  sectionLabel: {
    ...TYPOGRAPHY.labelUppercase,
    color: c.onSurfaceVariant,
    marginBottom: SPACING.md,
  },
  categoryScroll: {
    flexGrow: 0,
    marginBottom: SPACING["2xl"],
  },
  categoryScrollContent: {
    gap: SPACING.md,
  },
  categoryCard: {
    width: 160,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: c.surfaceContainerLow,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  categoryCardSelected: {
    backgroundColor: c.surfaceContainerHigh,
  },
  categoryCardName: {
    ...TYPOGRAPHY.titleMd,
    color: c.onSurface,
    flexShrink: 1,
  },
  categoryCardNameSelected: {
    color: c.primary,
  },
  activitiesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  viewAllText: {
    ...TYPOGRAPHY.labelUppercase,
    color: c.primary,
  },
  activityList: {
    flex: 1,
    marginBottom: SPACING.lg,
  },
  activityListContent: {
    gap: SPACING.sm,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: c.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  activityRowSelected: {
    backgroundColor: c.surfaceContainerHigh,
  },
  activityName: {
    flex: 6,
    ...TYPOGRAPHY.titleMd,
    color: c.onSurface,
  },
  activityCategory: {
    flex: 4,
    ...TYPOGRAPHY.bodySmall,
    textAlign: "right",
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: c.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  tagsPlaceholder: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: c.onSurfaceVariant,
  },
  tagChipsRow: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  });
}
