import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BookingFlow } from "./booking-flow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Запази час — Майстор24`, alternates: { canonical: `/maistor/${slug}` } };
}

export default async function ZapaziPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: maistor } = await supabase
    .from("maistor_profiles")
    .select("user_id, slug, display_name")
    .eq("slug", slug)
    .eq("verified", true)
    .maybeSingle();
  if (!maistor) notFound();

  const { data: services } = await supabase
    .from("services")
    .select("id, title, description, price_from, price_unit, duration_min")
    .eq("maistor_id", maistor.user_id)
    .order("price_from", { ascending: true, nullsFirst: false });

  const name = maistor.display_name ?? maistor.slug;

  return (
    <section className="container max-w-2xl py-10 md:py-14">
      <Link
        href={`/maistor/${slug}`}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Обратно към профила
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">
        Запази час при {name}
      </h1>

      {!services || services.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          Този майстор все още няма публикувани услуги за резервация.
        </p>
      ) : (
        <BookingFlow maistorId={maistor.user_id} services={services} />
      )}
    </section>
  );
}
