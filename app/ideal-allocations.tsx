import { Feather } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CategoryIcon } from "@/components/common/category-icon";
import { GoalEditorModal } from "@/components/ideal-allocations/goal-editor-modal";
import { RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import type { CategoryWithActivities } from "@/db/models";
import { useAllCategoryGoalSummaries } from "@/hooks/useAllCategoryGoalSummaries";
import { useCategoriesWithActivities } from "@/hooks/useCategoriesWithActivities";

export default function IdealAllocationsScreen(): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { categories, isLoading: categoriesLoading } =
    useCategoriesWithActivities();
  const { summariesByCategory, isLoading: summariesLoading } =
    useAllCategoryGoalSummaries();
  const [editing, setEditing] = useState<CategoryWithActivities | null>(null);

  const handleCategoryPress = useCallback((category: CategoryWithActivities) => {
    setEditing(category);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setEditing(null);
  }, []);

  const isLoading = categoriesLoading || summariesLoading;

  const renderCategory = useCallback(
    ({ item }: { item: CategoryWithActivities }): React.ReactElement => {
      const summary =
        summariesByCategory.get(item.id) ?? {
          label: t("idealAllocations.notSet"),
          hasGoal: false,
        };
      return (
        <Pressable
          style={({ pressed }) => [
            styles.row,
            pressed && styles.rowPressed,
          ]}
          onPress={() => handleCategoryPress(item)}
        >
          <View
            style={[styles.iconBubble, { backgroundColor: item.color + "1F" }]}
          >
            <CategoryIcon
              icon={item.icon ?? "circle"}
              size={20}
              color={item.color}
            />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <Text
              style={[
                styles.rowSummary,
                !summary.hasGoal && styles.rowSummaryMuted,
              ]}
              numberOfLines={1}
            >
              {summary.label}
            </Text>
          </View>
          <Feather
            name="chevron-right"
            size={20}
            color={colors.onSurfaceVariant}
          />
        </Pressable>
      );
    },
    [summariesByCategory, handleCategoryPress, styles, colors.onSurfaceVariant, t],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Stack.Screen options={{ title: t("idealAllocations.title") }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: t("idealAllocations.title") }} />

      <View style={styles.header}>
        <Text style={styles.title}>{t("idealAllocations.title")}</Text>
        <Text style={styles.subtitle}>{t("idealAllocations.subtitle")}</Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t("manageCategories.empty")}</Text>
            <Text style={styles.emptySubtitle}>
              {t("idealAllocations.emptyBody")}
            </Text>
          </View>
        }
      />

      <GoalEditorModal
        visible={editing !== null}
        category={editing}
        onClose={handleCloseEditor}
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
    header: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.lg,
      gap: SPACING.xs,
    },
    title: {
      ...TYPOGRAPHY.headingXl,
      color: c.onSurface,
    },
    subtitle: {
      ...TYPOGRAPHY.body,
      color: c.onSurfaceVariant,
    },
    listContent: {
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING["4xl"],
      gap: SPACING.sm,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: RADIUS.lg,
      backgroundColor: c.surfaceContainerLow,
    },
    rowPressed: {
      backgroundColor: c.surfaceContainer,
    },
    iconBubble: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    rowText: {
      flex: 1,
      gap: 2,
    },
    rowTitle: {
      ...TYPOGRAPHY.titleMd,
      color: c.onSurface,
    },
    rowSummary: {
      ...TYPOGRAPHY.bodySmall,
      color: c.onSurface,
    },
    rowSummaryMuted: {
      color: c.onSurfaceVariant,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: SPACING["4xl"],
      gap: SPACING.sm,
    },
    emptyTitle: {
      ...TYPOGRAPHY.heading,
      color: c.onSurface,
    },
    emptySubtitle: {
      ...TYPOGRAPHY.body,
      color: c.onSurfaceVariant,
      textAlign: "center",
    },
  });
}
