"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const serviceSchema = z.object({
  title: z.string().trim().min(2, "Въведете заглавие на услугата.").max(200),
  description: z.string().trim().max(2000).optional(),
  priceFrom: z.coerce.number().min(0).optional(),
  priceUnit: z.string().trim().max(50).optional(),
  durationMin: z.coerce.number().int().positive().optional(),
});

const hourSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Невалиден час."),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Невалиден час."),
});

const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Въведете име.").max(100),
  bio: z.string().trim().max(2000).optional(),
  baseCity: z.string().trim().min(1, "Въведете град."),
  categories: z.array(z.string().trim().min(1)).min(1, "Изберете поне една категория."),
  bulstat: z.string().trim().max(20).optional(),
  services: z.array(serviceSchema).min(1, "Добавете поне една услуга."),
  workingHours: z.array(hourSchema).min(1, "Изберете поне един работен ден."),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateProfileResult = { ok: true } | { ok: false; error: string };

const RPC_ERRORS: Record<string, string> = {
  not_authenticated: "Сесията е изтекла. Влезте отново.",
  profile_not_found: "Профилът не бе намерен.",
};

export async function updateMaistorProfile(input: UpdateProfileInput): Promise<UpdateProfileResult> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_maistor_profile", {
    p_display_name: v.displayName,
    p_bio: v.bio ?? null,
    p_base_city: v.baseCity,
    p_categories: v.categories,
    p_bulstat: v.bulstat ?? null,
    p_services: v.services.map((s) => ({
      title: s.title,
      description: s.description ?? null,
      price_from: s.priceFrom ?? null,
      price_unit: s.priceUnit ?? null,
      duration_min: s.durationMin ?? null,
    })),
    p_working_hours: v.workingHours.map((h) => ({
      weekday: h.weekday,
      start_time: h.startTime,
      end_time: h.endTime,
    })),
  });

  if (error) {
    const key = Object.keys(RPC_ERRORS).find((k) => error.message.includes(k));
    return { ok: false, error: key ? RPC_ERRORS[key] : "Запазването не бе успешно. Опитайте отново." };
  }

  return { ok: true };
}
