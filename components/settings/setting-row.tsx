import { Feather } from "@expo/vector-icons";
import React, { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";

export type SettingRowProps = {
  title: string;
  description?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  iconBackground?: string;
  iconChildren?: ReactNode;
};

export function SettingRow({
  title,
  description,
  trailing,
  onPress,
  disabled,
  iconBackground,
  iconChildren,
}: SettingRowProps): React.ReactElement {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const isNavigation = typeof onPress === "function";

  const content = (
    <>
      {iconChildren ? (
        <View
          style={[
            styles.iconBubble,
            iconBackground ? { backgroundColor: iconBackground } : null,
          ]}
        >
          {iconChildren}
        </View>
      ) : null}
      <View style={styles.rowText}>
        <Text
          style={[styles.rowTitle, disabled && styles.disabledText]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {description ? (
          <Text
            style={[styles.rowSummary, disabled && styles.disabledText]}
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {trailing ?? (isNavigation ? (
        <Feather
          name="chevron-right"
          size={20}
          color={colors.onSurfaceVariant}
        />
      ) : null)}
    </>
  );

  if (isNavigation) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.row,
          pressed && styles.rowPressed,
          disabled && styles.rowDisabled,
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>{content}</View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
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
  rowDisabled: {
    opacity: 0.55,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: c.surfaceContainer,
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
    color: c.onSurfaceVariant,
  },
  disabledText: {
    color: c.onSurfaceVariant,
  },
  });
}
