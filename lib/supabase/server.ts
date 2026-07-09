/**
 * Server-side Supabase client + session helper for Майстор24.
 *
 * Uses the request cookies (via next/headers) so Server Components, Server
 * Actions and Route Handlers share the authenticated session. Reads:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * The SUPABASE_SERVICE_ROLE_KEY may be used ONLY in trusted server contexts,
 * never sent to the browser.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component where cookies are read-only.
          // Session refresh is handled by middleware, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Returns the role-appropriate home path for the current user,
 * or `/vhod` when there is no authenticated user. A майстор who hasn't
 * finished the onboarding wizard yet is resumed there instead of landing on
 * an empty dashboard.
 */
export async function getRoleHome(): Promise<
  "/dashboard" | "/dashboard/onboarding" | "/account" | "/vhod"
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/vhod";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "maistor") return "/account";

  const { data: maistorProfile } = await supabase
    .from("maistor_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return maistorProfile ? "/dashboard" : "/dashboard/onboarding";
}
