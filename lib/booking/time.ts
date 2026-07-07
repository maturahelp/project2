/**
 * Timezone helpers for Майстор24 booking.
 *
 * Rule: all instants are stored/compared in UTC (`timestamptz`); working_hours
 * and everything shown to the user are Europe/Sofia wall-clock. Sofia is UTC+2
 * (EET) in winter and UTC+3 (EEST) in summer, so conversions must be DST-aware.
 * We rely on the runtime's IANA tz database via Intl — no external dependency.
 */

export const SOFIA_TZ = "Europe/Sofia";

/** Milliseconds Europe/Sofia is ahead of UTC at a given instant (DST-aware). */
function sofiaOffsetMs(instant: number): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: SOFIA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const p = Object.fromEntries(
    dtf.formatToParts(new Date(instant)).map((x) => [x.type, x.value]),
  );
  // What the wall clock reads in Sofia, interpreted as if it were UTC.
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour === "24" ? "0" : p.hour),
    Number(p.minute),
    Number(p.second),
  );
  return asUtc - instant;
}

/**
 * Convert a Europe/Sofia wall-clock time to the corresponding UTC Date.
 * Two-pass to settle DST boundaries correctly.
 */
export function sofiaWallClockToUtc(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const off1 = sofiaOffsetMs(guess);
  let utc = guess - off1;
  const off2 = sofiaOffsetMs(utc);
  if (off2 !== off1) utc = guess - off2;
  return new Date(utc);
}

/** Day of week (0=Sunday..6=Saturday, matching Postgres `dow`) for a Sofia calendar date. */
export function sofiaWeekday(year: number, month: number, day: number): number {
  // A calendar date's weekday is tz-independent; noon UTC stays on the same date.
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

/** Parse a "YYYY-MM-DD" string into numeric parts (no tz interpretation). */
export function parseDateParts(dateStr: string): {
  year: number;
  month: number;
  day: number;
} | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/** "HH:MM:SS" or "HH:MM" -> minutes since midnight. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
}

/** minutes since midnight -> "HH:MM". */
export function minutesToHHMM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Format a UTC instant as Europe/Sofia "HH:MM". */
export function formatSofiaTime(instant: Date | string): string {
  return new Intl.DateTimeFormat("bg-BG", {
    timeZone: SOFIA_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(instant));
}

/** Format a UTC instant as a Europe/Sofia date + time, e.g. "5.07.2026 г., 14:30". */
export function formatSofiaDateTime(instant: Date | string): string {
  return new Intl.DateTimeFormat("bg-BG", {
    timeZone: SOFIA_TZ,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(instant));
}

/** Today's date in Europe/Sofia as "YYYY-MM-DD". */
export function sofiaTodayString(): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: SOFIA_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}`;
}
