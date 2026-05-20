/**
 * Preset categories and activities seeded on first launch.
 * These have is_preset = 1 and user_id = null (system-owned).
 *
 * Ids are stable, slug-based strings (NOT random UUIDs) so that:
 *   - Export → "Delete all data" → import round-trips cleanly without
 *     producing duplicate categories (re-seed reuses the same ids).
 *   - Phase 3 cloud sync can treat presets as server-owned globals
 *     with deterministic identity across devices.
 *
 * Never change an existing id — it would orphan every time_entry and
 * goal that references it. Renames of `name`/`color`/`icon` are fine.
 */

export interface PresetActivity {
  id: string;
  name: string;
}

export interface PresetCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  activities: PresetActivity[];
}

export const PRESET_CATEGORIES: PresetCategory[] = [
  {
    id: "preset-cat-work",
    name: "Work",
    color: "#4A90D9",
    icon: "briefcase",
    activities: [
      { id: "preset-act-work-deep-work", name: "Deep Work" },
      { id: "preset-act-work-meetings", name: "Meetings" },
      { id: "preset-act-work-email", name: "Email" },
      { id: "preset-act-work-admin", name: "Admin" },
      { id: "preset-act-work-commute", name: "Commute" },
    ],
  },
  {
    id: "preset-cat-health-fitness",
    name: "Health & Fitness",
    color: "#E74C3C",
    icon: "heart",
    activities: [
      { id: "preset-act-health-exercise", name: "Exercise" },
      { id: "preset-act-health-stretching", name: "Stretching" },
      { id: "preset-act-health-walking", name: "Walking" },
      { id: "preset-act-health-sports", name: "Sports" },
    ],
  },
  {
    id: "preset-cat-sleep",
    name: "Sleep",
    color: "#8E44AD",
    icon: "moon",
    activities: [
      { id: "preset-act-sleep-night-sleep", name: "Night Sleep" },
      { id: "preset-act-sleep-nap", name: "Nap" },
    ],
  },
  {
    id: "preset-cat-meals",
    name: "Meals",
    color: "#F39C12",
    icon: "utensils",
    activities: [
      { id: "preset-act-meals-breakfast", name: "Breakfast" },
      { id: "preset-act-meals-lunch", name: "Lunch" },
      { id: "preset-act-meals-dinner", name: "Dinner" },
      { id: "preset-act-meals-snack", name: "Snack" },
      { id: "preset-act-meals-cooking", name: "Cooking" },
    ],
  },
  {
    id: "preset-cat-social",
    name: "Social",
    color: "#E91E63",
    icon: "users",
    activities: [
      { id: "preset-act-social-friends", name: "Friends" },
      { id: "preset-act-social-family", name: "Family" },
      { id: "preset-act-social-phone-calls", name: "Phone Calls" },
      { id: "preset-act-social-messaging", name: "Messaging" },
    ],
  },
  {
    id: "preset-cat-learning",
    name: "Learning",
    color: "#2ECC71",
    icon: "book",
    activities: [
      { id: "preset-act-learning-reading", name: "Reading" },
      { id: "preset-act-learning-online-course", name: "Online Course" },
      { id: "preset-act-learning-studying", name: "Studying" },
      { id: "preset-act-learning-practice", name: "Practice" },
    ],
  },
  {
    id: "preset-cat-entertainment",
    name: "Entertainment",
    color: "#9B59B6",
    icon: "gamepad",
    activities: [
      { id: "preset-act-entertainment-tv-movies", name: "TV / Movies" },
      { id: "preset-act-entertainment-gaming", name: "Gaming" },
      { id: "preset-act-entertainment-social-media", name: "Social Media" },
      { id: "preset-act-entertainment-music", name: "Music" },
    ],
  },
  {
    id: "preset-cat-personal-care",
    name: "Personal Care",
    color: "#1ABC9C",
    icon: "spa",
    activities: [
      { id: "preset-act-personal-care-hygiene", name: "Hygiene" },
      { id: "preset-act-personal-care-meditation", name: "Meditation" },
      { id: "preset-act-personal-care-journaling", name: "Journaling" },
      { id: "preset-act-personal-care-therapy", name: "Therapy" },
    ],
  },
  {
    id: "preset-cat-chores",
    name: "Chores",
    color: "#95A5A6",
    icon: "home",
    activities: [
      { id: "preset-act-chores-cleaning", name: "Cleaning" },
      { id: "preset-act-chores-laundry", name: "Laundry" },
      { id: "preset-act-chores-groceries", name: "Groceries" },
      { id: "preset-act-chores-errands", name: "Errands" },
      { id: "preset-act-chores-repairs", name: "Repairs" },
    ],
  },
  {
    id: "preset-cat-travel",
    name: "Travel",
    color: "#3498DB",
    icon: "plane",
    activities: [
      { id: "preset-act-travel-driving", name: "Driving" },
      { id: "preset-act-travel-public-transit", name: "Public Transit" },
      { id: "preset-act-travel-walking", name: "Walking" },
      { id: "preset-act-travel-flying", name: "Flying" },
    ],
  },
];
