/**
 * Booking notification events. Each resolves contact details with the
 * service-role client and dispatches messages. Everything is wrapped so a
 * missing service key or provider never breaks the booking flow.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotifications } from "./index";
import type { OutgoingMessage } from "./types";
import {
  requestedToMaistor,
  confirmedToClient,
  declinedToClient,
  reminderToClient,
  reminderToMaistor,
  type BookingInfo,
} from "./templates";

type Contacts = {
  info: BookingInfo;
  maistorEmail: string | null;
  maistorPhone: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
};

async function loadContacts(bookingId: string): Promise<Contacts | null> {
  const admin = createAdminClient();
  if (!admin) {
    console.warn("[notify] SUPABASE_SERVICE_ROLE_KEY missing — cannot resolve contacts, skipping.");
    return null;
  }

  const { data: b } = await admin
    .from("bookings")
    .select("service_id, maistor_id, client_id, start_at, contact_phone, address")
    .eq("id", bookingId)
    .maybeSingle();
  if (!b) return null;

  const [{ data: svc }, { data: mp }, { data: mProfile }, mUser] = await Promise.all([
    admin.from("services").select("title").eq("id", b.service_id).maybeSingle(),
    admin.from("maistor_profiles").select("display_name").eq("user_id", b.maistor_id).maybeSingle(),
    admin.from("profiles").select("phone").eq("id", b.maistor_id).maybeSingle(),
    admin.auth.admin.getUserById(b.maistor_id),
  ]);

  let clientEmail: string | null = null;
  if (b.client_id) {
    const { data: cUser } = await admin.auth.admin.getUserById(b.client_id);
    clientEmail = cUser?.user?.email ?? null;
  }

  return {
    info: {
      serviceTitle: svc?.title ?? null,
      startAt: b.start_at,
      maistorName: mp?.display_name ?? null,
      contactPhone: b.contact_phone,
      address: b.address,
    },
    maistorEmail: mUser?.data?.user?.email ?? null,
    maistorPhone: mProfile?.phone ?? null,
    clientEmail,
    clientPhone: b.contact_phone,
  };
}

function email(to: string | null, t: { subject: string; text: string }): OutgoingMessage[] {
  return to ? [{ channel: "email", to, subject: t.subject, text: t.text }] : [];
}
function sms(to: string | null, t: { text: string }): OutgoingMessage[] {
  return to ? [{ channel: "sms", to, text: t.text }] : [];
}

/** booking requested → notify the майстор. */
export async function notifyBookingRequested(bookingId: string): Promise<void> {
  try {
    const c = await loadContacts(bookingId);
    if (!c) return;
    const t = requestedToMaistor(c.info);
    await sendNotifications([...email(c.maistorEmail, t), ...sms(c.maistorPhone, t)]);
  } catch (e) {
    console.error("[notify] notifyBookingRequested failed:", e);
  }
}

/** booking confirmed/declined → notify the client. */
export async function notifyBookingStatus(
  bookingId: string,
  status: "confirmed" | "declined",
): Promise<void> {
  try {
    const c = await loadContacts(bookingId);
    if (!c) return;
    const t = status === "confirmed" ? confirmedToClient(c.info) : declinedToClient(c.info);
    await sendNotifications([...email(c.clientEmail, t), ...sms(c.clientPhone, t)]);
  } catch (e) {
    console.error("[notify] notifyBookingStatus failed:", e);
  }
}

export type ReminderRow = {
  id: string;
  start_at: string;
  contact_phone: string | null;
  service_title: string | null;
  maistor_name: string | null;
  maistor_email: string | null;
  maistor_phone: string | null;
  client_email: string | null;
};

/** 24h reminder → notify both client and майстор. */
export async function notifyReminder(row: ReminderRow): Promise<void> {
  try {
    const info: BookingInfo = {
      serviceTitle: row.service_title,
      startAt: row.start_at,
      maistorName: row.maistor_name,
      contactPhone: row.contact_phone,
      address: null,
    };
    const forClient = reminderToClient(info);
    const forMaistor = reminderToMaistor(info);
    await sendNotifications([
      ...email(row.client_email, forClient),
      ...sms(row.contact_phone, forClient),
      ...email(row.maistor_email, forMaistor),
      ...sms(row.maistor_phone, forMaistor),
    ]);
  } catch (e) {
    console.error("[notify] notifyReminder failed:", e);
  }
}
