"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, getRoleHome } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

/** Log in with email + password, then redirect to the role-appropriate home. */
export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Въведете имейл и парола." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Грешен имейл или парола." };
  }

  redirect(await getRoleHome());
}

/** Sign up as a майстор or client; the DB trigger creates the profiles row. */
export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const role = String(formData.get("role") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (role !== "maistor" && role !== "client") {
    return { error: "Изберете дали сте майстор или търсите майстор." };
  }
  if (!fullName) {
    return { error: "Въведете вашето име." };
  }
  if (!email) {
    return { error: "Въведете имейл." };
  }
  if (password.length < 6) {
    return { error: "Паролата трябва да е поне 6 символа." };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? undefined;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, full_name: fullName },
      emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
    },
  });

  if (error) {
    const code = error.code ?? "";
    const msg = error.message.toLowerCase();
    if (code === "user_already_exists" || msg.includes("already")) {
      return { error: "Вече съществува акаунт с този имейл." };
    }
    if (code === "email_address_invalid" || msg.includes("invalid")) {
      return { error: "Въведете валиден имейл адрес." };
    }
    if (code === "over_email_send_rate_limit" || msg.includes("rate limit")) {
      return { error: "Твърде много опити. Опитайте отново по-късно." };
    }
    if (code === "weak_password" || msg.includes("password")) {
      return { error: "Паролата е твърде слаба. Използвайте поне 6 символа." };
    }
    return { error: "Регистрацията не бе успешна. Опитайте отново." };
  }

  // Email confirmation OFF → session is returned immediately, log the user in.
  if (data.session) {
    redirect(role === "maistor" ? "/dashboard" : "/account");
  }

  // Email confirmation ON → no session yet; ask the user to confirm.
  return {
    message:
      "Изпратихме ви имейл за потвърждение. Отворете го, за да активирате акаунта си.",
  };
}

/** Log out and return to the login page. */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/vhod");
}
