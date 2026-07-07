import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { verifyReviewToken } from "@/lib/review/token";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatSofiaDateTime } from "@/lib/booking/time";
import { ReviewForm } from "./review-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Оставете отзив — Майстор24" };

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const bookingId = verifyReviewToken(token);
  if (!bookingId) notFound();

  const admin = createAdminClient();
  if (!admin) {
    return <Shell>Услугата е временно недостъпна.</Shell>;
  }

  const { data: booking } = await admin
    .from("bookings")
    .select("id, status, start_at, maistor_id, service_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) notFound();

  const [{ data: mp }, { data: svc }, { data: existing }] = await Promise.all([
    admin.from("maistor_profiles").select("display_name, slug").eq("user_id", booking.maistor_id).maybeSingle(),
    admin.from("services").select("title").eq("id", booking.service_id).maybeSingle(),
    admin.from("reviews").select("rating").eq("booking_id", bookingId).maybeSingle(),
  ]);

  const maistorName = mp?.display_name ?? "майстора";
  const profileHref = mp?.slug ? `/maistor/${mp.slug}` : "/maistori";

  if (booking.status !== "completed") {
    return (
      <Shell>
        Можете да оставите отзив само след като услугата е отбелязана като завършена.
      </Shell>
    );
  }

  if (existing) {
    return (
      <Shell>
        <p className="font-medium text-foreground">Благодарим! Вече оставихте отзив.</p>
        <p className="mt-2 flex items-center justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={
                i < existing.rating
                  ? "h-5 w-5 fill-amber-400 text-amber-400"
                  : "h-5 w-5 text-muted-foreground/30"
              }
              aria-hidden
            />
          ))}
        </p>
        <Link href={profileHref} className="mt-4 inline-block text-sm text-primary hover:underline">
          Към профила на майстора
        </Link>
      </Shell>
    );
  }

  return (
    <section className="container max-w-lg py-10 md:py-14">
      <h1 className="text-2xl font-bold tracking-tight">Оставете отзив</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {svc?.title ? `${svc.title} · ` : ""}
        {maistorName} · {formatSofiaDateTime(booking.start_at)}
      </p>
      <ReviewForm token={token} maistorName={maistorName} profileHref={profileHref} />
    </section>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="container max-w-lg py-16 text-center">
      <div className="rounded-lg border p-8 text-sm text-muted-foreground">{children}</div>
      <Link href="/maistori" className="mt-6 inline-block text-sm text-primary hover:underline">
        Разгледай майстори
      </Link>
    </section>
  );
}
