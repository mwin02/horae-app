import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { TagChip } from "@/components/common/tag-chip";
import { useTags } from "@/hooks/useTags";
import { RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";

interface TagFilterRowProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

/**
 * Single-row horizontal tag filter. Tap to toggle — selection is OR/union
 * (entries with ANY selected tag stay vivid). Hidden when the user has no
 * tags yet so it doesn't take up space.
 */
export function TagFilterRow({
  selectedTagIds,
  onChange,
}: TagFilterRowProps): React.ReactElement | null {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { tags } = useTags();

  if (tags.length === 0) return null;

  const selected = new Set(selectedTagIds);
  const hasSelection = selectedTagIds.length > 0;

  const toggle = (tagId: string): void => {
    const next = new Set(selected);
    if (next.has(tagId)) next.delete(tagId);
    else next.add(tagId);
    onChange([...next]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>TAGS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tags.map((tag) => (
          <TagChip
            key={tag.id}
            name={tag.name}
            color={tag.color}
            selected={selected.has(tag.id)}
            onPress={() => toggle(tag.id)}
          />
        ))}
        {hasSelection && (
          <Pressable onPress={() => onChange([])} style={styles.clearChip}>
            <Feather name="x" size={12} color={colors.onSurfaceVariant} />
            <Text style={styles.clearLabel}>Clear</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      paddingLeft: SPACING.lg,
      paddingVertical: SPACING.xs,
    },
    label: {
      ...TYPOGRAPHY.labelUppercase,
      color: c.onSurfaceVariant,
      fontSize: 10,
    },
    scrollContent: {
      gap: SPACING.sm,
      paddingRight: SPACING.lg,
      alignItems: "center",
    },
    clearChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIUS.full,
      backgroundColor: c.surfaceContainer,
    },
    clearLabel: {
      ...TYPOGRAPHY.bodySmall,
      color: c.onSurfaceVariant,
      fontWeight: "600",
    },
  });
}
