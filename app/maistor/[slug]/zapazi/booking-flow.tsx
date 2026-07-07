"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { getAvailableSlots, createBookingAction } from "./actions";
import type { Slot } from "@/lib/booking/slots";
import { sofiaTodayString, formatSofiaDateTime } from "@/lib/booking/time";

type Service = {
  id: string;
  title: string;
  description: string | null;
  price_from: number | null;
  price_unit: string | null;
  duration_min: number | null;
};

const inputClass =
  "h-11 w-full rounded-md border px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function BookingFlow({
  maistorId,
  services,
}: {
  maistorId: string;
  services: Service[];
}) {
  const [serviceId, setServiceId] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [startUtc, setStartUtc] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loadingSlots, startSlots] = useTransition();
  const [submitting, startSubmit] = useTransition();

  const service = services.find((s) => s.id === serviceId);

  function onPickDate(next: string) {
    setDateStr(next);
    setStartUtc("");
    setSlots(null);
    if (!next || !serviceId) return;
    startSlots(async () => {
      setSlots(await getAvailableSlots(maistorId, serviceId, next));
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startSubmit(async () => {
      const res = await createBookingAction({
        serviceId,
        startUtc,
        contactPhone: phone,
        address,
        notes,
      });
      if (res.ok) setDone(true);
      else setError(res.error);
    });
  }

  if (done) {
    return (
      <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" aria-hidden />
        <h2 className="mt-3 text-lg font-semibold text-green-900">
          Заявката е изпратена!
        </h2>
        <p className="mt-1 text-sm text-green-800">
          Часът {startUtc && `за ${formatSofiaDateTime(startUtc)} `}е запазен със статус
          „изчаква потвърждение“. Майсторът ще потвърди скоро.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-8">
      {/* Step 1 — service */}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">1. Изберете услуга</legend>
        <div className="flex flex-col gap-2">
          {services.map((s) => (
            <label
              key={s.id}
              className={`flex cursor-pointer items-start justify-between gap-4 rounded-md border p-3 transition-colors ${
                serviceId === s.id ? "border-primary bg-accent/50" : "hover:bg-accent/30"
              }`}
            >
              <span>
                <input
                  type="radio"
                  name="service"
                  className="sr-only"
                  checked={serviceId === s.id}
                  onChange={() => {
                    setServiceId(s.id);
                    setSlots(null);
                    setStartUtc("");
                    if (dateStr) onPickDate(dateStr);
                  }}
                />
                <span className="font-medium">{s.title}</span>
                {s.duration_min != null && (
                  <span className="block text-xs text-muted-foreground">
                    ~{s.duration_min} мин.
                  </span>
                )}
              </span>
              {s.price_from != null && (
                <span className="shrink-0 text-sm font-semibold">
                  от {s.price_from} {s.price_unit ?? "лв"}
                </span>
              )}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Step 2 — date */}
      {service && (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">2. Изберете дата</legend>
          <input
            type="date"
            value={dateStr}
            min={sofiaTodayString()}
            onChange={(e) => onPickDate(e.target.value)}
            className={inputClass}
          />
        </fieldset>
      )}

      {/* Step 3 — slot */}
      {service && dateStr && (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">3. Изберете час</legend>
          {loadingSlots ? (
            <p className="text-sm text-muted-foreground">Зареждане на свободни часове…</p>
          ) : slots && slots.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((s) => (
                <button
                  key={s.startUtc}
                  type="button"
                  onClick={() => setStartUtc(s.startUtc)}
                  className={`h-11 rounded-md border text-sm font-medium transition-colors ${
                    startUtc === s.startUtc
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Няма свободни часове за тази дата. Опитайте с друга.
            </p>
          )}
        </fieldset>
      )}

      {/* Step 4 — contact */}
      {startUtc && (
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-semibold">4. Данни за връзка</legend>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Телефон *
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="0888 123 456"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Адрес
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="гр. София, ул. …"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Бележки
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Опишете накратко проблема…"
              className="w-full rounded-md border px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? "Изпращане…" : "Потвърди резервацията"}
          </button>
        </fieldset>
      )}
    </form>
  );
}
