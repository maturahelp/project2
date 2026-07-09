import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditProfileForm } from "./edit-profile-form";

export const metadata = { title: "Редактирай профила — Майстор24" };

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/vhod");

  const { data: profile } = await supabase
    .from("maistor_profiles")
    .select("display_name, bio, base_city, categories, bulstat")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) redirect("/dashboard/onboarding");

  const [servicesRes, hoursRes, portfolioRes] = await Promise.all([
    supabase
      .from("services")
      .select("title, description, price_from, price_unit, duration_min")
      .eq("maistor_id", user.id),
    supabase
      .from("working_hours")
      .select("weekday, start_time, end_time")
      .eq("maistor_id", user.id),
    supabase.storage.from("portfolio").list(user.id, {
      limit: 24,
      sortBy: { column: "created_at", order: "desc" },
    }),
  ]);

  const portfolio = (portfolioRes.data ?? [])
    .filter((f) => f.id)
    .map((f) => ({
      path: `${user.id}/${f.name}`,
      url: supabase.storage.from("portfolio").getPublicUrl(`${user.id}/${f.name}`).data.publicUrl,
    }));

  return (
    <section className="container py-10 md:py-14">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Редактирай профила</h1>
        <p className="mt-2 text-muted-foreground">
          Промените важат за публичната ви страница.
        </p>
      </header>
      <EditProfileForm
        userId={user.id}
        initialData={{
          displayName: profile.display_name ?? "",
          bio: profile.bio ?? "",
          baseCity: profile.base_city ?? "",
          categories: profile.categories ?? [],
          bulstat: profile.bulstat ?? "",
          services: servicesRes.data ?? [],
          workingHours: hoursRes.data ?? [],
          portfolio,
        }}
      />
    </section>
  );
}
