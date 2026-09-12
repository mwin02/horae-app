import { v5 as uuidv5 } from "uuid";

import { PRESET_CATEGORIES } from "@/constants/presets";
import i18n from "@/lib/i18n";
import en from "@/locales/en";

/**
 * Display-time translation of preset category / activity names.
 *
 * Preset names are stored in English in the DB and must stay that way:
 * server preset ids are uuid v5 hashes of the English name, presets sync as
 * one shared read-only row for every user, and routine recommendations match
 * on the English activity name. So we translate when rendering instead:
 *
 *   - id is a preset AND stored name still equals the seeded English name
 *     → show the translation for the current language.
 *   - otherwise (custom row, or a preset the user renamed) → stored name.
 *
 * Recognizes both local slug ids (`preset-cat-work`) and the Phase 3 server
 * ids (uuid v5, see supabase/seed.sql) so translation survives the id remap.
 */

// Mirrors `_seed_preset_namespace()` in supabase/seed.sql. Never change.
const PRESET_UUID_NAMESPACE = "b6c1f4d2-7e9a-5c43-9f0b-2a8e3d6f1c00";

type CategoryKey = keyof typeof en.presets.categories;
type ActivityKey = keyof typeof en.presets.activities;

interface PresetEntry<K> {
  key: K;
  english: string;
}

interface PresetIndexes {
  categories: Map<string, PresetEntry<CategoryKey>>;
  activities: Map<string, PresetEntry<ActivityKey>>;
}

let indexes: PresetIndexes | null = null;

function getIndexes(): PresetIndexes {
  if (indexes) return indexes;
  const categories = new Map<string, PresetEntry<CategoryKey>>();
  const activities = new Map<string, PresetEntry<ActivityKey>>();

  for (const category of PRESET_CATEGORIES) {
    const catEntry = {
      key: category.id.replace(/^preset-cat-/, "") as CategoryKey,
      english: category.name,
    };
    categories.set(category.id, catEntry);
    categories.set(
      uuidv5(`category:${category.name}`, PRESET_UUID_NAMESPACE),
      catEntry,
    );
    if (__DEV__ && en.presets.categories[catEntry.key] !== category.name) {
      console.warn(`[i18n] presets.categories.${catEntry.key} drifted from constants/presets.ts`);
    }

    for (const activity of category.activities) {
      const actEntry = {
        key: activity.id.replace(/^preset-act-/, "") as ActivityKey,
        english: activity.name,
      };
      activities.set(activity.id, actEntry);
      activities.set(
        uuidv5(`activity:${category.name}:${activity.name}`, PRESET_UUID_NAMESPACE),
        actEntry,
      );
      if (__DEV__ && en.presets.activities[actEntry.key] !== activity.name) {
        console.warn(`[i18n] presets.activities.${actEntry.key} drifted from constants/presets.ts`);
      }
    }
  }

  indexes = { categories, activities };
  return indexes;
}

/** Name to display for a category row in the current language. */
export function localizeCategoryName(id: string, storedName: string): string {
  const preset = getIndexes().categories.get(id);
  if (!preset || preset.english !== storedName) return storedName;
  return i18n.t(`presets.categories.${preset.key}`);
}

/** Name to display for an activity row in the current language. */
export function localizeActivityName(id: string, storedName: string): string {
  const preset = getIndexes().activities.get(id);
  if (!preset || preset.english !== storedName) return storedName;
  return i18n.t(`presets.activities.${preset.key}`);
}
