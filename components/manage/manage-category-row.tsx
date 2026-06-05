import React, { useCallback, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Swipeable, RectButton } from "react-native-gesture-handler";
import { CategoryIcon } from "@/components/common/category-icon";
import type { CategoryWithActivities } from "@/db/models";
import { RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";

interface ManageCategoryRowProps {
  category: CategoryWithActivities;
  onEdit: (category: CategoryWithActivities) => void;
  onDelete: (category: CategoryWithActivities) => void;
}

export function ManageCategoryRow({
  category,
  onEdit,
  onDelete,
}: ManageCategoryRowProps): React.ReactElement {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const swipeableRef = useRef<Swipeable>(null);
  const activityCount = category.activities.length;

  const handleRemovePress = useCallback((): void => {
    swipeableRef.current?.close();
    onDelete(category);
  }, [category, onDelete]);

  const renderRightActions = useCallback(
    (): React.ReactElement => (
      <RectButton style={styles.removeAction} onPress={handleRemovePress}>
        <Feather name="archive" size={20} color={colors.onPrimary} />
        <Text style={styles.removeLabel}>Remove</Text>
      </RectButton>
    ),
    [handleRemovePress, styles, colors],
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
    >
      <Pressable style={styles.row} onPress={() => onEdit(category)}>
        <View
          style={[styles.iconBadge, { backgroundColor: category.color + "22" }]}
        >
          <CategoryIcon
            icon={category.icon ?? "circle"}
            size={20}
            color={category.color}
          />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {category.name}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {activityCount} {activityCount === 1 ? "activity" : "activities"}
          </Text>
        </View>
        <Pressable
          onPress={() => onEdit(category)}
          style={styles.editButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${category.name}`}
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
    iconBadge: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.md,
      alignItems: "center",
      justifyContent: "center",
    },
    info: {
      flex: 1,
    },
    name: {
      ...TYPOGRAPHY.titleMd,
      color: c.onSurface,
    },
    subtitle: {
      ...TYPOGRAPHY.bodySmall,
      color: c.onSurfaceVariant,
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
    removeAction: {
      backgroundColor: c.error,
      justifyContent: "center",
      alignItems: "center",
      width: 100,
      borderTopRightRadius: RADIUS.lg,
      borderBottomRightRadius: RADIUS.lg,
      marginLeft: SPACING.sm,
      gap: 4,
    },
    removeLabel: {
      ...TYPOGRAPHY.labelUppercase,
      color: c.onPrimary,
      fontSize: 11,
    },
  });
}
