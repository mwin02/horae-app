import {
  AVAILABLE_ICON_KEYS,
  CategoryIcon,
} from "@/components/common/category-icon";
import { GradientButton } from "@/components/common/gradient-button";
import { ModalBackdrop } from "@/components/common/modal-backdrop";
import {
  CATEGORY_PALETTE,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
  type ThemeColors,
} from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import type { CategoryWithActivities } from "@/db/models";
import {
  CategoryLimitExceededError,
  createCategory,
  updateCategory,
} from "@/db/queries";
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
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

interface EditCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  /** null = create mode; a category = edit mode */
  category: CategoryWithActivities | null;
  /** sort_order to assign to a newly created category (create mode only) */
  nextSortOrder?: number;
}

export function EditCategoryModal({
  visible,
  onClose,
  category,
  nextSortOrder = 0,
}: EditCategoryModalProps): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isEdit = category !== null;
  const [name, setName] = useState<string>(category?.name ?? "");
  const [color, setColor] = useState<string>(
    category?.color ?? CATEGORY_PALETTE[0],
  );
  const [icon, setIcon] = useState<string | null>(category?.icon ?? null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(category?.name ?? "");
      setColor(category?.color ?? CATEGORY_PALETTE[0]);
      setIcon(category?.icon ?? null);
      setSubmitting(false);
    }
  }, [visible, category]);

  const handleClose = useCallback((): void => {
    onClose();
  }, [onClose]);

  const trimmedName = name.trim();
  const canSubmit = !submitting && trimmedName.length > 0;

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      if (category) {
        await updateCategory(category.id, { name: trimmedName, color, icon });
      } else {
        await createCategory({
          name: trimmedName,
          color,
          icon,
          sortOrder: nextSortOrder,
        });
      }
      onClose();
    } catch (err) {
      setSubmitting(false);
      if (err instanceof CategoryLimitExceededError) {
        Alert.alert("Category limit reached", err.message);
        return;
      }
      console.error("Failed to save category", err);
    }
  }, [canSubmit, category, trimmedName, color, icon, nextSortOrder, onClose]);

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
        <ModalBackdrop onPress={handleClose} />

        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.lg }]}
        >
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {isEdit ? category?.name : "New Category"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isEdit ? "Rename, recolor, or pick an icon" : "Add a category"}
              </Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={22} color={colors.onSurface} />
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Side Project"
              placeholderTextColor={colors.onSurfaceVariant}
              value={name}
              onChangeText={setName}
              autoCorrect={false}
              maxLength={30}
              returnKeyType="done"
            />
          </View>

          <Text style={styles.sectionLabel}>Appearance</Text>

          <View style={styles.previewRow}>
            <View
              style={[styles.previewBadge, { backgroundColor: color + "22" }]}
            >
              <CategoryIcon icon={icon ?? "circle"} size={20} color={color} />
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.swatchRow}
            style={styles.appearanceScroll}
            keyboardShouldPersistTaps="handled"
          >
            {CATEGORY_PALETTE.map((swatch) => {
              const isSelected = color === swatch;
              return (
                <Pressable
                  key={swatch}
                  onPress={() => setColor(swatch)}
                  style={[
                    styles.swatch,
                    { backgroundColor: swatch },
                    isSelected && styles.swatchSelected,
                  ]}
                >
                  {isSelected && (
                    <Feather name="check" size={16} color={colors.onPrimary} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.iconRow}
            style={styles.appearanceScroll}
            keyboardShouldPersistTaps="handled"
          >
            {AVAILABLE_ICON_KEYS.map((iconKey) => {
              const isSelected = icon === iconKey;
              return (
                <Pressable
                  key={iconKey}
                  onPress={() => setIcon(isSelected ? null : iconKey)}
                  style={[
                    styles.iconTile,
                    isSelected && {
                      backgroundColor: color + "26",
                      borderColor: color,
                    },
                  ]}
                >
                  <CategoryIcon
                    icon={iconKey}
                    size={20}
                    color={isSelected ? color : colors.onSurfaceVariant}
                  />
                </Pressable>
              );
            })}
          </ScrollView>

          <GradientButton
            shape="pill"
            label={
              submitting
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save Changes"
                  : "Create Category"
            }
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Feather
              name={isEdit ? "check" : "plus"}
              size={18}
              color={colors.onPrimary}
            />
          </GradientButton>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
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
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: SPACING["2xl"],
    },
    headerTextWrap: {
      flex: 1,
      marginRight: SPACING.md,
    },
    headerTitle: {
      ...TYPOGRAPHY.headingXl,
      color: c.onSurface,
    },
    headerSubtitle: {
      ...TYPOGRAPHY.labelUppercase,
      color: c.onSurfaceVariant,
      marginTop: SPACING.xs,
    },
    closeButton: {
      padding: SPACING.sm,
      borderRadius: RADIUS.full,
      backgroundColor: c.surfaceContainerLow,
    },
    sectionLabel: {
      ...TYPOGRAPHY.labelUppercase,
      color: c.onSurfaceVariant,
      marginBottom: SPACING.md,
    },
    inputContainer: {
      backgroundColor: c.surfaceContainerLow,
      borderRadius: RADIUS.xl,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      marginBottom: SPACING["2xl"],
    },
    input: {
      ...TYPOGRAPHY.body,
      color: c.onSurface,
      padding: 0,
    },
    previewRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.md,
      marginBottom: SPACING.lg,
    },
    previewBadge: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    appearanceScroll: {
      flexGrow: 0,
      marginBottom: SPACING.md,
    },
    swatchRow: {
      gap: SPACING.sm,
      paddingRight: SPACING.lg,
    },
    swatch: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.full,
      alignItems: "center",
      justifyContent: "center",
    },
    swatchSelected: {
      borderWidth: 2,
      borderColor: c.onSurface,
    },
    iconRow: {
      gap: SPACING.sm,
      paddingRight: SPACING.lg,
      paddingBottom: SPACING.md,
    },
    iconTile: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surfaceContainerLow,
      borderWidth: 1,
      borderColor: "transparent",
    },
  });
}
