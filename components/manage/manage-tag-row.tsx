import React, { useCallback, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Swipeable, RectButton } from "react-native-gesture-handler";
import type { TagItem } from "@/db/models";
import { RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";

interface ManageTagRowProps {
  tag: TagItem;
  onEdit: (tag: TagItem) => void;
  onArchive: (tag: TagItem) => void;
}

export function ManageTagRow({
  tag,
  onEdit,
  onArchive,
}: ManageTagRowProps): React.ReactElement {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const swipeableRef = useRef<Swipeable>(null);

  const handleArchivePress = useCallback((): void => {
    swipeableRef.current?.close();
    onArchive(tag);
  }, [tag, onArchive]);

  const renderRightActions = useCallback(
    (): React.ReactElement => (
      <RectButton style={styles.archiveAction} onPress={handleArchivePress}>
        <Feather name="archive" size={20} color={colors.onPrimary} />
        <Text style={styles.archiveLabel}>{t("common.archive")}</Text>
      </RectButton>
    ),
    [handleArchivePress, t],
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
    >
      <Pressable style={styles.row} onPress={() => onEdit(tag)}>
        <View style={[styles.swatch, { backgroundColor: tag.color }]} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {tag.name}
          </Text>
        </View>
        <Pressable
          onPress={() => onEdit(tag)}
          style={styles.editButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("common.editItem", { name: tag.name })}
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
  swatch: {
    width: 16,
    height: 16,
    borderRadius: RADIUS.full,
  },
  info: {
    flex: 1,
  },
  name: {
    ...TYPOGRAPHY.titleMd,
    color: c.onSurface,
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
