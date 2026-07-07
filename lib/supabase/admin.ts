/**
 * Service-role Supabase client — SERVER ONLY.
 *
 * Bypasses RLS. Used strictly in trusted server contexts (the reminder cron and
 * the notification hooks) to read across all bookings and resolve auth emails.
 * NEVER import this into a Client Component. Returns null when the key is absent
 * so callers can degrade gracefully instead of crashing.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export function createAdminClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
