import { Feather } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DeleteDataModal } from "@/components/manage/delete-data-modal";
import { ImportDataModal } from "@/components/manage/import-data-modal";
import { SettingRow } from "@/components/settings/setting-row";
import { SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import {
  deleteAllTimeEntries,
  deleteAllUserData,
} from "@/db/queries/data-management";
import { exportTimeEntriesAsCsv } from "@/lib/export-csv";
import { exportDataAsJson } from "@/lib/export-json";
import {
  ImportError,
  pickAndImportJson,
  type ImportMode,
  type ImportSummary,
} from "@/lib/import-json";

type DeleteScope = "entries" | "all";

const DELETE_COPY: Record<
  DeleteScope,
  { title: string; description: string; bullets: string[] }
> = {
  entries: {
    title: "Delete time entries",
    description:
      "Permanently removes every tracked entry from this device. Your categories, activities, tags, and preferences are kept so you can keep tracking right away. Export a backup first if you might want this data later.",
    bullets: ["All time entries", "All entry-tag links", "Daily summaries"],
  },
  all: {
    title: "Delete all data",
    description:
      "Wipes everything on this device and resets the app to a fresh state. Preset categories and default preferences are restored after. Export a backup first if you might want this data later.",
    bullets: [
      "Time entries, categories, activities, tags",
      "Goals and notification preferences",
      "Anything you've customized",
    ],
  },
};

const FRIENDLY_TABLE_NAMES: Record<string, string> = {
  categories: "categories",
  activities: "activities",
  time_entries: "time entries",
  ideal_allocations: "goals",
  tags: "tags",
  entry_tags: "entry tags",
  notification_preferences: "notification preferences",
  user_preferences: "preferences",
  insight_preferences: "insights layout",
};

function formatImportSummary(summary: ImportSummary): string {
  const addedParts: string[] = [];
  let skippedTotal = 0;
  for (const [table, count] of Object.entries(summary.inserted)) {
    if (count > 0) {
      const label = FRIENDLY_TABLE_NAMES[table] ?? table;
      addedParts.push(`${count} ${label}`);
    }
  }
  for (const count of Object.values(summary.skipped)) {
    skippedTotal += count;
  }

  const lines: string[] = [];
  if (addedParts.length === 0) {
    lines.push("Nothing new to add — your device already has it all.");
  } else {
    lines.push(`Added ${addedParts.join(", ")}.`);
  }
  if (skippedTotal > 0 && summary.mode === "merge") {
    lines.push(
      `Skipped ${skippedTotal} ${
        skippedTotal === 1 ? "item" : "items"
      } that were already on this device.`,
    );
  }
  return lines.join(" ");
}

export default function ManageDataScreen(): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [deleteScope, setDeleteScope] = useState<DeleteScope | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const runJsonExport = useCallback(async () => {
    if (isExportingJson) return;
    setIsExportingJson(true);
    try {
      await exportDataAsJson();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Export failed", message);
    } finally {
      setIsExportingJson(false);
    }
  }, [isExportingJson]);

  const handleExportCsv = useCallback(async () => {
    if (isExportingCsv) return;
    setIsExportingCsv(true);
    try {
      await exportTimeEntriesAsCsv();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Export failed", message);
    } finally {
      setIsExportingCsv(false);
    }
  }, [isExportingCsv]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteScope) return;
    try {
      if (deleteScope === "entries") {
        await deleteAllTimeEntries();
      } else {
        await deleteAllUserData();
      }
      setDeleteScope(null);
      Alert.alert(
        "Deleted",
        deleteScope === "entries"
          ? "All time entries were removed."
          : "All data was wiped and presets were restored.",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[manage-data] delete failed:", error);
      Alert.alert("Delete failed", message);
    }
  }, [deleteScope]);

  const handleImport = useCallback(
    async (mode: ImportMode): Promise<ImportSummary | null> => {
      try {
        const summary = await pickAndImportJson(mode);
        if (summary) {
          setIsImportModalOpen(false);
          Alert.alert("Restore complete", formatImportSummary(summary));
        }
        return summary;
      } catch (error) {
        const message =
          error instanceof ImportError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Unknown error";
        Alert.alert("Couldn't read that file", message);
        return null;
      }
    },
    [],
  );

  const copy = deleteScope ? DELETE_COPY[deleteScope] : null;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: "Manage data" }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Manage data</Text>
          <Text style={styles.subtitle}>
            Back up what you&apos;ve tracked, bring it back later, or start
            fresh.
          </Text>
        </View>

        <View style={styles.aboutCard}>
          <View style={styles.aboutHeader}>
            <Feather
              name="hard-drive"
              size={18}
              color={colors.onPrimaryContainer}
            />
            <Text style={styles.aboutTitle}>
              Your data lives on this device
            </Text>
          </View>
          <Text style={styles.aboutBody}>
            Everything you track is stored only inside the app. If you delete
            the app,{" "}
            <Text style={styles.warning}>you will lose all of your data.</Text>
          </Text>
          <Text style={styles.aboutBody}>
            Export a backup file every so often — you can restore it later from
            this same screen. Full iCloud or iPhone backups also include the
            app&apos;s data if you ever restore the whole device.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Back up</Text>
        <View style={styles.group}>
          <SettingRow
            title="Export a backup (JSON)"
            description={
              isExportingJson
                ? "Preparing export…"
                : "Save a complete copy you can restore later"
            }
            onPress={runJsonExport}
            disabled={isExportingJson}
            iconBackground={colors.surfaceContainer}
            iconChildren={
              <Feather name="download" size={20} color={colors.primary} />
            }
          />
          <SettingRow
            title="Export time entries (CSV)"
            description={
              isExportingCsv
                ? "Preparing export…"
                : "Spreadsheet-friendly: one row per tracked entry"
            }
            onPress={handleExportCsv}
            disabled={isExportingCsv}
            iconBackground={colors.surfaceContainer}
            iconChildren={
              <Feather name="file-text" size={20} color={colors.primary} />
            }
          />
        </View>

        <Text style={styles.sectionLabel}>Restore</Text>
        <View style={styles.group}>
          <SettingRow
            title="Restore from a backup"
            description="Bring data back from a JSON file you exported"
            onPress={() => setIsImportModalOpen(true)}
            iconBackground={colors.surfaceContainer}
            iconChildren={
              <Feather name="upload" size={20} color={colors.primary} />
            }
          />
        </View>

        <Text style={styles.sectionLabel}>Danger zone</Text>
        <View style={styles.group}>
          <SettingRow
            title="Delete time entries"
            description="Wipe all tracked entries; keep categories, activities, tags"
            onPress={() => setDeleteScope("entries")}
            iconBackground={colors.surfaceContainer}
            iconChildren={
              <Feather name="trash-2" size={20} color={colors.error} />
            }
          />
          <SettingRow
            title="Delete all data"
            description="Reset everything on this device and restore presets"
            onPress={() => setDeleteScope("all")}
            iconBackground={colors.surfaceContainer}
            iconChildren={
              <Feather name="alert-triangle" size={20} color={colors.error} />
            }
          />
        </View>
      </ScrollView>

      <ImportDataModal
        visible={isImportModalOpen}
        exporting={isExportingJson}
        onExportFirst={runJsonExport}
        onPicked={handleImport}
        onClose={() => setIsImportModalOpen(false)}
      />

      <DeleteDataModal
        visible={deleteScope !== null}
        title={copy?.title ?? ""}
        description={copy?.description ?? ""}
        bullets={copy?.bullets ?? []}
        exporting={isExportingJson}
        onExportFirst={runJsonExport}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteScope(null)}
      />
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.surface,
    },
    scrollContent: {
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING["4xl"],
      gap: SPACING.md,
    },
    header: {
      paddingHorizontal: SPACING.xs,
      paddingTop: SPACING.md,
      gap: SPACING.xs,
    },
    title: {
      ...TYPOGRAPHY.headingXl,
      color: c.onSurface,
    },
    warning: {
      color: c.error,
    },
    subtitle: {
      ...TYPOGRAPHY.body,
      color: c.onSurfaceVariant,
    },
    sectionLabel: {
      ...TYPOGRAPHY.labelUppercase,
      color: c.onSurfaceVariant,
      marginTop: SPACING.lg,
      marginBottom: SPACING.xs,
      paddingHorizontal: SPACING.xs,
    },
    group: {
      gap: SPACING.sm,
    },
    aboutCard: {
      backgroundColor: c.primaryContainer,
      borderRadius: 20,
      padding: SPACING.lg,
      marginTop: SPACING.md,
      gap: SPACING.sm,
    },
    aboutHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    aboutTitle: {
      ...TYPOGRAPHY.titleMd,
      color: c.onPrimaryContainer,
      flex: 1,
    },
    aboutBody: {
      ...TYPOGRAPHY.body,
      color: c.onPrimaryContainer,
    },
  });
}
