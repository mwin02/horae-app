import { COLORS, SPACING } from "@/constants/theme";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

interface PaginatedRowsProps<T> {
  items: T[];
  pageSize?: number;
  keyExtractor: (item: T, indexInList: number) => string;
  renderItem: (
    item: T,
    indexInPage: number,
    indexInList: number,
  ) => React.ReactNode;
}

/**
 * Splits `items` into pages of `pageSize` rows and renders them as a
 * horizontally-paged carousel with dot indicators. All pages share the
 * height of the first (full) page so the surrounding card doesn't reflow
 * between pages or when swiping to a short final page.
 */
export function PaginatedRows<T>({
  items,
  pageSize = 5,
  keyExtractor,
  renderItem,
}: PaginatedRowsProps<T>): React.ReactElement {
  const pages = useMemo(() => {
    const result: T[][] = [];
    for (let i = 0; i < items.length; i += pageSize) {
      result.push(items.slice(i, i + pageSize));
    }
    return result;
  }, [items, pageSize]);

  const [width, setWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState<number | undefined>(undefined);
  const [activeIndex, setActiveIndex] = useState(0);

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.width;
    setWidth((prev) => (prev === next ? prev : next));
  }, []);

  const onFirstPageLayout = useCallback((e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.height;
    setPageHeight((prev) => (prev != null && prev >= next ? prev : next));
  }, []);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (width === 0) return;
      const idx = Math.round(e.nativeEvent.contentOffset.x / width);
      setActiveIndex((prev) => (prev === idx ? prev : idx));
    },
    [width],
  );

  if (pages.length <= 1) {
    return (
      <View>
        {(pages[0] ?? []).map((item, i) => (
          <React.Fragment key={keyExtractor(item, i)}>
            {renderItem(item, i, i)}
          </React.Fragment>
        ))}
      </View>
    );
  }

  return (
    <View onLayout={onContainerLayout}>
      {width > 0 ? (
        <FlatList
          data={pages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyExtractor={(_, i) => `page-${i}`}
          renderItem={({ item: page, index: pageIdx }) => (
            <View
              style={{ width, minHeight: pageHeight }}
              onLayout={pageIdx === 0 ? onFirstPageLayout : undefined}
            >
              {page.map((item, i) => {
                const indexInList = pageIdx * pageSize + i;
                return (
                  <React.Fragment key={keyExtractor(item, indexInList)}>
                    {renderItem(item, i, indexInList)}
                  </React.Fragment>
                );
              })}
            </View>
          )}
        />
      ) : null}
      <View style={styles.dotsRow}>
        {pages.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: SPACING.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.outlineVariant,
  },
  dotActive: {
    width: 16,
    backgroundColor: COLORS.onSurfaceVariant,
  },
});
