import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";

const CONFIRMATION_PHRASE = "DELETE";

export interface DeleteDataModalProps {
  visible: boolean;
  title: string;
  description: string;
  /** What's wiped, rendered as a bulleted list inside the modal. */
  bullets: string[];
  /**
   * Runs the JSON export. Caller controls busy state. The modal stays
   * open during export so the user can confirm afterward.
   */
  onExportFirst: () => Promise<void>;
  exporting: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function DeleteDataModal({
  visible,
  title,
  description,
  bullets,
  onExportFirst,
  exporting,
  onConfirm,
  onClose,
}: DeleteDataModalProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [phrase, setPhrase] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setPhrase("");
      setSubmitting(false);
    }
  }, [visible]);

  const canConfirm = phrase.trim() === CONFIRMATION_PHRASE && !submitting;

  const handleConfirm = useCallback(async () => {
    if (!canConfirm) return;
    setSubmitting(true);
    try {
      await onConfirm();
    } catch {
      setSubmitting(false);
    }
  }, [canConfirm, onConfirm]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handleBar} />

          <ScrollView
            automaticallyAdjustKeyboardInsets
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.sheetContent,
              { paddingBottom: insets.bottom + SPACING.lg },
            ]}
          >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSubtitle}>This cannot be undone.</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={22} color={colors.onSurface} />
            </Pressable>
          </View>

          <Text style={styles.description}>{description}</Text>

          <View style={styles.bulletList}>
            {bullets.map((b) => (
              <View key={b} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={onExportFirst}
            disabled={exporting}
            style={({ pressed }) => [
              styles.exportNudge,
              pressed && styles.exportNudgePressed,
              exporting && styles.exportNudgeDisabled,
            ]}
          >
            <Feather name="download" size={18} color={colors.primary} />
            <Text style={styles.exportNudgeText}>
              {exporting ? "Preparing export…" : "Export data first (JSON)"}
            </Text>
          </Pressable>

          <Text style={styles.sectionLabel}>
            Type {CONFIRMATION_PHRASE} to confirm
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={CONFIRMATION_PHRASE}
              placeholderTextColor={colors.onSurfaceVariant}
              value={phrase}
              onChangeText={setPhrase}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={20}
              returnKeyType="done"
            />
          </View>

          <Pressable
            onPress={handleConfirm}
            disabled={!canConfirm}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
              !canConfirm && styles.deleteButtonDisabled,
            ]}
          >
            <Feather name="trash-2" size={18} color={colors.onPrimary} />
            <Text style={styles.deleteButtonLabel}>
              {submitting ? "Deleting…" : "Delete permanently"}
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
  },
  headerTitle: {
    ...TYPOGRAPHY.headingXl,
    color: c.onSurface,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.labelUppercase,
    color: c.error,
    marginTop: SPACING.xs,
  },
  closeButton: {
    padding: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: c.surfaceContainerLow,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: c.onSurfaceVariant,
    marginBottom: SPACING.lg,
  },
  bulletList: {
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: c.onSurfaceVariant,
    marginTop: 8,
  },
  bulletText: {
    ...TYPOGRAPHY.body,
    color: c.onSurface,
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
  sectionLabel: {
    ...TYPOGRAPHY.labelUppercase,
    color: c.onSurfaceVariant,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    backgroundColor: c.surfaceContainerLow,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
  },
  input: {
    ...TYPOGRAPHY.body,
    color: c.onSurface,
    padding: 0,
    letterSpacing: 1,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.full,
    backgroundColor: c.error,
  },
  deleteButtonPressed: {
    backgroundColor: c.errorDim,
  },
  deleteButtonDisabled: {
    opacity: 0.45,
  },
  deleteButtonLabel: {
    ...TYPOGRAPHY.titleMd,
    color: c.onPrimary,
  },
  });
}
