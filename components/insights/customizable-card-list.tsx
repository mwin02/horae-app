import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import DraggableFlatList, {
  type DragEndParams,
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import {
  restoreDefaultsForPeriod,
  toggleHidden,
  updateOrder,
  type InsightCardId,
} from "@/db/queries/insight-preferences";
import { useInsightPreferences } from "@/hooks/useInsightPreferences";
import type { InsightsPeriod } from "@/db/queries/user-preferences";

export interface CardEntry {
  id: InsightCardId;
  /** Human label shown in the hidden-cards list. Falls back to id. */
  label?: string;
  node: React.ReactNode;
}

interface CustomizableCardListProps {
  period: InsightsPeriod;
  /** Source of truth: every card the view can render. Order in the array is irrelevant. */
  cards: CardEntry[];
  /** Optional header rendered above the list (e.g. Daily's collapsing WeekStrip). */
  ListHeaderComponent?: React.ReactElement | null;
  /** Forwarded to the underlying list — fires on every scroll with the latest y offset (JS thread). */
  onScrollOffsetChange?: (offset: number) => void;
  /** Edit mode is owned by the parent screen so the period toggle + date header can hide while editing. */
  editMode: boolean;
  onEditModeChange: (editing: boolean) => void;
}

/**
 * Renders a list of insight cards in user-customizable order. Long-press
 * any card to enter edit mode where the drag grip + hide toggle appear,
 * and a sticky "Done" button exits edit mode. Reorder + auto-scroll are
 * delegated to react-native-draggable-flatlist.
 */
export function CustomizableCardList({
  period,
  cards,
  ListHeaderComponent,
  onScrollOffsetChange,
  editMode,
  onEditModeChange,
}: CustomizableCardListProps): React.ReactElement {
  const { preferences } = useInsightPreferences();
  const order = preferences.orders[period];
  const hidden = preferences.hidden[period];

  // Local mirror of the persisted order. Reorder updates this synchronously
  // so the list's `data` prop matches where the user dropped the card; the
  // PowerSync write happens in the background. Without this, the dropped
  // card visually springs back to its original slot until the reactive
  // query roundtrips.
  const [localOrder, setLocalOrder] = useState<InsightCardId[]>(order);
  const pendingWrites = useRef<Set<string>>(new Set());

  useEffect(() => {
    const key = JSON.stringify(order);
    if (pendingWrites.current.has(key)) {
      pendingWrites.current.delete(key);
      return;
    }
    setLocalOrder(order);
  }, [order]);

  const visibleCards = useMemo<CardEntry[]>(() => {
    const byId = new Map(cards.map((c) => [c.id, c]));
    const ordered: CardEntry[] = [];
    const seen = new Set<InsightCardId>();
    for (const id of localOrder) {
      const c = byId.get(id);
      if (c && !hidden.has(id)) {
        ordered.push(c);
        seen.add(id);
      }
    }
    for (const c of cards) {
      if (seen.has(c.id) || hidden.has(c.id)) continue;
      ordered.push(c);
    }
    return ordered;
  }, [cards, localOrder, hidden]);

  const hiddenCards = useMemo<CardEntry[]>(
    () => cards.filter((c) => hidden.has(c.id)),
    [cards, hidden],
  );

  const handleDragEnd = useCallback(
    ({ data }: DragEndParams<CardEntry>) => {
      const newVisible = data.map((c) => c.id);
      const visibleSet = new Set(newVisible);
      const tail: InsightCardId[] = [];
      for (const id of localOrder) {
        if (!visibleSet.has(id)) tail.push(id);
      }
      for (const c of cards) {
        if (!visibleSet.has(c.id) && !tail.includes(c.id)) tail.push(c.id);
      }
      const next = [...newVisible, ...tail];
      pendingWrites.current.add(JSON.stringify(next));
      setLocalOrder(next);
      void updateOrder(period, next);
    },
    [cards, localOrder, period],
  );

  const handleHide = useCallback(
    (id: InsightCardId) => {
      void toggleHidden(period, id);
    },
    [period],
  );

  const handleEnterEditMode = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEditModeChange(true);
  }, [onEditModeChange]);

  const handleRestoreDefaults = useCallback(() => {
    void Haptics.selectionAsync();
    void restoreDefaultsForPeriod(period);
  }, [period]);

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<CardEntry>) => (
      <CardCell
        card={item}
        editMode={editMode}
        isActive={isActive}
        drag={drag}
        onLongPressEnter={handleEnterEditMode}
        onHide={handleHide}
      />
    ),
    [editMode, handleEnterEditMode, handleHide],
  );

  const keyExtractor = useCallback((item: CardEntry) => item.id, []);

  const allHidden = visibleCards.length === 0 && hiddenCards.length > 0;

  const header = (
    <>
      {ListHeaderComponent ?? null}
      {allHidden ? (
        <View style={styles.emptyState}>
          <Feather name="eye-off" size={28} color={COLORS.onSurfaceVariant} />
          <Text style={styles.emptyTitle}>No cards visible</Text>
          <Text style={styles.emptySubtitle}>
            Show a card from the list below or restore defaults.
          </Text>
        </View>
      ) : null}
    </>
  );

  const footer = (
    <>
      {editMode && hiddenCards.length > 0 ? (
        <View style={styles.hiddenSection}>
          <Text style={styles.hiddenHeader}>Hidden</Text>
          {hiddenCards.map((card) => (
            <Pressable
              key={card.id}
              onPress={() => handleHide(card.id)}
              style={({ pressed }) => [
                styles.hiddenRow,
                pressed && styles.hiddenRowPressed,
              ]}
            >
              <Feather
                name="eye-off"
                size={16}
                color={COLORS.onSurfaceVariant}
              />
              <Text style={styles.hiddenRowLabel}>
                {card.label ?? card.id}
              </Text>
              <Text style={styles.hiddenRowAction}>Show</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {editMode ? (
        <View style={styles.footerActions}>
          <Pressable
            onPress={handleRestoreDefaults}
            hitSlop={8}
            style={({ pressed }) => [
              styles.restoreButton,
              pressed && styles.restoreButtonPressed,
            ]}
          >
            <Feather
              name="rotate-ccw"
              size={14}
              color={COLORS.onSurfaceVariant}
            />
            <Text style={styles.restoreButtonText}>Restore defaults</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );

  return (
    <View style={styles.root}>
      {editMode ? (
        <View style={styles.editToolbar}>
          <Text style={styles.editToolbarLabel}>Edit cards</Text>
          <Pressable
            onPress={() => onEditModeChange(false)}
            hitSlop={12}
            style={({ pressed }) => [
              styles.doneButton,
              pressed && styles.doneButtonPressed,
            ]}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      ) : null}
      <DraggableFlatList
        data={visibleCards}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
        onScrollOffsetChange={onScrollOffsetChange}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentContainerStyle={styles.contentContainer}
        ItemSeparatorComponent={Separator}
        showsVerticalScrollIndicator={false}
        activationDistance={10}
        containerStyle={styles.listContainer}
      />
    </View>
  );
}

function Separator(): React.ReactElement {
  return <View style={styles.separator} />;
}

interface CardCellProps {
  card: CardEntry;
  editMode: boolean;
  isActive: boolean;
  drag: () => void;
  onLongPressEnter: () => void;
  onHide: (id: InsightCardId) => void;
}

function CardCell({
  card,
  editMode,
  isActive,
  drag,
  onLongPressEnter,
  onHide,
}: CardCellProps): React.ReactElement {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(isActive ? 1.03 : 1, { duration: 140 }) }],
    shadowOpacity: withTiming(isActive ? 0.35 : 0, { duration: 140 }),
    shadowRadius: isActive ? 18 : 0,
    shadowOffset: { width: 0, height: isActive ? 12 : 0 },
    elevation: isActive ? 8 : 0,
  }));

  return (
    <Pressable
      onLongPress={editMode ? undefined : onLongPressEnter}
      delayLongPress={380}
    >
      <Animated.View style={[styles.cardWrapper, animatedStyle]}>
        {card.node}

        {editMode ? (
          <View pointerEvents="box-none" style={styles.overlay}>
            <Pressable
              onPress={() => onHide(card.id)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.overlayButton,
                pressed && styles.overlayButtonPressed,
              ]}
              accessibilityLabel="Hide card"
            >
              <Feather name="eye-off" size={16} color={COLORS.onSurface} />
            </Pressable>
            <Pressable
              onPressIn={drag}
              hitSlop={8}
              accessibilityLabel="Drag to reorder"
              style={styles.overlayButton}
            >
              <Feather name="menu" size={18} color={COLORS.onSurface} />
            </Pressable>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING["5xl"],
  },
  separator: {
    height: SPACING.lg,
  },
  cardWrapper: {
    position: "relative",
    shadowColor: "#000",
  },
  overlay: {
    position: "absolute",
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: "row",
    gap: SPACING.sm,
  },
  overlayButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHighest,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayButtonPressed: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  editToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  editToolbarLabel: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.onSurfaceVariant,
  },
  doneButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  doneButtonPressed: {
    backgroundColor: COLORS.primaryDim,
  },
  doneButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.onPrimary,
    fontSize: 14,
  },
  hiddenSection: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  hiddenHeader: {
    ...TYPOGRAPHY.labelUppercase,
    color: COLORS.onSurfaceVariant,
    paddingHorizontal: SPACING.sm,
  },
  hiddenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  hiddenRowPressed: {
    backgroundColor: COLORS.surfaceContainer,
  },
  hiddenRowLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurface,
    flex: 1,
  },
  hiddenRowAction: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.primary,
  },
  footerActions: {
    marginTop: SPACING.lg,
    alignItems: "center",
  },
  restoreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  restoreButtonPressed: {
    backgroundColor: COLORS.surfaceContainer,
  },
  restoreButtonText: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.onSurfaceVariant,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: SPACING["2xl"],
    gap: SPACING.sm,
  },
  emptyTitle: {
    ...TYPOGRAPHY.titleMd,
    color: COLORS.onSurface,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    paddingHorizontal: SPACING.xl,
  },
});
