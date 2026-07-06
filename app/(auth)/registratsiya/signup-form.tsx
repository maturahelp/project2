"use client";

import { useActionState, useState } from "react";
import { signUp, type AuthState } from "../actions";

const initialState: AuthState = {};

const inputClass =
  "h-11 rounded-md border px-3 text-base font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const [role, setRole] = useState<"maistor" | "client">("client");

  if (state.message) {
    return (
      <div
        className="mt-6 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        role="status"
      >
        {state.message}
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="role" value={role} />

      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Роля">
        <button
          type="button"
          role="radio"
          aria-checked={role === "maistor"}
          onClick={() => setRole("maistor")}
          className={`h-11 rounded-md border px-3 text-sm font-medium transition-colors ${
            role === "maistor"
              ? "border-primary bg-primary text-primary-foreground"
              : "hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          Аз съм майстор
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={role === "client"}
          onClick={() => setRole("client")}
          className={`h-11 rounded-md border px-3 text-sm font-medium transition-colors ${
            role === "client"
              ? "border-primary bg-primary text-primary-foreground"
              : "hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          Търся майстор
        </button>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Име
        <input type="text" name="full_name" required autoComplete="name" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Имейл
        <input type="email" name="email" required autoComplete="email" className={inputClass} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Парола
        <input
          type="password"
          name="password"
          required
          minLength={6}
          autoComplete="new-password"
          className={inputClass}
        />
      </label>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? "Създаване…" : "Създай акаунт"}
      </button>
    </form>
  );
}
