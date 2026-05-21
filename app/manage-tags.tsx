import { Feather } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GradientButton } from "@/components/common/gradient-button";
import { CreateTagModal } from "@/components/manage/create-tag-modal";
import { ManageTagRow } from "@/components/manage/manage-tag-row";
import { SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import type { TagItem } from "@/db/models";
import { archiveTag } from "@/db/queries";
import { useTags } from "@/hooks/useTags";

export default function ManageTagsScreen(): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { tags, isLoading } = useTags();
  const [createVisible, setCreateVisible] = useState(false);
  const [editing, setEditing] = useState<TagItem | null>(null);

  const handleArchive = useCallback((tag: TagItem): void => {
    Alert.alert(
      `Archive "${tag.name}"?`,
      "Past entries will keep this tag in their history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            try {
              await archiveTag(tag.id);
            } catch (err) {
              console.error("Failed to archive tag", err);
            }
          },
        },
      ],
    );
  }, []);

  const handleEdit = useCallback((tag: TagItem): void => {
    setEditing(tag);
  }, []);

  const renderTag = useCallback(
    ({ item }: { item: TagItem }): React.ReactElement => (
      <ManageTagRow tag={item} onEdit={handleEdit} onArchive={handleArchive} />
    ),
    [handleEdit, handleArchive],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Stack.Screen options={{ title: "Manage Tags" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: "Manage Tags" }} />

      <View style={styles.header}>
        <Text style={styles.title}>Manage Tags</Text>
        <Text style={styles.subtitle}>
          Tags add a second axis — client, project, mood — orthogonal to
          activities.
        </Text>
      </View>

      <View style={styles.content}>
        <FlatList
          data={tags}
          keyExtractor={(item) => item.id}
          renderItem={renderTag}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No tags yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to create your first tag.
              </Text>
            </View>
          }
        />
      </View>

      <View style={styles.fabWrapper} pointerEvents="box-none">
        <GradientButton
          shape="circle"
          size={60}
          onPress={() => setCreateVisible(true)}
        >
          <Feather name="plus" size={28} color={colors.onPrimary} />
        </GradientButton>
      </View>

      <CreateTagModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
      />

      <CreateTagModal
        visible={editing !== null}
        onClose={() => setEditing(null)}
        initialTag={editing}
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
    content: {
      flex: 1,
      paddingHorizontal: SPACING.lg,
    },
    list: {
      flex: 1,
    },
    listContent: {
      gap: SPACING.sm,
      paddingBottom: 120,
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
    fabWrapper: {
      position: "absolute",
      right: SPACING.xl,
      bottom: SPACING.xl,
    },
  });
}
