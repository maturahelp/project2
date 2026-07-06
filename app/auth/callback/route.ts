import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Email-confirmation callback. Supabase redirects here with a `code` after the
 * user clicks the confirmation link; we exchange it for a session and route the
 * user to their role home.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const home = profile?.role === "maistor" ? "/dashboard" : "/account";
        return NextResponse.redirect(`${origin}${home}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/vhod`);
}
