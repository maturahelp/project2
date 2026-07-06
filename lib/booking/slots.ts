/**
 * Slot generation: working_hours (Sofia wall-clock) minus busy ranges,
 * at the service's duration_min granularity. All output instants are UTC.
 */

import {
  parseDateParts,
  sofiaWallClockToUtc,
  sofiaWeekday,
  timeToMinutes,
  minutesToHHMM,
} from "./time";

export type WorkingHour = {
  weekday: number;
  start_time: string;
  end_time: string;
};

export type BusyRange = { start_at: string; end_at: string };

export type Slot = {
  /** UTC ISO instant the slot starts. */
  startUtc: string;
  /** UTC ISO instant the slot ends. */
  endUtc: string;
  /** Europe/Sofia "HH:MM" label. */
  label: string;
};

/** Two ranges [s,e) overlap iff s1 < e2 && s2 < e1. */
function overlaps(s1: number, e1: number, s2: number, e2: number): boolean {
  return s1 < e2 && s2 < e1;
}

export function generateSlots(params: {
  dateStr: string; // "YYYY-MM-DD" interpreted as a Sofia calendar date
  durationMin: number;
  workingHours: WorkingHour[];
  busy: BusyRange[];
  now?: Date;
}): Slot[] {
  const { dateStr, durationMin, workingHours, busy } = params;
  const now = params.now ?? new Date();

  const parts = parseDateParts(dateStr);
  if (!parts || !Number.isFinite(durationMin) || durationMin <= 0) return [];
  const { year, month, day } = parts;

  const dow = sofiaWeekday(year, month, day);
  const windows = workingHours.filter((w) => w.weekday === dow);
  if (windows.length === 0) return [];

  const busyRanges = busy.map(
    (b) =>
      [new Date(b.start_at).getTime(), new Date(b.end_at).getTime()] as const,
  );

  const slots: Slot[] = [];
  for (const w of windows) {
    const startM = timeToMinutes(w.start_time);
    const endM = timeToMinutes(w.end_time);
    for (let m = startM; m + durationMin <= endM; m += durationMin) {
      const startUtc = sofiaWallClockToUtc(year, month, day, Math.floor(m / 60), m % 60);
      const s = startUtc.getTime();
      const e = s + durationMin * 60_000;
      if (s <= now.getTime()) continue; // no past slots
      if (busyRanges.some(([bs, be]) => overlaps(s, e, bs, be))) continue;
      slots.push({
        startUtc: startUtc.toISOString(),
        endUtc: new Date(e).toISOString(),
        label: minutesToHHMM(m),
      });
    }
  }

  slots.sort((a, b) => a.startUtc.localeCompare(b.startUtc));
  return slots;
}
