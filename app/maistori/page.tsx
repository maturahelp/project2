import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MaistorCard, type MaistorCardData } from "@/components/maistor-card";

export const metadata: Metadata = {
  title: "Намери майстор — Майстор24",
  description:
    "Разгледай проверени майстори в България. Филтрирай по град и категория и запази час онлайн.",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 6;

type SearchParams = {
  city?: string;
  category?: string;
  q?: string;
  page?: string;
};

export default async function MaistoriPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { city, category, q, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  // Filter options: distinct cities + categories across all verified майстори.
  const { data: facetRows } = await supabase
    .from("maistor_profiles")
    .select("base_city, categories")
    .eq("verified", true);

  const cities = Array.from(
    new Set((facetRows ?? []).map((r) => r.base_city).filter(Boolean) as string[]),
  ).sort((a, b) => a.localeCompare(b, "bg"));
  const categories = Array.from(
    new Set((facetRows ?? []).flatMap((r) => r.categories ?? [])),
  ).sort((a, b) => a.localeCompare(b, "bg"));

  // Main query (RLS already limits anon to verified; .eq keeps it explicit).
  let query = supabase
    .from("maistor_profiles")
    .select("user_id, slug, display_name, categories, base_city, rating_avg, rating_count", {
      count: "exact",
    })
    .eq("verified", true);

  if (city) query = query.eq("base_city", city);
  if (category) query = query.contains("categories", [category]);
  if (q) query = query.ilike("display_name", `%${q}%`);

  const { data: rows, count } = await query
    .order("rating_avg", { ascending: false })
    .order("rating_count", { ascending: false })
    .range(from, to);

  const maistori = rows ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // price_from per майстор = cheapest service. One extra query for the page.
  const priceByMaistor = new Map<string, number>();
  if (maistori.length > 0) {
    const ids = maistori.map((m) => m.user_id);
    const { data: services } = await supabase
      .from("services")
      .select("maistor_id, price_from")
      .in("maistor_id", ids)
      .not("price_from", "is", null);
    for (const s of services ?? []) {
      if (s.price_from == null) continue;
      const cur = priceByMaistor.get(s.maistor_id);
      if (cur == null || s.price_from < cur) priceByMaistor.set(s.maistor_id, s.price_from);
    }
  }

  const cards: MaistorCardData[] = maistori.map((m) => ({
    slug: m.slug,
    displayName: m.display_name ?? m.slug,
    categories: m.categories ?? [],
    baseCity: m.base_city,
    ratingAvg: m.rating_avg,
    ratingCount: m.rating_count,
    priceFrom: priceByMaistor.get(m.user_id) ?? null,
  }));

  const buildHref = (overrides: Partial<SearchParams>) => {
    const params = new URLSearchParams();
    const next = { city, category, q, page: undefined, ...overrides };
    if (next.city) params.set("city", next.city);
    if (next.category) params.set("category", next.category);
    if (next.q) params.set("q", next.q);
    if (next.page) params.set("page", String(next.page));
    const qs = params.toString();
    return qs ? `/maistori?${qs}` : "/maistori";
  };

  return (
    <section className="container py-10 md:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Намери майстор</h1>
        <p className="mt-2 text-muted-foreground">
          {total} {total === 1 ? "проверен майстор" : "проверени майстори"}
        </p>
      </header>

      {/* Filters — plain GET form, no client JS needed. */}
      <form method="get" className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Търси по име…"
          className="h-11 rounded-md border px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <select
          name="city"
          defaultValue={city ?? ""}
          className="h-11 rounded-md border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Всички градове</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={category ?? ""}
          className="h-11 rounded-md border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Всички категории</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Филтрирай
          </button>
          {(city || category || q) && (
            <Link
              href="/maistori"
              className="inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-accent"
            >
              Изчисти
            </Link>
          )}
        </div>
      </form>

      {cards.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-lg font-medium">Няма намерени майстори</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Опитай с друг град или категория.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((m) => (
            <li key={m.slug}>
              <MaistorCard maistor={m} />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav
          className="mt-10 flex items-center justify-center gap-2"
          aria-label="Странициране"
        >
          {currentPage > 1 && (
            <Link
              href={buildHref({ page: String(currentPage - 1) })}
              className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-accent"
            >
              Назад
            </Link>
          )}
          <span className="px-2 text-sm text-muted-foreground">
            Страница {currentPage} от {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={buildHref({ page: String(currentPage + 1) })}
              className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-accent"
            >
              Напред
            </Link>
          )}
        </nav>
      )}
    </section>
  );
}
