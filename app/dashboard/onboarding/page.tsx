import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata = { title: "Изгради своя профил — Майстор24" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/vhod");

  const { data: existing } = await supabase
    .from("maistor_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) redirect("/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <section className="container py-10 md:py-14">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Изгради своя профил
        </h1>
        <p className="mt-2 text-muted-foreground">
          Отговорете на няколко въпроса — те ще станат вашата публична страница.
        </p>
      </header>
      <OnboardingWizard initialDisplayName={profile?.full_name ?? ""} />
    </section>
  );
}
