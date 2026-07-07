/**
 * Signed review tokens. A guest has no account, so the review link carries a
 * booking id signed with an HMAC — no storage, not forgeable without the secret.
 * Token format: "<bookingId>.<base64url(hmac-sha256(bookingId))>".
 *
 * Uses REVIEW_TOKEN_SECRET, falling back to the (server-only) service-role key
 * so it works without an extra env var. Server-only module.
 */

import { createHmac, timingSafeEqual } from "crypto";

function secret(): string {
  return process.env.REVIEW_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function sign(bookingId: string): string {
  return createHmac("sha256", secret()).update(bookingId).digest("base64url");
}

export function signReviewToken(bookingId: string): string {
  return `${bookingId}.${sign(bookingId)}`;
}

/** Returns the booking id if the token is valid, else null. */
export function verifyReviewToken(token: string): string | null {
  if (!secret()) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const bookingId = token.slice(0, dot);
  const provided = token.slice(dot + 1);
  const expected = sign(bookingId);
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return bookingId;
}
