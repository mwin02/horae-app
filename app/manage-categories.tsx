import { Feather } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EditCategoryModal } from "@/components/category/edit-category-modal";
import { GradientButton } from "@/components/common/gradient-button";
import { ManageCategoryRow } from "@/components/manage/manage-category-row";
import { MAX_CATEGORIES } from "@/constants/presets";
import { SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import type { CategoryWithActivities } from "@/db/models";
import { archiveCategory } from "@/db/queries";
import { useCategoriesWithActivities } from "@/hooks/useCategoriesWithActivities";

export default function ManageCategoriesScreen(): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { categories, isLoading } = useCategoriesWithActivities();
  const [editing, setEditing] = useState<CategoryWithActivities | null>(null);
  const [creating, setCreating] = useState(false);

  // Active categories drive the cap; `categories` from the hook is already
  // filtered to active rows, so its length is the live count.
  const atLimit = categories.length >= MAX_CATEGORIES;
  const nextSortOrder = useMemo(
    () => categories.reduce((max, c) => Math.max(max, c.sortOrder), -1) + 1,
    [categories],
  );

  const handleEdit = useCallback((category: CategoryWithActivities): void => {
    setEditing(category);
  }, []);

  const handleDelete = useCallback((category: CategoryWithActivities): void => {
    const activeCount = category.activities.length;
    if (activeCount > 0) {
      Alert.alert(
        t("manageCategories.hasActivitiesTitle"),
        t("manageCategories.hasActivitiesBody", {
          name: category.name,
          count: activeCount,
        }),
      );
      return;
    }
    Alert.alert(
      t("manageCategories.removeTitle", { name: category.name }),
      t("manageCategories.removeBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.remove"),
          style: "destructive",
          onPress: async () => {
            try {
              await archiveCategory(category.id);
            } catch (err) {
              console.error("Failed to remove category", err);
            }
          },
        },
      ],
    );
  }, [t]);

  const closeModal = useCallback((): void => {
    setEditing(null);
    setCreating(false);
  }, []);

  const renderRow = useCallback(
    ({ item }: { item: CategoryWithActivities }): React.ReactElement => (
      <ManageCategoryRow
        category={item}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    ),
    [handleEdit, handleDelete],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Stack.Screen options={{ title: t("manageCategories.title") }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: t("manageCategories.title") }} />

      <View style={styles.header}>
        <Text style={styles.title}>{t("manageCategories.title")}</Text>
        <Text style={styles.headerSubtitle}>
          {t("manageCategories.count", {
            count: categories.length,
            max: MAX_CATEGORIES,
          })}
        </Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          atLimit ? (
            <Text style={styles.limitNote}>
              {t("manageCategories.limitNote", { max: MAX_CATEGORIES })}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t("manageCategories.empty")}</Text>
          </View>
        }
      />

      {!atLimit && (
        <View style={styles.fabWrapper} pointerEvents="box-none">
          <GradientButton
            shape="circle"
            size={60}
            onPress={() => setCreating(true)}
          >
            <Feather name="plus" size={28} color={colors.onPrimary} />
          </GradientButton>
        </View>
      )}

      <EditCategoryModal
        visible={editing !== null || creating}
        onClose={closeModal}
        category={editing}
        nextSortOrder={nextSortOrder}
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
    },
    title: {
      ...TYPOGRAPHY.headingXl,
      color: c.onSurface,
    },
    headerSubtitle: {
      ...TYPOGRAPHY.bodySmall,
      color: c.onSurfaceVariant,
      marginTop: SPACING.xs,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING["4xl"],
      gap: SPACING.sm,
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
    limitNote: {
      ...TYPOGRAPHY.bodySmall,
      color: c.onSurfaceVariant,
      textAlign: "center",
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.lg,
    },
    fabWrapper: {
      position: "absolute",
      right: SPACING.xl,
      bottom: SPACING.xl,
    },
  });
}
