export default function Loading() {
  return (
    <section className="container py-10 md:py-14">
      <div className="mb-8 h-9 w-64 animate-pulse rounded bg-muted" />
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="h-44 animate-pulse rounded-lg border bg-muted/40" />
        ))}
      </ul>
    </section>
  );
}
