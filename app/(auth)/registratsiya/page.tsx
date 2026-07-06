import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Регистрация — Майстор24" };
export const dynamic = "force-dynamic";

export default async function SignupPage() {
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
      <h1 className="text-2xl font-bold tracking-tight">Регистрация</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Създайте акаунт, за да запазвате часове или да приемате клиенти.
      </p>
      <SignupForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Вече имате акаунт?{" "}
        <Link href="/vhod" className="font-medium text-primary hover:underline">
          Вход
        </Link>
      </p>
    </div>
  );
}
