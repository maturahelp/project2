import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata = { title: "Вход — Майстор24" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    redirect(profile?.role === "maistor" ? "/dashboard" : "/account");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Вход</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Влезте в профила си, за да управлявате резервациите си.
      </p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Нямате акаунт?{" "}
        <Link href="/registratsiya" className="font-medium text-primary hover:underline">
          Регистрация
        </Link>
      </p>
    </div>
  );
}
