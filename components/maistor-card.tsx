import Link from "next/link";
import { MapPin, Star } from "lucide-react";

export type MaistorCardData = {
  slug: string;
  displayName: string;
  categories: string[];
  baseCity: string | null;
  ratingAvg: number;
  ratingCount: number;
  priceFrom: number | null;
};

export function MaistorCard({ maistor }: { maistor: MaistorCardData }) {
  const { slug, displayName, categories, baseCity, ratingAvg, ratingCount, priceFrom } =
    maistor;

  return (
    <Link
      href={`/maistor/${slug}`}
      className="flex flex-col rounded-lg border p-5 transition-colors hover:border-foreground/30 hover:bg-accent/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight">{displayName}</h3>
        {ratingCount > 0 ? (
          <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
            {ratingAvg.toFixed(1)}
            <span className="text-muted-foreground">({ratingCount})</span>
          </span>
        ) : (
          <span className="shrink-0 text-sm text-muted-foreground">Нов</span>
        )}
      </div>

      {baseCity && (
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {baseCity}
        </p>
      )}

      {categories.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {categories.slice(0, 4).map((c) => (
            <li
              key={c}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              {c}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        {priceFrom != null ? (
          <>
            от <span className="font-semibold text-foreground">{priceFrom} лв</span>
          </>
        ) : (
          "Цени при запитване"
        )}
      </p>
    </Link>
  );
}
