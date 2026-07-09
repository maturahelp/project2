"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding, type OnboardingInput } from "./actions";
import { TRADE_CATEGORIES, CITIES } from "@/lib/catalog";

const inputClass =
  "h-11 w-full rounded-md border px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring";
const textareaClass =
  "w-full rounded-md border px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring";
const primaryBtn =
  "inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60";
const secondaryBtn =
  "inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-accent";

// 0 = Sunday .. 6 = Saturday (Postgres dow). Rendered Monday-first.
const DAY_NAMES = ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // display order -> Postgres weekday

type ServiceDraft = {
  title: string;
  description: string;
  priceFrom: string;
  priceUnit: string;
  durationMin: string;
};

type HourDraft = { weekday: number; enabled: boolean; startTime: string; endTime: string };

export function OnboardingWizard({ initialDisplayName }: { initialDisplayName: string }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  // Step 1
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState("");
  const [baseCity, setBaseCity] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [otherCategory, setOtherCategory] = useState("");
  const [bulstat, setBulstat] = useState("");

  // Step 2
  const [services, setServices] = useState<ServiceDraft[]>([
    { title: "", description: "", priceFrom: "", priceUnit: "лв/час", durationMin: "60" },
  ]);

  // Step 3
  const [hours, setHours] = useState<HourDraft[]>(
    WEEK_ORDER.map((weekday) => ({
      weekday,
      enabled: weekday >= 1 && weekday <= 5,
      startTime: "09:00",
      endTime: "18:00",
    })),
  );

  function toggleCategory(cat: string) {
    setCategories((cur) => (cur.includes(cat) ? cur.filter((c) => c !== cat) : [...cur, cat]));
  }

  function updateService(i: number, patch: Partial<ServiceDraft>) {
    setServices((cur) => cur.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function addService() {
    setServices((cur) => [
      ...cur,
      { title: "", description: "", priceFrom: "", priceUnit: "лв/час", durationMin: "60" },
    ]);
  }

  function removeService(i: number) {
    setServices((cur) => cur.filter((_, idx) => idx !== i));
  }

  function updateHour(i: number, patch: Partial<HourDraft>) {
    setHours((cur) => cur.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));
  }

  function goNext() {
    setError(null);
    if (step === 1) {
      if (!displayName.trim()) return setError("Въведете име.");
      if (!baseCity.trim()) return setError("Въведете град.");
      if (categories.length === 0 && !otherCategory.trim()) {
        return setError("Изберете поне една категория.");
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      const valid = services.some((s) => s.title.trim());
      if (!valid) return setError("Добавете поне една услуга с заглавие.");
      setStep(3);
    }
  }

  function goBack() {
    setError(null);
    setStep((s) => (s === 3 ? 2 : 1));
  }

  function onFinish() {
    setError(null);
    const enabledHours = hours.filter((h) => h.enabled);
    if (enabledHours.length === 0) {
      setError("Изберете поне един работен ден.");
      return;
    }

    const payload: OnboardingInput = {
      displayName: displayName.trim(),
      bio: bio.trim() || undefined,
      baseCity: baseCity.trim(),
      categories: [...categories, ...(otherCategory.trim() ? [otherCategory.trim()] : [])],
      bulstat: bulstat.trim() || undefined,
      services: services
        .filter((s) => s.title.trim())
        .map((s) => ({
          title: s.title.trim(),
          description: s.description.trim() || undefined,
          priceFrom: s.priceFrom ? Number(s.priceFrom) : undefined,
          priceUnit: s.priceUnit.trim() || undefined,
          durationMin: s.durationMin ? Number(s.durationMin) : undefined,
        })),
      workingHours: enabledHours.map((h) => ({
        weekday: h.weekday,
        startTime: h.startTime,
        endTime: h.endTime,
      })),
    };

    startSubmit(async () => {
      const res = await completeOnboarding(payload);
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ol className="mb-8 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <StepDot active={step === 1} done={step > 1}>1. Основна информация</StepDot>
        <StepDot active={step === 2} done={step > 2}>2. Услуги</StepDot>
        <StepDot active={step === 3} done={false}>3. Работно време</StepDot>
      </ol>

      {step === 1 && (
        <fieldset className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Име / фирма *
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Описание
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Разкажете накратко за опита си…"
              className={textareaClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Град *
            <input
              type="text"
              list="cities"
              value={baseCity}
              onChange={(e) => setBaseCity(e.target.value)}
              className={inputClass}
            />
            <datalist id="cities">
              {CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <div>
            <span className="mb-1.5 block text-sm font-medium">Категории *</span>
            <div className="flex flex-wrap gap-2">
              {TRADE_CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    categories.includes(cat)
                      ? "border-primary bg-accent/50 font-medium"
                      : "hover:bg-accent/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={categories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                  {cat}
                </label>
              ))}
            </div>
            <input
              type="text"
              value={otherCategory}
              onChange={(e) => setOtherCategory(e.target.value)}
              placeholder="Друга категория (незадължително)"
              className={`${inputClass} mt-2`}
            />
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            ЕИК/Булстат на фирма (незадължително)
            <input
              type="text"
              value={bulstat}
              onChange={(e) => setBulstat(e.target.value)}
              placeholder="Помага при по-бързо одобрение"
              className={inputClass}
            />
          </label>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="flex flex-col gap-4">
          {services.map((s, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Услуга {i + 1}</span>
                {services.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeService(i)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Премахни
                  </button>
                )}
              </div>
              <input
                type="text"
                value={s.title}
                onChange={(e) => updateService(i, { title: e.target.value })}
                placeholder="Заглавие (напр. Смяна на контакт)"
                className={inputClass}
              />
              <textarea
                value={s.description}
                onChange={(e) => updateService(i, { description: e.target.value })}
                placeholder="Описание (незадължително)"
                rows={2}
                className={textareaClass}
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  min={0}
                  value={s.priceFrom}
                  onChange={(e) => updateService(i, { priceFrom: e.target.value })}
                  placeholder="Цена от"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={s.priceUnit}
                  onChange={(e) => updateService(i, { priceUnit: e.target.value })}
                  placeholder="лв/час"
                  className={inputClass}
                />
                <input
                  type="number"
                  min={1}
                  value={s.durationMin}
                  onChange={(e) => updateService(i, { durationMin: e.target.value })}
                  placeholder="Минути"
                  className={inputClass}
                />
              </div>
            </div>
          ))}
          <button type="button" onClick={addService} className={secondaryBtn}>
            + Добави услуга
          </button>
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="flex flex-col gap-2">
          {hours.map((h, i) => (
            <div key={h.weekday} className="flex items-center gap-3 rounded-md border p-3">
              <label className="flex w-36 shrink-0 items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={h.enabled}
                  onChange={(e) => updateHour(i, { enabled: e.target.checked })}
                />
                {DAY_NAMES[h.weekday]}
              </label>
              {h.enabled && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={h.startTime}
                    onChange={(e) => updateHour(i, { startTime: e.target.value })}
                    className="h-10 rounded-md border px-2 text-sm"
                  />
                  <span className="text-muted-foreground">–</span>
                  <input
                    type="time"
                    value={h.endTime}
                    onChange={(e) => updateHour(i, { endTime: e.target.value })}
                    className="h-10 rounded-md border px-2 text-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </fieldset>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-between gap-2">
        {step > 1 ? (
          <button type="button" onClick={goBack} className={secondaryBtn}>
            Назад
          </button>
        ) : (
          <span />
        )}
        {step < 3 ? (
          <button type="button" onClick={goNext} className={primaryBtn}>
            Напред
          </button>
        ) : (
          <button type="button" onClick={onFinish} disabled={submitting} className={primaryBtn}>
            {submitting ? "Изпращане…" : "Завърши"}
          </button>
        )}
      </div>
    </div>
  );
}

function StepDot({
  active,
  done,
  children,
}: {
  active: boolean;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <li
      className={`flex-1 border-b-2 pb-2 ${
        active ? "border-primary text-foreground" : done ? "border-primary/50" : "border-border"
      }`}
    >
      {children}
    </li>
  );
}
