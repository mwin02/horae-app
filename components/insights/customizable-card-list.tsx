import { Feather } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import {
  toggleHidden,
  updateOrder,
  type InsightCardId,
} from "@/db/queries/insight-preferences";
import { useInsightPreferences } from "@/hooks/useInsightPreferences";
import type { InsightsPeriod } from "@/db/queries/user-preferences";

export interface CardEntry {
  id: InsightCardId;
  node: React.ReactNode;
}

interface CustomizableCardListProps {
  period: InsightsPeriod;
  /** Source of truth: every card the view can render. Order in the array is irrelevant. */
  cards: CardEntry[];
}

/**
 * Renders a list of insight cards in user-customizable order. Long-press
 * any card to enter edit mode where each card grows a drag grip + hide
 * toggle, and a sticky "Done" button exits edit mode.
 *
 * Drag is implemented hand-rolled on top of Pan + LongPress gestures with
 * Reanimated shared values. Lists are short (≤8 cards), so a simple
 * absolute-translate-on-pan approach is enough — no FlatList needed.
 */
export function CustomizableCardList({
  period,
  cards,
}: CustomizableCardListProps): React.ReactElement {
  const { preferences } = useInsightPreferences();
  const order = preferences.orders[period];
  const hidden = preferences.hidden[period];

  const [editMode, setEditMode] = useState(false);

  // Resolve render order: stored order first, then any new cards from the
  // source of truth that haven't been ordered yet (so adding a card in code
  // doesn't require a migration).
  const visibleCards = useMemo<CardEntry[]>(() => {
    const byId = new Map(cards.map((c) => [c.id, c]));
    const ordered: CardEntry[] = [];
    const seen = new Set<InsightCardId>();
    for (const id of order) {
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
  }, [cards, order, hidden]);

  const hiddenCards = useMemo<CardEntry[]>(
    () => cards.filter((c) => hidden.has(c.id)),
    [cards, hidden],
  );

  // Heights captured per index from onLayout. Lives in a SharedValue so the
  // Pan worklet on the UI thread can read it without crossing the bridge.
  const heights = useSharedValue<number[]>([]);
  const onItemLayout = useCallback(
    (index: number, e: LayoutChangeEvent) => {
      const next = [...heights.value];
      next[index] = e.nativeEvent.layout.height;
      heights.value = next;
    },
    [heights],
  );

  // Persist the list of visible card ids in the requested new order.
  // Hidden cards are appended so we don't lose their stored position
  // relative to other visible cards on next un-hide.
  const persistOrder = useCallback(
    (newVisibleIds: InsightCardId[]) => {
      const visibleSet = new Set(newVisibleIds);
      const tail: InsightCardId[] = [];
      // Preserve previously-stored hidden ids, then any cards not yet ordered.
      for (const id of order) {
        if (!visibleSet.has(id)) tail.push(id);
      }
      for (const c of cards) {
        if (!visibleSet.has(c.id) && !tail.includes(c.id)) tail.push(c.id);
      }
      void updateOrder(period, [...newVisibleIds, ...tail]);
    },
    [cards, order, period],
  );

  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      const next = visibleCards.map((c) => c.id);
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      persistOrder(next);
    },
    [persistOrder, visibleCards],
  );

  const handleHide = useCallback(
    (id: InsightCardId) => {
      void toggleHidden(period, id);
    },
    [period],
  );

  return (
    <View style={styles.container}>
      {editMode ? (
        <View style={styles.editToolbar}>
          <Text style={styles.editToolbarLabel}>Edit cards</Text>
          <Pressable
            onPress={() => setEditMode(false)}
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

      {visibleCards.map((card, index) => (
        <DraggableCardItem
          key={card.id}
          index={index}
          totalItems={visibleCards.length}
          card={card}
          editMode={editMode}
          onLongPressEnter={() => setEditMode(true)}
          onLayoutMeasured={onItemLayout}
          heights={heights}
          onReorder={handleReorder}
          onHide={() => handleHide(card.id)}
        />
      ))}

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
              <Feather name="eye-off" size={16} color={COLORS.onSurfaceVariant} />
              <Text style={styles.hiddenRowLabel}>{card.id}</Text>
              <Text style={styles.hiddenRowAction}>Show</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

interface DraggableCardItemProps {
  index: number;
  totalItems: number;
  card: CardEntry;
  editMode: boolean;
  onLongPressEnter: () => void;
  onLayoutMeasured: (index: number, e: LayoutChangeEvent) => void;
  heights: SharedValue<number[]>;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onHide: () => void;
}

function DraggableCardItem({
  index,
  totalItems,
  card,
  editMode,
  onLongPressEnter,
  onLayoutMeasured,
  heights,
  onReorder,
  onHide,
}: DraggableCardItemProps): React.ReactElement {
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(0);

  // Drag-grip pan: only active in edit mode. Translates the card vertically,
  // then on release computes the destination index from cumulative heights
  // of siblings.
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(editMode)
        .onStart(() => {
          isDragging.value = 1;
        })
        .onUpdate((e) => {
          translateY.value = e.translationY;
        })
        .onEnd(() => {
          "worklet";
          const hs = heights.value;
          const offset = translateY.value;
          let targetIndex = index;
          if (offset < 0) {
            // moving up
            let acc = 0;
            for (let i = index - 1; i >= 0; i--) {
              const h = hs[i] ?? 0;
              acc += h;
              if (Math.abs(offset) > acc / 2 + (hs[i + 1] ?? 0) / 4) {
                targetIndex = i;
              } else {
                break;
              }
            }
          } else if (offset > 0) {
            let acc = 0;
            for (let i = index + 1; i < totalItems; i++) {
              const h = hs[i] ?? 0;
              acc += h;
              if (offset > acc / 2 + (hs[i - 1] ?? 0) / 4) {
                targetIndex = i;
              } else {
                break;
              }
            }
          }
          translateY.value = withTiming(0, { duration: 180 });
          isDragging.value = 0;
          if (targetIndex !== index) {
            runOnJS(onReorder)(index, targetIndex);
          }
        }),
    [editMode, heights, index, isDragging, onReorder, totalItems, translateY],
  );

  // Long-press on the whole card enters edit mode. Disabled while already
  // editing so the press doesn't conflict with the drag.
  const longPress = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(380)
        .enabled(!editMode)
        .onStart(() => {
          runOnJS(onLongPressEnter)();
        }),
    [editMode, onLongPressEnter],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    zIndex: isDragging.value === 1 ? 10 : 1,
    opacity: isDragging.value === 1 ? 0.95 : 1,
  }));

  return (
    <GestureDetector gesture={longPress}>
      <Animated.View
        style={[styles.cardWrapper, animatedStyle]}
        onLayout={(e) => onLayoutMeasured(index, e)}
      >
        {card.node}

        {editMode ? (
          <View pointerEvents="box-none" style={styles.overlay}>
            <Pressable
              onPress={onHide}
              hitSlop={8}
              style={({ pressed }) => [
                styles.overlayButton,
                styles.overlayButtonLeft,
                pressed && styles.overlayButtonPressed,
              ]}
              accessibilityLabel="Hide card"
            >
              <Feather name="eye-off" size={16} color={COLORS.onSurface} />
            </Pressable>

            <GestureDetector gesture={panGesture}>
              <Animated.View
                style={[styles.overlayButton, styles.overlayButtonRight]}
              >
                <Feather name="menu" size={18} color={COLORS.onSurface} />
              </Animated.View>
            </GestureDetector>
          </View>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.lg,
  },
  cardWrapper: {
    position: "relative",
  },
  overlay: {
    position: "absolute",
    top: SPACING.sm,
    left: SPACING.sm,
    right: SPACING.sm,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  overlayButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainerHighest,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayButtonLeft: {},
  overlayButtonRight: {},
  overlayButtonPressed: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  editToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.sm,
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
});
