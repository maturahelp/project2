"use client";

import { useActionState } from "react";
import { signIn, type AuthState } from "../actions";

const initialState: AuthState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Имейл
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="h-11 rounded-md border px-3 text-base font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Парола
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="h-11 rounded-md border px-3 text-base font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        {pending ? "Влизане…" : "Вход"}
      </button>
    </form>
  );
}
