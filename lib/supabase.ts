import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client wrapper.
 *
 * The v1 launch is local-only — no auth, no sync. EAS production builds
 * intentionally don't have EXPO_PUBLIC_SUPABASE_URL or
 * EXPO_PUBLIC_SUPABASE_ANON_KEY set, and the `(auth)` UI is hidden in
 * Settings. To keep module load side-effect-free in that configuration
 * (so the app doesn't crash at startup), we:
 *   - Skip `createClient` when env vars are missing.
 *   - Expose `isSupabaseConfigured` so callers (mainly `useAuth`) can
 *     short-circuit instead of touching `supabase`.
 *   - Expose `supabase` as a Proxy that errors only on actual property
 *     access — preserves the existing `import { supabase }` ergonomic
 *     for the eventual Phase 3 sync work without breaking module load.
 */

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const realClient: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export const isSupabaseConfigured = realClient !== null;

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!realClient) {
      throw new Error(
        "Supabase is not configured for this build. Set " +
          "EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in " +
          "the EAS environment (or local .env for dev) to enable auth.",
      );
    }
    return Reflect.get(realClient, prop, realClient);
  },
});
