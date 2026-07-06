"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/lib/supabase/types";
import { notifyBookingStatus } from "@/lib/notify/events";

/**
 * Enforce a booking status transition server-side. Only the owning майстор may
 * transition, and only from the expected current status (guarded atomically via
 * the `.eq("status", from)` filter to avoid races). Returns whether it applied.
 */
async function transition(
  id: string,
  from: BookingStatus,
  to: BookingStatus,
): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error, count } = await supabase
    .from("bookings")
    .update({ status: to, updated_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", id)
    .eq("maistor_id", user.id)
    .eq("status", from);

  if (error || !count) return false;
  revalidatePath("/dashboard/zayavki");
  return true;
}

export async function confirmBooking(formData: FormData) {
  const id = String(formData.get("id"));
  if (await transition(id, "requested", "confirmed")) {
    await notifyBookingStatus(id, "confirmed");
  }
}

export async function declineBooking(formData: FormData) {
  const id = String(formData.get("id"));
  if (await transition(id, "requested", "declined")) {
    await notifyBookingStatus(id, "declined");
  }
}

export async function completeBooking(formData: FormData) {
  await transition(String(formData.get("id")), "confirmed", "completed");
}
