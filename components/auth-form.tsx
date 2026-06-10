"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { validateAuthCredentials, type AuthFieldErrors } from "@/lib/auth-validation";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

type ApiErrorResponse = {
  error?: string;
  fields?: AuthFieldErrors;
};

function getCopy(mode: AuthMode) {
  return mode === "login"
    ? ({
        heading: "Welcome back",
        subheading: "Sign in to continue to your seat dashboard.",
        submitLabel: "Log in",
        switchPrompt: "New here?",
        switchLabel: "Create an account",
        switchHref: "/signup",
      } as const)
    : ({
        heading: "Create your account",
        subheading: "Sign up to reserve and manage your seat.",
        submitLabel: "Sign up",
        switchPrompt: "Already have an account?",
        switchLabel: "Log in",
        switchHref: "/login",
      } as const);
}

async function submitAuthRequest(mode: AuthMode, email: string, password: string) {
  const response = await fetch(`/api/auth/${mode}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Authentication failed.");
  }

  return payload;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const copy = getCopy(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validateAuthCredentials({ email, password });

    if (!validation.success) {
      setErrors(validation.errors);
      setFormError(null);
      return;
    }

    setErrors({});
    setFormError(null);

    startTransition(async () => {
      try {
        await submitAuthRequest(mode, validation.data.email, validation.data.password);
        router.replace("/dashboard");
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Something went wrong.";
        setFormError(message);
      }
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_100%)]" />
      <div className="absolute left-[-8rem] top-20 -z-10 h-72 w-72 rounded-full bg-sky-300/30 blur-3xl" />
      <div className="absolute bottom-0 right-[-6rem] -z-10 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-6 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur-lg lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <section className="relative overflow-hidden rounded-[1.5rem] bg-slate-950 p-8 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_40%)]" />
            <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
            Seat Booking App
          </p>
          <h1 className="mt-4 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
            {copy.heading}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300 sm:text-base">
            {copy.subheading}
          </p>
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            Secure authentication with JWT cookies, password hashing, and a protected dashboard.
          </div>
            </div>
          </section>

          <section className="flex flex-col justify-center rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.35)] sm:p-8">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-700">
                {copy.submitLabel}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                {copy.heading}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use your email and password to continue.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="you@example.com"
                  required
                />
                {errors.email ? <p className="text-sm text-rose-600">{errors.email}</p> : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="Minimum 8 characters"
                  required
                />
                {errors.password ? (
                  <p className="text-sm text-rose-600">{errors.password}</p>
                ) : null}
              </div>

              {formError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Please wait..." : copy.submitLabel}
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-600">
              {copy.switchPrompt}{" "}
              <Link
                href={copy.switchHref}
                className="font-semibold text-slate-950 hover:underline"
              >
                {copy.switchLabel}
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
