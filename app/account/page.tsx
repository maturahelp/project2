import { signOut } from "@/app/(auth)/actions";

// Placeholder shell only — client account contents come in a later step.
export const metadata = { title: "Моят акаунт — Майстор24" };

export default function AccountPage() {
  return (
    <section className="container py-16">
      <h1 className="text-2xl font-bold tracking-tight">Моят акаунт</h1>
      <p className="mt-2 text-muted-foreground">Съдържанието предстои.</p>
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
