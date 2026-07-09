import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Табло — Майстор24" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/vhod");

  const { data: profile } = await supabase
    .from("maistor_profiles")
    .select("slug, verified")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return (
      <section className="container py-16">
        <h1 className="text-2xl font-bold tracking-tight">Табло на майстора</h1>
        <p className="mt-2 text-muted-foreground">
          Още не сте изградили профила си.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard/onboarding"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Изгради профил
          </Link>
        </div>
        <SignOutButton />
      </section>
    );
  }

  if (!profile.verified) {
    return (
      <section className="container py-16">
        <h1 className="text-2xl font-bold tracking-tight">Профилът ви очаква преглед</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Получихме данните ви. Наш екип ще прегледа и одобри профила ви — след
          одобрение ще се появите в търсенето и клиенти ще могат да ви откриват
          и резервират час.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard/profil"
            className="inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-accent"
          >
            Редактирай профила
          </Link>
        </div>
        <SignOutButton />
      </section>
    );
  }

  return (
    <section className="container py-16">
      <h1 className="text-2xl font-bold tracking-tight">Табло на майстора</h1>
      <p className="mt-2 text-muted-foreground">Управлявайте заявките си за час.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/dashboard/zayavki"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Заявки за час
        </Link>
        <Link
          href={`/maistor/${profile.slug}`}
          className="inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-accent"
        >
          Виж публичния си профил
        </Link>
        <Link
          href="/dashboard/profil"
          className="inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-accent"
        >
          Редактирай профила
        </Link>
      </div>
      <SignOutButton />
    </section>
  );
}

function SignOutButton() {
  return (
    <form action={signOut} className="mt-8">
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        Изход
      </button>
    </form>
  );
}
