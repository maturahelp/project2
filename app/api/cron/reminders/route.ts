import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyReminder, type ReminderRow } from "@/lib/notify/events";

export const dynamic = "force-dynamic";

// How far ahead we remind (hours). Runs hourly via vercel.json; each confirmed
// booking is claimed exactly once thanks to claim_due_reminders + reminder_sent.
const WINDOW_HOURS = 24;

export async function GET(request: NextRequest) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    console.error("[cron/reminders] SUPABASE_SERVICE_ROLE_KEY missing — cannot run.");
    return NextResponse.json(
      { ok: false, skipped: true, reason: "no_service_role_key" },
      { status: 200 },
    );
  }

  const { data, error } = await admin.rpc("claim_due_reminders", {
    p_within_hours: WINDOW_HOURS,
  });

  if (error) {
    console.error("[cron/reminders] claim_due_reminders failed:", error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as ReminderRow[];
  // Claimed atomically (reminder_sent already true) — safe to notify now.
  for (const row of rows) {
    await notifyReminder(row);
  }

  console.info(`[cron/reminders] processed ${rows.length} reminder(s).`);
  return NextResponse.json({ ok: true, reminders: rows.length });
}
