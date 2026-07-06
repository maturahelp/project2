import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Майстор24
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Начало
          </Link>
          <Link href="/maistori" className="transition-colors hover:text-foreground">
            Услуги
          </Link>
          <Link href="/vhod" className="transition-colors hover:text-foreground">
            Вход
          </Link>
        </nav>
      </div>
    </header>
  );
}
