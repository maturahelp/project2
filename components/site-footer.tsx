export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="container flex h-16 items-center justify-between text-sm text-muted-foreground">
        <span>© {year} Майстор24</span>
        <span>Запази час при проверен майстор</span>
      </div>
    </footer>
  );
}
