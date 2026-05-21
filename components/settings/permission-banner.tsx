import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";

export interface PermissionBannerProps {
  onOpenSettings: () => void;
}

export function PermissionBanner({
  onOpenSettings,
}: PermissionBannerProps): React.ReactElement {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container}>
      <View style={styles.iconBubble}>
        <Feather name="bell-off" size={18} color={colors.error} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>Notifications are off</Text>
        <Text style={styles.body}>
          Turn them on in iOS Settings so reminders can reach you.
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={onOpenSettings}
        >
          <Text style={styles.buttonLabel}>Open Settings</Text>
          <Feather
            name="external-link"
            size={14}
            color={colors.onErrorContainer}
          />
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: c.onError,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surfaceContainerLowest,
  },
  textBlock: {
    flex: 1,
    gap: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.titleMd,
    color: c.error,
  },
  body: {
    ...TYPOGRAPHY.body,
    color: c.onErrorContainer,
  },
  button: {
    marginTop: SPACING.xs,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: c.surfaceContainerLowest,
  },
  buttonPressed: {
    backgroundColor: c.surfaceContainer,
  },
  buttonLabel: {
    ...TYPOGRAPHY.body,
    color: c.onErrorContainer,
  },
  });
}
