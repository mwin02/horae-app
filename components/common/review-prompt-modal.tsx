import { Feather } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface ReviewPromptModalProps {
  visible: boolean;
  /** "Yes" — caller opens the native store review sheet. */
  onEnjoying: () => void;
  /** "Could be better" — caller routes to the feedback composer. */
  onNotEnjoying: () => void;
  /** Close button / backdrop / swipe. */
  onDismiss: () => void;
}

export function ReviewPromptModal({
  visible,
  onEnjoying,
  onNotEnjoying,
  onDismiss,
}: ReviewPromptModalProps): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const renderOption = (
    icon: FeatherIconName,
    iconColor: string,
    title: string,
    description: string,
    onPress: () => void,
  ): React.ReactElement => (
    <Pressable
      style={({ pressed }) => [styles.optionRow, pressed && styles.optionPressed]}
      onPress={onPress}
    >
      <View style={styles.iconBubble}>
        <Feather name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.optionText}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.onSurfaceVariant} />
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onDismiss} />

        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.lg }]}
        >
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{t("reviewPrompt.title")}</Text>
              <Text style={styles.subtitle}>{t("reviewPrompt.subtitle")}</Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={onDismiss}
              hitSlop={8}
              accessibilityLabel={t("common.close")}
            >
              <Feather name="x" size={20} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <View style={styles.options}>
            {renderOption(
              "heart",
              colors.primary,
              t("reviewPrompt.yes"),
              t("reviewPrompt.yesDescription"),
              onEnjoying,
            )}
            {renderOption(
              "message-square",
              colors.onSurfaceVariant,
              t("reviewPrompt.no"),
              t("reviewPrompt.noDescription"),
              onNotEnjoying,
            )}
          </View>
        </View>
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
    },
    handleBar: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.outlineVariant,
      alignSelf: "center",
      marginBottom: SPACING.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: SPACING.md,
      marginBottom: SPACING["2xl"],
    },
    headerText: {
      flex: 1,
    },
    title: {
      ...TYPOGRAPHY.headingXl,
      color: c.onSurface,
    },
    subtitle: {
      ...TYPOGRAPHY.body,
      color: c.onSurfaceVariant,
      marginTop: SPACING.xs,
    },
    closeButton: {
      padding: SPACING.sm,
      borderRadius: RADIUS.full,
      backgroundColor: c.surfaceContainerLow,
    },
    options: {
      gap: SPACING.sm,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: RADIUS.lg,
      backgroundColor: c.surfaceContainerLow,
    },
    optionPressed: {
      backgroundColor: c.surfaceContainer,
    },
    iconBubble: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.surfaceContainer,
    },
    optionText: {
      flex: 1,
      gap: 2,
    },
    optionTitle: {
      ...TYPOGRAPHY.titleMd,
      color: c.onSurface,
    },
    optionDescription: {
      ...TYPOGRAPHY.bodySmall,
      color: c.onSurfaceVariant,
    },
  });
}
