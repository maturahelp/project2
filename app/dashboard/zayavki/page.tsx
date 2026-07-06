import Link from "next/link";
import { Phone, MapPin, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatSofiaDateTime } from "@/lib/booking/time";
import type { BookingStatus } from "@/lib/supabase/types";
import { confirmBooking, declineBooking, completeBooking } from "./actions";

export const metadata = { title: "Заявки — Майстор24" };
export const dynamic = "force-dynamic";

type BookingRow = {
  id: string;
  status: BookingStatus;
  start_at: string;
  end_at: string;
  address: string | null;
  notes: string | null;
  contact_phone: string | null;
  client_id: string | null;
  services: { title: string } | null;
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  requested: "Изчаква",
  confirmed: "Потвърдена",
  declined: "Отказана",
  completed: "Завършена",
  cancelled: "Отменена",
};

const STATUS_CLASS: Record<BookingStatus, string> = {
  requested: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  declined: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-700",
};

export default async function ZayavkiPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, status, start_at, end_at, address, notes, contact_phone, client_id, services(title)",
    )
    .order("start_at", { ascending: true });

  const bookings = (data ?? []) as unknown as BookingRow[];
  const requested = bookings.filter((b) => b.status === "requested");
  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const past = bookings.filter((b) =>
    ["completed", "declined", "cancelled"].includes(b.status),
  );

  return (
    <section className="container py-10 md:py-14">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Заявки за час</h1>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Табло
        </Link>
      </div>

      <Group title="Нови заявки" count={requested.length} empty="Няма нови заявки.">
        {requested.map((b) => (
          <BookingCard key={b.id} b={b}>
            <form action={confirmBooking}>
              <input type="hidden" name="id" value={b.id} />
              <button className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Потвърди
              </button>
            </form>
            <form action={declineBooking}>
              <input type="hidden" name="id" value={b.id} />
              <button className="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-accent">
                Откажи
              </button>
            </form>
          </BookingCard>
        ))}
      </Group>

      <Group title="Потвърдени" count={confirmed.length} empty="Няма потвърдени заявки.">
        {confirmed.map((b) => (
          <BookingCard key={b.id} b={b}>
            <form action={completeBooking}>
              <input type="hidden" name="id" value={b.id} />
              <button className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Отбележи като завършена
              </button>
            </form>
          </BookingCard>
        ))}
      </Group>

      {past.length > 0 && (
        <Group title="История" count={past.length} empty="">
          {past.map((b) => (
            <BookingCard key={b.id} b={b} />
          ))}
        </Group>
      )}
    </section>
  );
}

function Group({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-8">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">
        {title} <span className="text-muted-foreground">({count})</span>
      </h2>
      {count === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">{children}</ul>
      )}
    </div>
  );
}

function BookingCard({
  b,
  children,
}: {
  b: BookingRow;
  children?: React.ReactNode;
}) {
  return (
    <li className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{b.services?.title ?? "Услуга"}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            {formatSofiaDateTime(b.start_at)}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[b.status]}`}
        >
          {STATUS_LABEL[b.status]}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-1 text-sm">
        {b.contact_phone && (
          <a
            href={`tel:${b.contact_phone}`}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden />
            {b.contact_phone}
            {b.client_id ? "" : " (гост)"}
          </a>
        )}
        {b.address && (
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {b.address}
          </p>
        )}
        {b.notes && <p className="mt-1 text-muted-foreground">{b.notes}</p>}
      </div>

      {children && <div className="mt-4 flex gap-2">{children}</div>}
    </li>
  );
}
