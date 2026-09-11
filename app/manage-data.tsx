import { Feather } from "@expo/vector-icons";
import { Stack } from "expo-router";
import type { TFunction } from "i18next";
import React, { useCallback, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
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

function deleteCopy(
  scope: DeleteScope,
  t: TFunction,
): { title: string; description: string; bullets: string[] } {
  if (scope === "entries") {
    return {
      title: t("manageData.deleteEntries"),
      description: t("manageData.deleteEntriesModalDescription"),
      bullets: [
        t("manageData.deleteEntriesBullet1"),
        t("manageData.deleteEntriesBullet2"),
        t("manageData.deleteEntriesBullet3"),
      ],
    };
  }
  return {
    title: t("manageData.deleteAll"),
    description: t("manageData.deleteAllModalDescription"),
    bullets: [
      t("manageData.deleteAllBullet1"),
      t("manageData.deleteAllBullet2"),
      t("manageData.deleteAllBullet3"),
    ],
  };
}

const FRIENDLY_TABLES = [
  "categories",
  "activities",
  "time_entries",
  "ideal_allocations",
  "tags",
  "entry_tags",
  "notification_preferences",
  "user_preferences",
  "insight_preferences",
] as const;

type FriendlyTable = (typeof FRIENDLY_TABLES)[number];

function isFriendlyTable(table: string): table is FriendlyTable {
  return (FRIENDLY_TABLES as readonly string[]).includes(table);
}

function formatImportSummary(summary: ImportSummary, t: TFunction): string {
  const addedParts: string[] = [];
  let skippedTotal = 0;
  for (const [table, count] of Object.entries(summary.inserted)) {
    if (count > 0) {
      addedParts.push(
        isFriendlyTable(table)
          ? t(`manageData.tables.${table}`, { count })
          : `${count} ${table}`,
      );
    }
  }
  for (const count of Object.values(summary.skipped)) {
    skippedTotal += count;
  }

  const lines: string[] = [];
  if (addedParts.length === 0) {
    lines.push(t("manageData.importNothingNew"));
  } else {
    lines.push(
      t("manageData.importAdded", {
        items: addedParts.join(t("common.listSeparator")),
      }),
    );
  }
  if (skippedTotal > 0 && summary.mode === "merge") {
    lines.push(t("manageData.importSkipped", { count: skippedTotal }));
  }
  return lines.join(" ");
}

export default function ManageDataScreen(): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { t } = useTranslation();
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
      const message =
        error instanceof Error ? error.message : t("common.unknownError");
      Alert.alert(t("manageData.exportFailed"), message);
    } finally {
      setIsExportingJson(false);
    }
  }, [isExportingJson, t]);

  const handleExportCsv = useCallback(async () => {
    if (isExportingCsv) return;
    setIsExportingCsv(true);
    try {
      await exportTimeEntriesAsCsv();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("common.unknownError");
      Alert.alert(t("manageData.exportFailed"), message);
    } finally {
      setIsExportingCsv(false);
    }
  }, [isExportingCsv, t]);

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
        t("manageData.deleted"),
        deleteScope === "entries"
          ? t("manageData.deletedEntries")
          : t("manageData.deletedAll"),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("common.unknownError");
      console.error("[manage-data] delete failed:", error);
      Alert.alert(t("manageData.deleteFailed"), message);
    }
  }, [deleteScope, t]);

  const handleImport = useCallback(
    async (mode: ImportMode): Promise<ImportSummary | null> => {
      try {
        const summary = await pickAndImportJson(mode);
        if (summary) {
          setIsImportModalOpen(false);
          Alert.alert(
            t("manageData.restoreComplete"),
            formatImportSummary(summary, t),
          );
        }
        return summary;
      } catch (error) {
        const message =
          error instanceof ImportError
            ? error.message
            : error instanceof Error
              ? error.message
              : t("common.unknownError");
        Alert.alert(t("manageData.cantReadFile"), message);
        return null;
      }
    },
    [t],
  );

  const copy = deleteScope ? deleteCopy(deleteScope, t) : null;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: t("manageData.title") }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t("manageData.title")}</Text>
          <Text style={styles.subtitle}>{t("manageData.subtitle")}</Text>
        </View>

        <View style={styles.aboutCard}>
          <View style={styles.aboutHeader}>
            <Feather
              name="hard-drive"
              size={18}
              color={colors.onPrimaryContainer}
            />
            <Text style={styles.aboutTitle}>{t("manageData.aboutTitle")}</Text>
          </View>
          <Text style={styles.aboutBody}>
            <Trans
              i18nKey="manageData.aboutBodyWarning"
              components={{ warn: <Text style={styles.warning} /> }}
            />
          </Text>
          <Text style={styles.aboutBody}>{t("manageData.aboutBodyBackup")}</Text>
        </View>

        <Text style={styles.sectionLabel}>{t("manageData.sectionBackup")}</Text>
        <View style={styles.group}>
          <SettingRow
            title={t("manageData.exportJson")}
            description={
              isExportingJson
                ? t("manageData.preparingExport")
                : t("manageData.exportJsonDescription")
            }
            onPress={runJsonExport}
            disabled={isExportingJson}
            iconBackground={colors.surfaceContainer}
            iconChildren={
              <Feather name="download" size={20} color={colors.primary} />
            }
          />
          <SettingRow
            title={t("manageData.exportCsv")}
            description={
              isExportingCsv
                ? t("manageData.preparingExport")
                : t("manageData.exportCsvDescription")
            }
            onPress={handleExportCsv}
            disabled={isExportingCsv}
            iconBackground={colors.surfaceContainer}
            iconChildren={
              <Feather name="file-text" size={20} color={colors.primary} />
            }
          />
        </View>

        <Text style={styles.sectionLabel}>{t("manageData.sectionRestore")}</Text>
        <View style={styles.group}>
          <SettingRow
            title={t("manageData.restore")}
            description={t("manageData.restoreDescription")}
            onPress={() => setIsImportModalOpen(true)}
            iconBackground={colors.surfaceContainer}
            iconChildren={
              <Feather name="upload" size={20} color={colors.primary} />
            }
          />
        </View>

        <Text style={styles.sectionLabel}>{t("manageData.sectionDanger")}</Text>
        <View style={styles.group}>
          <SettingRow
            title={t("manageData.deleteEntries")}
            description={t("manageData.deleteEntriesDescription")}
            onPress={() => setDeleteScope("entries")}
            iconBackground={colors.surfaceContainer}
            iconChildren={
              <Feather name="trash-2" size={20} color={colors.error} />
            }
          />
          <SettingRow
            title={t("manageData.deleteAll")}
            description={t("manageData.deleteAllDescription")}
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
