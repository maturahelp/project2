import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

/**
 * Refreshes the Supabase session on every request (keeps tokens fresh so the
 * session persists on refresh) and protects role-scoped areas:
 *   - /dashboard → майстори only
 *   - /account   → clients only
 * Logged-out users hitting either are sent to /vhod.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    // Without env vars we can't authenticate; let the request through so the
    // app surfaces the missing-config error instead of an opaque redirect loop.
    return response;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: getUser() revalidates the token with Supabase Auth.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isDashboard = path.startsWith("/dashboard");
  const isAccount = path.startsWith("/account");

  if (isDashboard || isAccount) {
    if (!user) return redirectTo(request, response, "/vhod");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = profile?.role ?? null;

    if (isDashboard && role !== "maistor") {
      return redirectTo(request, response, role === "client" ? "/account" : "/vhod");
    }
    if (isAccount && role !== "client") {
      return redirectTo(request, response, role === "maistor" ? "/dashboard" : "/vhod");
    }
  }

  return response;
}

/** Redirect while preserving any auth cookies refreshed on `response`. */
function redirectTo(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
