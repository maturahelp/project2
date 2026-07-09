"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMaistorProfile, type UpdateProfileInput } from "./actions";
import { TRADE_CATEGORIES, CITIES } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "h-11 w-full rounded-md border px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring";
const textareaClass =
  "w-full rounded-md border px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring";
const primaryBtn =
  "inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60";
const secondaryBtn =
  "inline-flex h-11 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60";

// 0 = Sunday .. 6 = Saturday (Postgres dow). Rendered Monday-first.
const DAY_NAMES = ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // display order -> Postgres weekday
const MAX_PHOTOS = 8;

type ServiceDraft = {
  title: string;
  description: string;
  priceFrom: string;
  priceUnit: string;
  durationMin: string;
};

type HourDraft = { weekday: number; enabled: boolean; startTime: string; endTime: string };

type InitialData = {
  displayName: string;
  bio: string;
  baseCity: string;
  categories: string[];
  bulstat: string;
  services: {
    title: string;
    description: string | null;
    price_from: number | null;
    price_unit: string | null;
    duration_min: number | null;
  }[];
  workingHours: { weekday: number; start_time: string; end_time: string }[];
  portfolio: { path: string; url: string }[];
};

export function EditProfileForm({
  userId,
  initialData,
}: {
  userId: string;
  initialData: InitialData;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, startSubmit] = useTransition();

  const knownCategories = initialData.categories.filter((c) =>
    (TRADE_CATEGORIES as readonly string[]).includes(c),
  );
  const otherCategories = initialData.categories.filter(
    (c) => !(TRADE_CATEGORIES as readonly string[]).includes(c),
  );

  const [displayName, setDisplayName] = useState(initialData.displayName);
  const [bio, setBio] = useState(initialData.bio);
  const [baseCity, setBaseCity] = useState(initialData.baseCity);
  const [categories, setCategories] = useState<string[]>(knownCategories);
  const [otherCategory, setOtherCategory] = useState(otherCategories.join(", "));
  const [bulstat, setBulstat] = useState(initialData.bulstat);

  const [services, setServices] = useState<ServiceDraft[]>(
    initialData.services.length > 0
      ? initialData.services.map((s) => ({
          title: s.title,
          description: s.description ?? "",
          priceFrom: s.price_from != null ? String(s.price_from) : "",
          priceUnit: s.price_unit ?? "лв/час",
          durationMin: s.duration_min != null ? String(s.duration_min) : "60",
        }))
      : [{ title: "", description: "", priceFrom: "", priceUnit: "лв/час", durationMin: "60" }],
  );

  const [hours, setHours] = useState<HourDraft[]>(
    WEEK_ORDER.map((weekday) => {
      const existing = initialData.workingHours.find((h) => h.weekday === weekday);
      return {
        weekday,
        enabled: !!existing,
        startTime: existing?.start_time.slice(0, 5) ?? "09:00",
        endTime: existing?.end_time.slice(0, 5) ?? "18:00",
      };
    }),
  );

  // Portfolio state (independent of the text-section save button).
  const [photos, setPhotos] = useState(initialData.portfolio);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

  async function onUploadPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPhotoError(null);

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setPhotoError(`Може да качите най-много ${MAX_PHOTOS} снимки.`);
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const toUpload = Array.from(files).slice(0, room);

    for (const file of toUpload) {
      const path = `${userId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("portfolio").upload(path, file);
      if (uploadError) {
        setPhotoError("Качването не бе успешно. Опитайте отново.");
        continue;
      }
      const url = supabase.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
      setPhotos((cur) => [...cur, { path, url }]);
    }
    setUploading(false);
  }

  async function onDeletePhoto(path: string) {
    const supabase = createClient();
    const { error: deleteError } = await supabase.storage.from("portfolio").remove([path]);
    if (deleteError) {
      setPhotoError("Изтриването не бе успешно. Опитайте отново.");
      return;
    }
    setPhotos((cur) => cur.filter((p) => p.path !== path));
  }

  function onSave() {
    setError(null);
    setSaved(false);
    const enabledHours = hours.filter((h) => h.enabled);
    if (enabledHours.length === 0) {
      setError("Изберете поне един работен ден.");
      return;
    }

    const payload: UpdateProfileInput = {
      displayName: displayName.trim(),
      bio: bio.trim() || undefined,
      baseCity: baseCity.trim(),
      categories: [
        ...categories,
        ...otherCategory
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      ],
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
      const res = await updateMaistorProfile(payload);
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10">
      <Section title="Основна информация">
        <div className="flex flex-col gap-4">
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
        </div>
      </Section>

      <Section title="Услуги">
        <div className="flex flex-col gap-4">
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
        </div>
      </Section>

      <Section title="Работно време">
        <div className="flex flex-col gap-2">
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
        </div>
      </Section>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="text-sm text-green-600" role="status">
          Промените са запазени.
        </p>
      )}

      <button type="button" onClick={onSave} disabled={submitting} className={primaryBtn}>
        {submitting ? "Запазване…" : "Запази промените"}
      </button>

      <Section title="Портфолио">
        <div className="flex flex-col gap-4">
          {photos.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Няма качени снимки.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((p) => (
                <li key={p.path} className="group relative aspect-square overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  <button
                    type="button"
                    onClick={() => onDeletePhoto(p.path)}
                    className="absolute right-1 top-1 rounded-md bg-background/90 px-2 py-1 text-xs font-medium text-red-600 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    Изтрий
                  </button>
                </li>
              ))}
            </ul>
          )}

          {photoError && (
            <p className="text-sm text-red-600" role="alert">
              {photoError}
            </p>
          )}

          <label className={`${secondaryBtn} w-fit cursor-pointer`}>
            {uploading ? "Качване…" : "+ Добави снимки"}
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading || photos.length >= MAX_PHOTOS}
              onChange={(e) => onUploadPhotos(e.target.files)}
              className="hidden"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            До {MAX_PHOTOS} снимки, максимум 5MB всяка.
          </p>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
