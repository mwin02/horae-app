import { Feather } from "@expo/vector-icons";
import type { TFunction } from "i18next";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import type { ImportMode, ImportSummary } from "@/lib/import-json";

export interface ImportDataModalProps {
  visible: boolean;
  /** Called when user picks the primary "Choose backup file" button.
   *  Should return the import result, or null if the user cancels the
   *  OS picker. Errors are caught by the caller and surfaced via Alert. */
  onPicked: (mode: ImportMode) => Promise<ImportSummary | null>;
  /** Triggers the existing JSON export so a user can save a backup
   *  before they Replace local data. */
  onExportFirst: () => Promise<void>;
  exporting: boolean;
  onClose: () => void;
}

interface ModeOption {
  value: ImportMode;
  title: string;
  renderDescription: () => React.ReactNode;
}

function buildModeOptions(
  styles: ReturnType<typeof makeStyles>,
  t: TFunction,
): ModeOption[] {
  const components = {
    em: <Text style={styles.descriptionEmphasis} />,
    warn: <Text style={styles.descriptionWarning} />,
  };
  return [
    {
      value: "merge",
      title: t("importData.mergeTitle"),
      renderDescription: () => (
        <Trans i18nKey="importData.mergeDescription" components={components} />
      ),
    },
    {
      value: "replace",
      title: t("importData.replaceTitle"),
      renderDescription: () => (
        <Trans i18nKey="importData.replaceDescription" components={components} />
      ),
    },
  ];
}

export function ImportDataModal({
  visible,
  onPicked,
  onExportFirst,
  exporting,
  onClose,
}: ImportDataModalProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const MODE_OPTIONS = useMemo(() => buildModeOptions(styles, t), [styles, t]);
  const [mode, setMode] = useState<ImportMode>("merge");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (visible) {
      setMode("merge");
      setImporting(false);
    }
  }, [visible]);

  const handlePick = useCallback(async () => {
    if (importing) return;
    setImporting(true);
    try {
      await onPicked(mode);
    } finally {
      setImporting(false);
    }
  }, [importing, mode, onPicked]);

  const busy = importing || exporting;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={busy ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={busy ? undefined : onClose}
        />

        <View style={styles.sheet}>
          <View style={styles.handleBar} />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.sheetContent,
              { paddingBottom: insets.bottom + SPACING.lg },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>{t("importData.title")}</Text>
                <Text style={styles.headerSubtitle}>
                  {t("importData.subtitle")}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                disabled={busy}
                style={[styles.closeButton, busy && styles.closeButtonDisabled]}
              >
                <Feather name="x" size={22} color={colors.onSurface} />
              </Pressable>
            </View>

            <View style={styles.optionList}>
              {MODE_OPTIONS.map((option) => {
                const selected = option.value === mode;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setMode(option.value)}
                    disabled={busy}
                    style={({ pressed }) => [
                      styles.optionCard,
                      selected && styles.optionCardSelected,
                      pressed && !selected && styles.optionCardPressed,
                      busy && styles.optionCardDisabled,
                    ]}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        selected && styles.radioOuterSelected,
                      ]}
                    >
                      {selected ? <View style={styles.radioInner} /> : null}
                    </View>
                    <View style={styles.optionText}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      <Text style={styles.optionDescription}>
                        {option.renderDescription()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {mode === "replace" ? (
              <View style={styles.replaceWarning}>
                <Feather
                  name="alert-triangle"
                  size={16}
                  color={colors.error}
                />
                <Text style={styles.replaceWarningText}>
                  {t("importData.replaceWarning")}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={onExportFirst}
              disabled={busy}
              style={({ pressed }) => [
                styles.exportNudge,
                pressed && styles.exportNudgePressed,
                busy && styles.exportNudgeDisabled,
              ]}
            >
              <Feather name="download" size={18} color={colors.primary} />
              <Text style={styles.exportNudgeText}>
                {exporting
                  ? t("manageData.preparingExport")
                  : t("importData.exportFirst")}
              </Text>
            </Pressable>

            <Pressable
              onPress={handlePick}
              disabled={busy}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                busy && styles.primaryButtonDisabled,
              ]}
            >
              {importing ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Feather
                  name="upload"
                  size={18}
                  color={colors.onPrimary}
                />
              )}
              <Text style={styles.primaryButtonLabel}>
                {importing ? t("importData.restoring") : t("importData.chooseFile")}
              </Text>
            </Pressable>
          </ScrollView>
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
    paddingTop: SPACING.md,
    maxHeight: "90%",
  },
  sheetContent: {
    paddingHorizontal: SPACING["2xl"],
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
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.lg,
  },
  headerText: {
    flex: 1,
    paddingRight: SPACING.md,
    gap: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.headingXl,
    color: c.onSurface,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: c.onSurfaceVariant,
  },
  closeButton: {
    padding: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: c.surfaceContainerLow,
  },
  closeButtonDisabled: {
    opacity: 0.4,
  },
  optionList: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    backgroundColor: c.surfaceContainerLow,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionCardSelected: {
    borderColor: c.primary,
    backgroundColor: c.surfaceContainer,
  },
  optionCardPressed: {
    backgroundColor: c.surfaceContainer,
  },
  optionCardDisabled: {
    opacity: 0.5,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: c.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioOuterSelected: {
    borderColor: c.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: c.primary,
  },
  optionText: {
    flex: 1,
    gap: SPACING.xs,
  },
  optionTitle: {
    ...TYPOGRAPHY.titleMd,
    color: c.onSurface,
  },
  optionDescription: {
    ...TYPOGRAPHY.body,
    color: c.onSurfaceVariant,
  },
  descriptionEmphasis: {
    color: c.onSurface,
    fontWeight: "600",
  },
  descriptionWarning: {
    color: c.error,
    fontWeight: "600",
  },
  replaceWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  replaceWarningText: {
    ...TYPOGRAPHY.bodySmall,
    color: c.error,
    flex: 1,
  },
  exportNudge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: c.surfaceContainerLow,
    marginBottom: SPACING.lg,
  },
  exportNudgePressed: {
    backgroundColor: c.surfaceContainer,
  },
  exportNudgeDisabled: {
    opacity: 0.6,
  },
  exportNudgeText: {
    ...TYPOGRAPHY.titleMd,
    color: c.primary,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.full,
    backgroundColor: c.primary,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonLabel: {
    ...TYPOGRAPHY.titleMd,
    color: c.onPrimary,
  },
  });
}
