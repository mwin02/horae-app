import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
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

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "@/constants/theme";
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

const MODE_OPTIONS: ModeOption[] = [
  {
    value: "merge",
    title: "Add to what's already here",
    renderDescription: () => (
      <>
        Keep everything on this device and fill in anything new from your
        backup. Pick this if you have{" "}
        <Text style={styles.descriptionEmphasis}>
          data on this device you don&apos;t want to lose
        </Text>
        .{" "}
        <Text style={styles.descriptionWarning}>
          Renamed or deleted preset activities won&apos;t be restored
        </Text>{" "}
        — use Replace for that.
      </>
    ),
  },
  {
    value: "replace",
    title: "Replace what's on this device",
    renderDescription: () => (
      <>
        Wipe everything currently on this device, then load the backup. Use
        this if you want your data back{" "}
        <Text style={styles.descriptionEmphasis}>
          exactly as it was when you exported
        </Text>
        .
      </>
    ),
  },
];

export function ImportDataModal({
  visible,
  onPicked,
  onExportFirst,
  exporting,
  onClose,
}: ImportDataModalProps): React.ReactElement {
  const insets = useSafeAreaInsets();
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
                <Text style={styles.headerTitle}>Bring data back</Text>
                <Text style={styles.headerSubtitle}>
                  Pick a Horae backup file (.json), then choose how to combine
                  it with what&apos;s already on this device.
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                disabled={busy}
                style={[styles.closeButton, busy && styles.closeButtonDisabled]}
              >
                <Feather name="x" size={22} color={COLORS.onSurface} />
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
                  color={COLORS.error}
                />
                <Text style={styles.replaceWarningText}>
                  This can&apos;t be undone. Consider exporting first.
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
              <Feather name="download" size={18} color={COLORS.primary} />
              <Text style={styles.exportNudgeText}>
                {exporting ? "Preparing export…" : "Export a backup first"}
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
                <ActivityIndicator color={COLORS.onPrimary} />
              ) : (
                <Feather
                  name="upload"
                  size={18}
                  color={COLORS.onPrimary}
                />
              )}
              <Text style={styles.primaryButtonLabel}>
                {importing ? "Restoring…" : "Choose backup file"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: COLORS.surfaceContainerLowest,
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
    backgroundColor: COLORS.outlineVariant,
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
    color: COLORS.onSurface,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurfaceVariant,
  },
  closeButton: {
    padding: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
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
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceContainer,
  },
  optionCardPressed: {
    backgroundColor: COLORS.surfaceContainer,
  },
  optionCardDisabled: {
    opacity: 0.5,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  optionText: {
    flex: 1,
    gap: SPACING.xs,
  },
  optionTitle: {
    ...TYPOGRAPHY.titleMd,
    color: COLORS.onSurface,
  },
  optionDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurfaceVariant,
  },
  descriptionEmphasis: {
    color: COLORS.onSurface,
    fontWeight: "600",
  },
  descriptionWarning: {
    color: COLORS.error,
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
    color: COLORS.error,
    flex: 1,
  },
  exportNudge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceContainerLow,
    marginBottom: SPACING.lg,
  },
  exportNudgePressed: {
    backgroundColor: COLORS.surfaceContainer,
  },
  exportNudgeDisabled: {
    opacity: 0.6,
  },
  exportNudgeText: {
    ...TYPOGRAPHY.titleMd,
    color: COLORS.primary,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonLabel: {
    ...TYPOGRAPHY.titleMd,
    color: COLORS.onPrimary,
  },
});
