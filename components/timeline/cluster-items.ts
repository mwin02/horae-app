import type {
  TimelineCluster,
  TimelineEntryData,
  TimelineItem,
} from "@/hooks/useTimelineData";

/**
 * Configuration that mirrors the canvas's rendering constants, so the
 * clustering pass makes decisions consistent with how items will actually be
 * drawn.
 */
export interface ClusterConfig {
  pixelsPerMinute: number;
  minBlockHeight: number;
  minGapVisualHeight: number;
  chipMaxMinutes: number;
  chipHeight: number;
}

function durationSeconds(item: TimelineItem): number {
  if (item.type === "gap") return item.data.durationSeconds;
  if (item.type === "cluster") {
    return (
      (item.data.endedAt.getTime() - item.data.startedAt.getTime()) / 1000
    );
  }
  const end = item.data.endedAt ?? item.data.startedAt;
  return (end.getTime() - item.data.startedAt.getTime()) / 1000;
}

function naturalHeight(item: TimelineItem, config: ClusterConfig): number {
  const secs = Math.max(0, durationSeconds(item));
  return (secs / 60) * config.pixelsPerMinute;
}

function visualHeight(item: TimelineItem, config: ClusterConfig): number {
  const nat = naturalHeight(item, config);
  if (item.type === "gap") return nat;
  if (item.type === "entry" && item.data.isRunning) return nat;
  if (item.type === "entry") {
    const chipThreshold = config.chipMaxMinutes * config.pixelsPerMinute;
    if (nat < chipThreshold) return config.chipHeight;
  }
  return Math.max(config.minBlockHeight, nat);
}

function overshoot(item: TimelineItem, config: ClusterConfig): number {
  return Math.max(0, visualHeight(item, config) - naturalHeight(item, config));
}

function gapCapacity(item: TimelineItem, config: ClusterConfig): number {
  if (item.type !== "gap") return 0;
  return Math.max(0, visualHeight(item, config) - config.minGapVisualHeight);
}

function isClusterCandidate(item: TimelineItem): boolean {
  if (item.type === "cluster") return true;
  return item.type === "entry" && !item.data.isRunning;
}

interface NeighborInfo {
  /** Index of the entry/cluster neighbor we'd merge with, or -1 if none. */
  index: number;
  /** Index of the gap item between us and the neighbor, or -1 if directly adjacent. */
  gapIndex: number;
}

function findPrev(items: TimelineItem[], i: number): NeighborInfo {
  if (i === 0) return { index: -1, gapIndex: -1 };
  const prev = items[i - 1];
  if (prev.type === "gap") {
    if (i < 2) return { index: -1, gapIndex: i - 1 };
    return {
      index: isClusterCandidate(items[i - 2]) ? i - 2 : -1,
      gapIndex: i - 1,
    };
  }
  return { index: isClusterCandidate(prev) ? i - 1 : -1, gapIndex: -1 };
}

function findNext(items: TimelineItem[], i: number): NeighborInfo {
  if (i >= items.length - 1) return { index: -1, gapIndex: -1 };
  const next = items[i + 1];
  if (next.type === "gap") {
    if (i + 2 >= items.length) return { index: -1, gapIndex: i + 1 };
    return {
      index: isClusterCandidate(items[i + 2]) ? i + 2 : -1,
      gapIndex: i + 1,
    };
  }
  return { index: isClusterCandidate(next) ? i + 1 : -1, gapIndex: -1 };
}

/**
 * Merge items[lo..hi] (inclusive) into a single cluster. Any gaps in the
 * range are absorbed (their time becomes part of the cluster's span).
 */
function mergeRange(
  items: TimelineItem[],
  lo: number,
  hi: number,
): TimelineCluster {
  const entries: TimelineEntryData[] = [];
  let start: Date | null = null;
  let end: Date | null = null;
  let totalSec = 0;
  let allDimmed = true;

  for (let k = lo; k <= hi; k++) {
    const it = items[k];
    if (it.type === "gap") continue;
    if (it.type === "entry") {
      entries.push(it.data);
      if (!it.data.dimmed) allDimmed = false;
      totalSec += it.data.durationSeconds ?? 0;
      if (!start || it.data.startedAt < start) start = it.data.startedAt;
      const e = it.data.endedAt ?? it.data.startedAt;
      if (!end || e > end) end = e;
    } else {
      // cluster
      for (const ent of it.data.entries) {
        entries.push(ent);
        if (!ent.dimmed) allDimmed = false;
      }
      totalSec += it.data.totalDurationSeconds;
      if (!start || it.data.startedAt < start) start = it.data.startedAt;
      if (!end || it.data.endedAt > end) end = it.data.endedAt;
    }
  }

  entries.sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
  );

  // Dominant = longest real duration (fall back to durationSeconds).
  let dominant = entries[0];
  let dominantDur =
    dominant.realDurationSeconds ?? dominant.durationSeconds ?? 0;
  for (const ent of entries) {
    const d = ent.realDurationSeconds ?? ent.durationSeconds ?? 0;
    if (d > dominantDur) {
      dominant = ent;
      dominantDur = d;
    }
  }

  // Mark as mixed (rendered as long+tail) only when there's actually a
  // dominant — i.e. ≥1 entry significantly larger than the others.
  // Heuristic: dominant takes >50% of total entry duration.
  const dominantShare =
    totalSec > 0 ? dominantDur / totalSec : 1 / entries.length;

  return {
    entries,
    startedAt: start as Date,
    endedAt: end as Date,
    totalDurationSeconds: totalSec,
    dimmed: allDimmed,
    dominantEntryId: dominantShare > 0.5 ? dominant.id : undefined,
  };
}

/**
 * One scan of the items list. Returns a new list with the first
 * non-absorbable overshoot merged into its preferred neighbor, or the
 * original list reference if no merge was needed.
 */
function singlePass(
  items: TimelineItem[],
  config: ClusterConfig,
): TimelineItem[] {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!isClusterCandidate(item)) continue;
    const o = overshoot(item, config);
    if (o <= 0) continue;

    const prev = findPrev(items, i);
    const next = findNext(items, i);
    const capBefore =
      prev.gapIndex >= 0 ? gapCapacity(items[prev.gapIndex], config) : 0;
    const capAfter =
      next.gapIndex >= 0 ? gapCapacity(items[next.gapIndex], config) : 0;
    if (capBefore + capAfter >= o) continue;

    let lo: number;
    let hi: number;
    if (prev.index >= 0) {
      lo = prev.index;
      hi = i;
    } else if (next.index >= 0) {
      lo = i;
      hi = next.index;
    } else {
      continue;
    }

    const merged: TimelineItem = { type: "cluster", data: mergeRange(items, lo, hi) };
    return [...items.slice(0, lo), merged, ...items.slice(hi + 1)];
  }
  return items;
}

/**
 * Iteratively cluster short entries with adjacent neighbors when surrounding
 * gaps can't absorb their overshoot. Returns a new list of items; the input
 * is not mutated. Idempotent — calling it again on the result is a no-op.
 */
export function clusterTimelineItems(
  items: TimelineItem[],
  config: ClusterConfig,
): TimelineItem[] {
  let current = items;
  const maxIter = items.length + 1;
  for (let iter = 0; iter < maxIter; iter++) {
    const next = singlePass(current, config);
    if (next === current) return current;
    current = next;
  }
  return current;
}
