import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryIcon } from "@/components/common/category-icon";
import { GradientButton } from "@/components/common/gradient-button";
import { ModalBackdrop } from "@/components/common/modal-backdrop";
import { RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import type {
  CategoryWithActivities,
  GoalDirection,
  GoalPeriodKind,
} from "@/db/models";
import {
  clearAllIdealAllocationsForCategory,
  setIdealAllocation,
} from "@/db/queries";
import { useIdealAllocationsForCategory } from "@/hooks/useIdealAllocationsForCategory";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import { weekdayNames } from "@/lib/i18n/format";

type Mode = "uniform" | "perDay";

const DIRECTION_OPTIONS = [
  {
    value: "at_least",
    labelKey: "goalEditor.directionAtLeast",
    helperKey: "goalEditor.helperAtLeast",
  },
  {
    value: "around",
    labelKey: "goalEditor.directionAround",
    helperKey: "goalEditor.helperAround",
  },
  {
    value: "at_most",
    labelKey: "goalEditor.directionAtMost",
    helperKey: "goalEditor.helperAtMost",
  },
] as const satisfies readonly {
  value: GoalDirection;
  labelKey: string;
  helperKey: string;
}[];

const PERIOD_OPTIONS: readonly GoalPeriodKind[] = ["daily", "weekly", "monthly"];

interface GoalEditorModalProps {
  visible: boolean;
  category: CategoryWithActivities | null;
  onClose: () => void;
}

export function GoalEditorModal({
  visible,
  category,
  onClose,
}: GoalEditorModalProps): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const dayLabels = useMemo(
    () => weekdayNames("short"),
    // Weekday names follow the UI language.
    [i18n.language],
  );
  const {
    periodKind: savedPeriodKind,
    defaultMinutes,
    perDayMinutes,
    weeklyMinutes,
    monthlyMinutes,
    goalDirection: savedDirection,
    isLoading,
  } = useIdealAllocationsForCategory(category?.id ?? null);
  const { preferences } = useUserPreferences();
  const orderedWeekdayIndices = useMemo(
    () =>
      Array.from(
        { length: 7 },
        (_, i) => (preferences.weekStartDay + i) % 7,
      ),
    [preferences.weekStartDay],
  );

  const [periodKind, setPeriodKind] = useState<GoalPeriodKind>("daily");
  const [mode, setMode] = useState<Mode>("uniform");
  const [direction, setDirection] = useState<GoalDirection>("around");
  const [uniform, setUniform] = useState<HM>({ h: "0", m: "0" });
  const [perDay, setPerDay] = useState<HM[]>(() => emptyPerDay());
  const [periodTarget, setPeriodTarget] = useState<HM>({ h: "0", m: "0" });
  const [submitting, setSubmitting] = useState(false);

  // Seed state each time the modal (re-)opens for a category.
  useEffect(() => {
    if (!visible || !category) return;

    const initialKind: GoalPeriodKind = savedPeriodKind ?? "daily";
    setPeriodKind(initialKind);

    const hasOverrides = perDayMinutes.some((v) => v != null);
    const nextMode: Mode = hasOverrides ? "perDay" : "uniform";
    setMode(nextMode);
    setDirection(savedDirection ?? "around");
    setUniform(minutesToHM(defaultMinutes ?? 0));
    setPerDay(
      perDayMinutes.map((v) =>
        minutesToHM(v != null ? v : defaultMinutes ?? 0),
      ),
    );
    if (initialKind === "weekly") {
      setPeriodTarget(minutesToHM(weeklyMinutes ?? 0));
    } else if (initialKind === "monthly") {
      setPeriodTarget(minutesToHM(monthlyMinutes ?? 0));
    } else {
      setPeriodTarget({ h: "0", m: "0" });
    }
    setSubmitting(false);
  }, [
    visible,
    category,
    savedPeriodKind,
    defaultMinutes,
    perDayMinutes,
    weeklyMinutes,
    monthlyMinutes,
    savedDirection,
  ]);

  // Switching kinds clears the previous shape's rows on save. Confirm so the
  // user knows they're discarding the other configuration. No-op when no
  // existing goal of any kind exists.
  const handlePeriodChange = useCallback(
    (next: GoalPeriodKind) => {
      if (next === periodKind) return;
      const hasExisting =
        savedPeriodKind != null && savedPeriodKind !== next;
      if (!hasExisting) {
        setPeriodKind(next);
        return;
      }
      Alert.alert(
        switchTitle(next, t),
        switchBody(savedPeriodKind!, t),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("goalEditor.switch"),
            style: "destructive",
            onPress: () => setPeriodKind(next),
          },
        ],
      );
    },
    [periodKind, savedPeriodKind, t],
  );

  const handleClose = useCallback(() => {
    if (submitting) return;
    onClose();
  }, [onClose, submitting]);

  const handleClear = useCallback(() => {
    if (!category) return;
    Alert.alert(
      t("goalEditor.clearTitle", { name: category.name }),
      t("goalEditor.clearBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.clear"),
          style: "destructive",
          onPress: async () => {
            setSubmitting(true);
            try {
              await clearAllIdealAllocationsForCategory(category.id);
              onClose();
            } catch (err) {
              console.error("Failed to clear goal", err);
              setSubmitting(false);
            }
          },
        },
      ],
    );
  }, [category, onClose, t]);

  const handleSave = useCallback(async () => {
    if (!category) return;
    setSubmitting(true);
    try {
      // Always start from a clean slate so mode/kind switches don't leave
      // stale rows behind (e.g. switching from per-day daily back to weekly).
      await clearAllIdealAllocationsForCategory(category.id);

      if (periodKind === "weekly" || periodKind === "monthly") {
        await setIdealAllocation({
          categoryId: category.id,
          dayOfWeek: null,
          targetMinutesPerDay: hmToMinutes(periodTarget),
          goalDirection: direction,
          periodKind,
        });
      } else if (mode === "uniform") {
        await setIdealAllocation({
          categoryId: category.id,
          dayOfWeek: null,
          targetMinutesPerDay: hmToMinutes(uniform),
          goalDirection: direction,
          periodKind: "daily",
        });
      } else {
        // Write 7 rows, one per weekday. Absent/0 days still get a row so
        // the goal is explicit and survives the resolution rule.
        for (let wd = 0; wd < 7; wd++) {
          await setIdealAllocation({
            categoryId: category.id,
            dayOfWeek: wd,
            targetMinutesPerDay: hmToMinutes(perDay[wd]),
            goalDirection: direction,
            periodKind: "daily",
          });
        }
      }
      onClose();
    } catch (err) {
      console.error("Failed to save goal", err);
      setSubmitting(false);
    }
  }, [category, periodKind, mode, direction, uniform, perDay, periodTarget, onClose]);

  const totalWeekMinutes = useMemo(() => {
    if (mode === "uniform") return hmToMinutes(uniform) * 7;
    return perDay.reduce((sum, v) => sum + hmToMinutes(v), 0);
  }, [mode, uniform, perDay]);

  const hasExistingGoal =
    defaultMinutes != null ||
    perDayMinutes.some((v) => v != null) ||
    weeklyMinutes != null ||
    monthlyMinutes != null;

  if (!category) {
    return <Modal visible={false} transparent />;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <ModalBackdrop onPress={handleClose} />

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
              <View style={styles.headerLeft}>
                <View
                  style={[
                    styles.iconBubble,
                    { backgroundColor: category.color + "1F" },
                  ]}
                >
                  <CategoryIcon
                    icon={category.icon ?? "circle"}
                    size={20}
                    color={category.color}
                  />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {category.name}
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    {goalSubtitle(periodKind, t)}
                  </Text>
                </View>
              </View>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Feather name="x" size={22} color={colors.onSurface} />
              </Pressable>
            </View>

            {/* Period kind selector */}
            <Text style={styles.sectionLabel}>
              {t("goalEditor.cadenceLabel")}
            </Text>
            <View style={styles.modeRow}>
              {PERIOD_OPTIONS.map((kind) => (
                <ModeButton
                  key={kind}
                  label={t(`common.period.${kind}`)}
                  active={periodKind === kind}
                  onPress={() => handlePeriodChange(kind)}
                />
              ))}
            </View>

            {/* Daily-only sub-mode toggle */}
            {periodKind === "daily" && (
              <View style={styles.modeRow}>
                <ModeButton
                  label={t("goalEditor.sameEveryDay")}
                  active={mode === "uniform"}
                  onPress={() => setMode("uniform")}
                />
                <ModeButton
                  label={t("goalEditor.perDayOfWeek")}
                  active={mode === "perDay"}
                  onPress={() => setMode("perDay")}
                />
              </View>
            )}

            {/* Direction selector */}
            <Text style={styles.sectionLabel}>{t("goalEditor.typeLabel")}</Text>
            <View style={styles.directionRow}>
              {DIRECTION_OPTIONS.map((opt) => (
                <DirectionButton
                  key={opt.value}
                  label={t(opt.labelKey)}
                  active={direction === opt.value}
                  onPress={() => setDirection(opt.value)}
                />
              ))}
            </View>
            <Text style={styles.directionHelper}>
              {t(
                DIRECTION_OPTIONS.find((o) => o.value === direction)?.helperKey ??
                  "goalEditor.helperAround",
              )}
            </Text>

            <View style={styles.inputsBlock}>
              {periodKind === "weekly" || periodKind === "monthly" ? (
                <HMInputRow
                  label={
                    periodKind === "weekly"
                      ? t("goalEditor.perWeek")
                      : t("goalEditor.perMonth")
                  }
                  value={periodTarget}
                  onChange={setPeriodTarget}
                  maxHours={periodKind === "weekly" ? 168 : 999}
                />
              ) : mode === "uniform" ? (
                <HMInputRow
                  label={t("goalEditor.everyDay")}
                  value={uniform}
                  onChange={setUniform}
                />
              ) : (
                orderedWeekdayIndices.map((idx) => (
                  <HMInputRow
                    key={idx}
                    label={dayLabels[idx]}
                    value={perDay[idx]}
                    onChange={(next) =>
                      setPerDay((prev) => {
                        const copy = [...prev];
                        copy[idx] = next;
                        return copy;
                      })
                    }
                  />
                ))
              )}

              {periodKind === "daily" && (
                <Text style={styles.totalLine}>
                  {t("goalEditor.weeklyTotal", {
                    duration: formatHM(totalWeekMinutes),
                  })}
                </Text>
              )}
            </View>

            {hasExistingGoal && (
              <Pressable
                onPress={handleClear}
                style={styles.clearButton}
                disabled={submitting}
              >
                <Feather name="trash-2" size={16} color={colors.error} />
                <Text style={styles.clearButtonText}>
                  {t("goalEditor.clearGoal")}
                </Text>
              </Pressable>
            )}

            <GradientButton
              shape="pill"
              label={submitting ? t("common.saving") : t("goalEditor.save")}
              onPress={handleSave}
              disabled={submitting || isLoading}
            >
              <Feather name="check" size={18} color={colors.onPrimary} />
            </GradientButton>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ──────────────────────────────────────────────

interface ModeButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function ModeButton({ label, active, onPress }: ModeButtonProps): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      style={[styles.modeButton, active && styles.modeButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.modeButtonText, active && styles.modeButtonTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

interface DirectionButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function DirectionButton({
  label,
  active,
  onPress,
}: DirectionButtonProps): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      style={[
        styles.directionButton,
        active && styles.directionButtonActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.directionButtonText,
          active && styles.directionButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface HM {
  h: string;
  m: string;
}

interface HMInputRowProps {
  label: string;
  value: HM;
  onChange: (next: HM) => void;
  /** Max hours allowed. Daily rows cap at 23; weekly/monthly need higher. */
  maxHours?: number;
}

function HMInputRow({
  label,
  value,
  onChange,
  maxHours = 23,
}: HMInputRowProps): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const hMaxLength = maxHours >= 100 ? 3 : 2;
  return (
    <View style={styles.hmRow}>
      <Text style={styles.hmLabel}>{label}</Text>
      <View style={styles.hmInputs}>
        <TextInput
          style={styles.hmInput}
          value={value.h}
          onChangeText={(t) =>
            onChange({ ...value, h: clampNumericText(t, maxHours) })
          }
          keyboardType="number-pad"
          maxLength={hMaxLength}
          selectTextOnFocus
        />
        <Text style={styles.hmUnit}>{t("goalEditor.hoursUnit")}</Text>
        <TextInput
          style={styles.hmInput}
          value={value.m}
          onChangeText={(t) => onChange({ ...value, m: clampNumericText(t, 59) })}
          keyboardType="number-pad"
          maxLength={2}
          selectTextOnFocus
        />
        <Text style={styles.hmUnit}>{t("goalEditor.minutesUnit")}</Text>
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────
// Helpers

function emptyPerDay(): HM[] {
  return Array.from({ length: 7 }, () => ({ h: "0", m: "0" }));
}

function minutesToHM(total: number): HM {
  const safe = Math.max(0, Math.floor(total));
  return {
    h: String(Math.floor(safe / 60)),
    m: String(safe % 60),
  };
}

function hmToMinutes(v: HM): number {
  const h = Math.max(0, parseInt(v.h || "0", 10) || 0);
  const m = Math.min(59, Math.max(0, parseInt(v.m || "0", 10) || 0));
  return h * 60 + m;
}

function switchTitle(to: GoalPeriodKind, t: TFunction): string {
  if (to === "weekly") return t("goalEditor.switchTitleWeekly");
  if (to === "monthly") return t("goalEditor.switchTitleMonthly");
  return t("goalEditor.switchTitleDaily");
}

function switchBody(from: GoalPeriodKind, t: TFunction): string {
  if (from === "weekly") return t("goalEditor.switchBodyWeekly");
  if (from === "monthly") return t("goalEditor.switchBodyMonthly");
  return t("goalEditor.switchBodyDaily");
}

function goalSubtitle(kind: GoalPeriodKind, t: TFunction): string {
  if (kind === "weekly") return t("goalEditor.subtitleWeekly");
  if (kind === "monthly") return t("goalEditor.subtitleMonthly");
  return t("goalEditor.subtitleDaily");
}

function clampNumericText(text: string, max: number): string {
  const digits = text.replace(/[^0-9]/g, "");
  if (digits === "") return "";
  const n = Math.min(max, parseInt(digits, 10));
  return String(n);
}

function formatHM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return i18n.t("duration.hours", { hours: h });
  if (h === 0) return i18n.t("duration.minutes", { minutes: m });
  return i18n.t("duration.hoursMinutes", { hours: h, minutes: m });
}

// ──────────────────────────────────────────────

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
    alignItems: "center",
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...TYPOGRAPHY.headingXl,
    color: c.onSurface,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.labelUppercase,
    color: c.onSurfaceVariant,
  },
  closeButton: {
    padding: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: c.surfaceContainerLow,
  },
  modeRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    padding: 4,
    borderRadius: RADIUS.xl,
    backgroundColor: c.surfaceContainerLow,
    marginBottom: SPACING.lg,
  },
  modeButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: c.surfaceContainerLowest,
  },
  modeButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: c.onSurfaceVariant,
  },
  modeButtonTextActive: {
    color: c.onSurface,
    fontWeight: "600",
  },
  sectionLabel: {
    ...TYPOGRAPHY.labelUppercase,
    color: c.onSurfaceVariant,
    marginBottom: SPACING.sm,
  },
  directionRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    padding: 4,
    borderRadius: RADIUS.xl,
    backgroundColor: c.surfaceContainerLow,
    marginBottom: SPACING.xs,
  },
  directionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.lg,
    alignItems: "center",
  },
  directionButtonActive: {
    backgroundColor: c.surfaceContainerLowest,
  },
  directionButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: c.onSurfaceVariant,
  },
  directionButtonTextActive: {
    color: c.onSurface,
    fontWeight: "600",
  },
  directionHelper: {
    ...TYPOGRAPHY.bodySmall,
    color: c.onSurfaceVariant,
    marginBottom: SPACING.lg,
  },
  inputsBlock: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  hmRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: c.surfaceContainerLow,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  hmLabel: {
    ...TYPOGRAPHY.titleMd,
    color: c.onSurface,
  },
  hmInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  hmInput: {
    ...TYPOGRAPHY.body,
    color: c.onSurface,
    backgroundColor: c.surfaceContainerLowest,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    minWidth: 44,
    textAlign: "center",
  },
  hmUnit: {
    ...TYPOGRAPHY.bodySmall,
    color: c.onSurfaceVariant,
    marginRight: SPACING.xs,
  },
  totalLine: {
    ...TYPOGRAPHY.bodySmall,
    color: c.onSurfaceVariant,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  clearButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: c.error,
  },
  });
}
