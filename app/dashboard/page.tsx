import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";

// Placeholder shell only — майстор dashboard contents come in a later step.
export const metadata = { title: "Табло — Майстор24" };

export default function DashboardPage() {
  return (
    <section className="container py-16">
      <h1 className="text-2xl font-bold tracking-tight">Табло на майстора</h1>
      <p className="mt-2 text-muted-foreground">Управлявайте заявките си за час.</p>
      <div className="mt-6">
        <Link
          href="/dashboard/zayavki"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Заявки за час
        </Link>
      </div>
      <form action={signOut} className="mt-8">
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Изход
        </button>
      </form>
    </section>
  );
}
