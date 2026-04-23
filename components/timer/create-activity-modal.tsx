import { CategoryIcon } from "@/components/common/category-icon";
import { GradientButton } from "@/components/common/gradient-button";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import type { CategoryWithActivities } from "@/db/models";
import { createActivity } from "@/db/queries";
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CreateActivityModalProps {
  visible: boolean;
  onClose: () => void;
  categories: CategoryWithActivities[];
}

export function CreateActivityModal({
  visible,
  onClose,
  categories,
}: CreateActivityModalProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const reset = useCallback((): void => {
    setName("");
    setSelectedCategoryId(null);
    setSubmitting(false);
  }, []);

  const handleClose = useCallback((): void => {
    reset();
    onClose();
  }, [reset, onClose]);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && selectedCategoryId !== null && !submitting;

  const handleCreate = useCallback(async (): Promise<void> => {
    if (!canSubmit || !selectedCategoryId) return;
    setSubmitting(true);
    try {
      await createActivity({
        categoryId: selectedCategoryId,
        name: trimmedName,
      });
      reset();
      onClose();
    } catch (err) {
      setSubmitting(false);
      console.error("Failed to create activity", err);
    }
  }, [canSubmit, selectedCategoryId, trimmedName, reset, onClose]);

  const categoryRows: CategoryWithActivities[][] = [];
  for (let i = 0; i < categories.length; i += 2) {
    categoryRows.push(categories.slice(i, i + 2));
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.lg }]}
        >
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>New Activity</Text>
              <Text style={styles.headerSubtitle}>Add a custom activity</Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={22} color={COLORS.onSurface} />
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Activity Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Morning Run"
              placeholderTextColor={COLORS.onSurfaceVariant}
              value={name}
              onChangeText={setName}
              autoFocus
              autoCorrect={false}
              maxLength={50}
              returnKeyType="done"
            />
          </View>

          <Text style={styles.sectionLabel}>Assign to Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
            style={styles.categoryScroll}
            keyboardShouldPersistTaps="handled"
          >
            {categoryRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.categoryColumn}>
                {row.map((category) => {
                  const isSelected = category.id === selectedCategoryId;
                  return (
                    <Pressable
                      key={category.id}
                      style={[
                        styles.categoryCard,
                        isSelected && styles.categoryCardSelected,
                      ]}
                      onPress={() => setSelectedCategoryId(category.id)}
                    >
                      <CategoryIcon
                        icon={category.icon ?? "circle"}
                        size={22}
                        color={
                          isSelected ? COLORS.primary : COLORS.onSurfaceVariant
                        }
                      />
                      <Text
                        style={[
                          styles.categoryCardName,
                          isSelected && styles.categoryCardNameSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          <GradientButton
            shape="pill"
            label={submitting ? "Creating..." : "Create Activity"}
            onPress={handleCreate}
            disabled={!canSubmit}
          >
            <Feather name="plus" size={18} color={COLORS.onPrimary} />
          </GradientButton>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: SPACING["2xl"],
    paddingTop: SPACING.md,
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
    marginBottom: SPACING["2xl"],
  },
  headerTitle: {
    ...TYPOGRAPHY.headingXl,
    color: COLORS.onSurface,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.labelUppercase,
    color: COLORS.onSurfaceVariant,
    marginTop: SPACING.xs,
  },
  closeButton: {
    padding: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  sectionLabel: {
    ...TYPOGRAPHY.labelUppercase,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.md,
  },
  inputContainer: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING["2xl"],
  },
  input: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurface,
    padding: 0,
  },
  categoryScroll: {
    flexGrow: 0,
    marginBottom: SPACING["2xl"],
  },
  categoryScrollContent: {
    gap: SPACING.md,
  },
  categoryColumn: {
    gap: SPACING.md,
  },
  categoryCard: {
    width: 160,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  categoryCardSelected: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  categoryCardName: {
    ...TYPOGRAPHY.titleMd,
    color: COLORS.onSurface,
    flexShrink: 1,
  },
  categoryCardNameSelected: {
    color: COLORS.primary,
  },
});
