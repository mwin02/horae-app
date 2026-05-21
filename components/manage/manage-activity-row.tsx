import React, { useCallback, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Swipeable, RectButton } from "react-native-gesture-handler";
import { CategoryIconSwatch } from "@/components/insights/category-icon-swatch";
import type { ActivityItem } from "@/db/models";
import { RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";

interface ManageActivityRowProps {
  activity: ActivityItem;
  onRename: (activity: ActivityItem) => void;
  onDelete: (activity: ActivityItem) => void;
}

export function ManageActivityRow({
  activity,
  onRename,
  onDelete,
}: ManageActivityRowProps): React.ReactElement {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const swipeableRef = useRef<Swipeable>(null);

  const handleArchivePress = useCallback((): void => {
    swipeableRef.current?.close();
    onDelete(activity);
  }, [activity, onDelete]);

  const renderRightActions = useCallback(
    (): React.ReactElement => (
      <RectButton style={styles.archiveAction} onPress={handleArchivePress}>
        <Feather name="archive" size={20} color={colors.onPrimary} />
        <Text style={styles.archiveLabel}>Archive</Text>
      </RectButton>
    ),
    [handleArchivePress],
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
    >
      <Pressable style={styles.row} onPress={() => onRename(activity)}>
        <CategoryIconSwatch
          icon={activity.icon}
          color={activity.categoryColor}
          size={32}
          iconSize={18}
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {activity.name}
          </Text>
          <Text
            style={[styles.category, { color: activity.categoryColor }]}
            numberOfLines={1}
          >
            {activity.categoryName}
          </Text>
        </View>
        <Pressable
          onPress={() => onRename(activity)}
          style={styles.editButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${activity.name}`}
        >
          <Feather name="edit-2" size={16} color={colors.primary} />
        </Pressable>
      </Pressable>
    </Swipeable>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: c.surfaceContainerLowest,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  info: {
    flex: 1,
  },
  name: {
    ...TYPOGRAPHY.titleMd,
    color: c.onSurface,
  },
  category: {
    ...TYPOGRAPHY.bodySmall,
    marginTop: 2,
  },
  editButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.full,
    backgroundColor: c.surfaceContainerLow,
  },
  archiveAction: {
    backgroundColor: c.error,
    justifyContent: "center",
    alignItems: "center",
    width: 100,
    borderTopRightRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    marginLeft: SPACING.sm,
    gap: 4,
  },
  archiveLabel: {
    ...TYPOGRAPHY.labelUppercase,
    color: c.onPrimary,
    fontSize: 11,
  },
  });
}
