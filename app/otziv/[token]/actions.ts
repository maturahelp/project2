"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyReviewToken } from "@/lib/review/token";

const schema = z.object({
  token: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

const RPC_ERRORS: Record<string, string> = {
  invalid_rating: "Изберете оценка от 1 до 5.",
  booking_not_found: "Резервацията не е намерена.",
  not_completed: "Можете да оставите отзив само за завършена услуга.",
  already_reviewed: "Вече сте оставили отзив за тази резервация.",
};

export type ReviewResult = { ok: true } | { ok: false; error: string };

export async function submitReview(input: {
  token: string;
  rating: number;
  comment?: string;
}): Promise<ReviewResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };
  }

  const bookingId = verifyReviewToken(parsed.data.token);
  if (!bookingId) return { ok: false, error: "Невалиден или изтекъл линк за отзив." };

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Услугата е временно недостъпна." };

  const { error } = await admin.rpc("submit_review", {
    p_booking_id: bookingId,
    p_rating: parsed.data.rating,
    p_comment: parsed.data.comment ?? null,
  });

  if (error) {
    const key = Object.keys(RPC_ERRORS).find((k) => error.message.includes(k));
    return { ok: false, error: key ? RPC_ERRORS[key] : "Отзивът не бе записан. Опитайте отново." };
  }

  return { ok: true };
}
