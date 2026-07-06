import Link from "next/link";

export default function HomePage() {
  return (
    <section className="container flex flex-col items-center py-20 text-center md:py-32">
      <span className="mb-4 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
        Резервации за майстори в България
      </span>
      <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
        Запази час при проверен майстор
      </h1>
      <p className="mt-6 max-w-xl text-lg text-muted-foreground">
        Разгледай услуги и цени, избери свободен час и запази онлайн — бързо,
        лесно и без телефонни обаждания.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/maistori"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Намери майстор
        </Link>
        <Link
          href="/registratsiya"
          className="inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Стани майстор
        </Link>
      </div>
    </section>
  );
}
