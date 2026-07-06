import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Star, Clock, Wrench, Images, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// 0 = Sunday .. 6 = Saturday (Postgres dow). Displayed Monday-first.
const DAY_NAMES = [
  "Неделя",
  "Понеделник",
  "Вторник",
  "Сряда",
  "Четвъртък",
  "Петък",
  "Събота",
];
const weekOrder = (weekday: number) => (weekday === 0 ? 7 : weekday);
const hhmm = (t: string) => t.slice(0, 5);

async function getProfile(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("maistor_profiles")
    .select("user_id, slug, display_name, bio, categories, base_city, rating_avg, rating_count")
    .eq("slug", slug)
    .eq("verified", true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getProfile(slug);
  if (!profile) return { title: "Майсторът не е намерен — Майстор24" };

  const name = profile.display_name ?? profile.slug;
  const cats = profile.categories?.join(", ");
  const where = profile.base_city ? ` в ${profile.base_city}` : "";
  const title = `${name}${cats ? ` — ${cats}` : ""}${where} | Майстор24`;
  const description =
    profile.bio?.slice(0, 155) ??
    `Запази час при ${name}${where}. Виж услуги, цени, работно време и отзиви.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
  };
}

export default async function MaistorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getProfile(slug);
  if (!profile) notFound();

  const supabase = await createClient();
  const [servicesRes, hoursRes, reviewsRes, portfolioRes] = await Promise.all([
    supabase
      .from("services")
      .select("id, title, description, price_from, price_unit, duration_min")
      .eq("maistor_id", profile.user_id)
      .order("price_from", { ascending: true, nullsFirst: false }),
    supabase
      .from("working_hours")
      .select("id, weekday, start_time, end_time")
      .eq("maistor_id", profile.user_id),
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at")
      .eq("maistor_id", profile.user_id)
      .order("created_at", { ascending: false }),
    supabase.storage.from("portfolio").list(profile.user_id, {
      limit: 24,
      sortBy: { column: "created_at", order: "desc" },
    }),
  ]);

  const services = servicesRes.data ?? [];
  const hours = (hoursRes.data ?? []).sort(
    (a, b) => weekOrder(a.weekday) - weekOrder(b.weekday),
  );
  const reviews = reviewsRes.data ?? [];

  const name = profile.display_name ?? profile.slug;
  const portfolioImages = (portfolioRes.data ?? [])
    .filter((f) => f.id) // skip folder placeholders
    .map(
      (f) =>
        supabase.storage
          .from("portfolio")
          .getPublicUrl(`${profile.user_id}/${f.name}`).data.publicUrl,
    );

  return (
    <article className="container py-10 md:py-14">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b pb-8 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{name}</h1>
          {profile.base_city && (
            <p className="mt-2 flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" aria-hidden />
              {profile.base_city}
            </p>
          )}
          {profile.categories?.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {profile.categories.map((c) => (
                <li
                  key={c}
                  className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                >
                  {c}
                </li>
              ))}
            </ul>
          )}
          {profile.rating_count > 0 && (
            <p className="mt-3 flex items-center gap-1 text-sm font-medium">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
              {profile.rating_avg.toFixed(1)}
              <span className="text-muted-foreground">
                ({profile.rating_count}{" "}
                {profile.rating_count === 1 ? "отзив" : "отзива"})
              </span>
            </p>
          )}
        </div>

        <Link
          href={`/maistor/${slug}/zapazi`}
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Запази час
        </Link>
      </header>

      {profile.bio && (
        <section className="mt-8 max-w-3xl">
          <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
            {profile.bio}
          </p>
        </section>
      )}

      {/* Services */}
      <Section icon={<Wrench className="h-5 w-5" aria-hidden />} title="Услуги и цени">
        {services.length === 0 ? (
          <EmptyNote>Все още няма добавени услуги.</EmptyNote>
        ) : (
          <ul className="divide-y rounded-lg border">
            {services.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{s.title}</p>
                  {s.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{s.description}</p>
                  )}
                  {s.duration_min != null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      ~{s.duration_min} мин.
                    </p>
                  )}
                </div>
                {s.price_from != null && (
                  <p className="shrink-0 whitespace-nowrap text-sm font-semibold">
                    от {s.price_from} {s.price_unit ?? "лв"}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Working hours */}
      <Section icon={<Clock className="h-5 w-5" aria-hidden />} title="Работно време">
        {hours.length === 0 ? (
          <EmptyNote>Работното време не е зададено.</EmptyNote>
        ) : (
          <ul className="max-w-md divide-y rounded-lg border">
            {hours.map((h) => (
              <li key={h.id} className="flex justify-between p-3 text-sm">
                <span className="font-medium">{DAY_NAMES[h.weekday]}</span>
                <span className="text-muted-foreground">
                  {hhmm(h.start_time)}–{hhmm(h.end_time)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Portfolio */}
      <Section icon={<Images className="h-5 w-5" aria-hidden />} title="Портфолио">
        {portfolioImages.length === 0 ? (
          <EmptyNote>Няма качени снимки.</EmptyNote>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {portfolioImages.map((src) => (
              <li key={src} className="aspect-square overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Работа на ${name}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Reviews */}
      <Section icon={<MessageSquare className="h-5 w-5" aria-hidden />} title="Отзиви">
        {reviews.length === 0 ? (
          <EmptyNote>Все още няма отзиви.</EmptyNote>
        ) : (
          <ul className="flex flex-col gap-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-0.5" aria-label={`${r.rating} от 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={
                          i < r.rating
                            ? "h-4 w-4 fill-amber-400 text-amber-400"
                            : "h-4 w-4 text-muted-foreground/30"
                        }
                        aria-hidden
                      />
                    ))}
                  </span>
                  <time className="text-xs text-muted-foreground" dateTime={r.created_at}>
                    {new Date(r.created_at).toLocaleDateString("bg-BG")}
                  </time>
                </div>
                {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </article>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-tight">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
      {children}
    </p>
  );
}
