"use server";

import { z } from "zod";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSlots, type Slot } from "@/lib/booking/slots";
import { parseDateParts, sofiaWallClockToUtc } from "@/lib/booking/time";
import { notifyBookingRequested } from "@/lib/notify/events";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Available slots for a майстор + service on a Sofia calendar date. */
export async function getAvailableSlots(
  maistorId: string,
  serviceId: string,
  dateStr: string,
): Promise<Slot[]> {
  const parts = parseDateParts(dateStr);
  if (!UUID_RE.test(maistorId) || !UUID_RE.test(serviceId) || !parts) return [];

  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("duration_min")
    .eq("id", serviceId)
    .eq("maistor_id", maistorId)
    .maybeSingle();
  if (!service) return [];
  const durationMin = service.duration_min ?? 60;

  const { year, month, day } = parts;
  const dayStart = sofiaWallClockToUtc(year, month, day, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 30 * 60 * 60 * 1000); // covers the Sofia day

  const [{ data: busy }, { data: workingHours }] = await Promise.all([
    supabase.rpc("maistor_busy_ranges", {
      p_maistor_id: maistorId,
      p_from: dayStart.toISOString(),
      p_to: dayEnd.toISOString(),
    }),
    supabase
      .from("working_hours")
      .select("weekday, start_time, end_time")
      .eq("maistor_id", maistorId),
  ]);

  return generateSlots({
    dateStr,
    durationMin,
    workingHours: workingHours ?? [],
    busy: busy ?? [],
  });
}

const bookingSchema = z.object({
  serviceId: z.string().regex(UUID_RE, "Невалидна услуга."),
  startUtc: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Невалиден час."),
  contactPhone: z.string().trim().min(4, "Въведете валиден телефон.").max(30),
  address: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type BookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: string };

const RPC_ERRORS: Record<string, string> = {
  phone_required: "Въведете телефон за връзка.",
  service_not_found: "Услугата не е намерена.",
  maistor_not_available: "Този майстор не е достъпен в момента.",
  in_the_past: "Избраният час вече е минал.",
  outside_working_hours: "Часът е извън работното време на майстора.",
  slot_taken: "Този час вече е зает. Моля, изберете друг.",
};

export async function createBookingAction(input: {
  serviceId: string;
  startUtc: string;
  contactPhone: string;
  address?: string;
  notes?: string;
}): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_booking", {
    p_service_id: v.serviceId,
    p_start_at: new Date(v.startUtc).toISOString(),
    p_address: v.address ?? null,
    p_notes: v.notes ?? null,
    p_contact_phone: v.contactPhone,
  });

  if (error) {
    const key = Object.keys(RPC_ERRORS).find((k) => error.message.includes(k));
    return { ok: false, error: key ? RPC_ERRORS[key] : "Резервацията не бе успешна. Опитайте отново." };
  }

  const bookingId = data as string;
  // Notify the майстор of the new request after the response is sent, so the
  // client isn't blocked by contact lookups / provider calls.
  after(() => notifyBookingRequested(bookingId));

  return { ok: true, bookingId };
}
