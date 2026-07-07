"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Star, CheckCircle2 } from "lucide-react";
import { submitReview } from "./actions";

export function ReviewForm({
  token,
  maistorName,
  profileHref,
}: {
  token: string;
  maistorName: string;
  profileHref: string;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" aria-hidden />
        <p className="mt-3 font-semibold text-green-900">Благодарим за отзива!</p>
        <Link href={profileHref} className="mt-3 inline-block text-sm text-green-800 underline">
          Към профила на {maistorName}
        </Link>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Изберете оценка от 1 до 5.");
      return;
    }
    start(async () => {
      const res = await submitReview({ token, rating, comment });
      if (res.ok) setDone(true);
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
      <div>
        <p className="mb-2 text-sm font-medium">Вашата оценка</p>
        <div className="flex gap-1" role="radiogroup" aria-label="Оценка">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} от 5`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="p-0.5"
            >
              <Star
                className={
                  n <= (hover || rating)
                    ? "h-9 w-9 fill-amber-400 text-amber-400"
                    : "h-9 w-9 text-muted-foreground/30"
                }
                aria-hidden
              />
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Коментар (по избор)
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Споделете вашето мнение за работата на майстора…"
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
        disabled={pending}
        className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? "Изпращане…" : "Изпрати отзив"}
      </button>
    </form>
  );
}
