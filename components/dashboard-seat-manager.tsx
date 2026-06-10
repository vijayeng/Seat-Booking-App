"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type SeatStatus = "AVAILABLE" | "HELD" | "RESERVED";

type Seat = {
  id: string;
  seatNumber: string;
  status: SeatStatus;
  heldUntil: string | null;
};

type SeatsResponse = {
  seats: Seat[];
};

type ActionState = {
  seatId: string | null;
  message: string | null;
  error: string | null;
};

const STATUS_STYLES: Record<
  SeatStatus,
  { label: string; badge: string; helper: string }
> = {
  AVAILABLE: {
    label: "Available",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    helper: "Ready to reserve now.",
  },
  HELD: {
    label: "Held",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    helper: "Reserved in progress.",
  },
  RESERVED: {
    label: "Reserved",
    badge: "border-slate-200 bg-slate-100 text-slate-600",
    helper: "Fully booked.",
  },
};

async function fetchSeats(): Promise<SeatsResponse> {
  const response = await fetch("/api/seats", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load seats.");
  }

  return (await response.json()) as SeatsResponse;
}

async function holdAndConfirmSeat(seatId: string) {
  const holdResponse = await fetch("/api/seats/hold", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ seatId }),
  });

  if (!holdResponse.ok) {
    const payload = (await holdResponse.json().catch(() => null)) as
      | { error?: string }
      | null;

    throw new Error(payload?.error ?? "Unable to hold seat.");
  }

  return (await holdResponse.json()) as { seat: Seat };
}

async function logoutUser() {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    throw new Error(payload?.error ?? "Unable to log out.");
  }
}

export function DashboardSeatManager() {
  const router = useRouter();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>({
    seatId: null,
    message: null,
    error: null,
  });
  const [isPending, startTransition] = useTransition();
  const [isLoggingOut, startLogoutTransition] = useTransition();

  useEffect(() => {
    let active = true;

    async function loadSeats() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await fetchSeats();

        if (!active) {
          return;
        }

        setSeats(data.seats);
      } catch {
        if (active) {
          setError("We couldn't load the seat map right now.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadSeats();

    return () => {
      active = false;
    };
  }, []);

  const reservedSeats = useMemo(
    () => seats.filter((seat) => seat.status === "RESERVED").length,
    [seats],
  );

  const handleReserve = (seatId: string) => {
    startTransition(async () => {
      try {
        setActionState({
          seatId,
          message: null,
          error: null,
        });

        const result = await holdAndConfirmSeat(seatId);
        const data = await fetchSeats();

        setSeats(data.seats);
        router.push(`/payment?seatId=${encodeURIComponent(result.seat.id)}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";

        setActionState({
          seatId,
          message: null,
          error: message,
        });
      }
    });
  };

  const handleLogout = () => {
    startLogoutTransition(async () => {
      try {
        await logoutUser();
        router.replace("/login");
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to log out.";
        setActionState({
          seatId: null,
          message: null,
          error: message,
        });
      }
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Seat Reservation Overview
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              View the current state of A, B, and C. Reserve an available seat
              to move it through the hold and payment flow.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{reservedSeats}</span>{" "}
              of {seats.length || 3} seats reserved
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>

        {(error || actionState.error || actionState.message) && (
          <div className="mt-6 space-y-3">
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            {actionState.error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {actionState.error}
              </div>
            ) : null}
            {actionState.message ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {actionState.message}
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {isLoading
          ? [0, 1, 2].map((index) => (
              <div
                key={index}
                className="animate-pulse rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="h-4 w-20 rounded-full bg-slate-200" />
                <div className="mt-4 h-8 w-36 rounded-xl bg-slate-200" />
                <div className="mt-4 h-4 w-28 rounded-full bg-slate-200" />
                <div className="mt-6 h-11 w-full rounded-2xl bg-slate-200" />
              </div>
            ))
          : seats.map((seat) => {
              const statusConfig = STATUS_STYLES[seat.status];
              const isActiveLoading = isPending && actionState.seatId === seat.id;
              const canReserve = seat.status === "AVAILABLE";
              const isHeld = seat.status === "HELD";

              return (
                <article
                  key={seat.id}
                  className="flex flex-col rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Seat</p>
                      <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                        {seat.seatNumber}
                      </h2>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusConfig.badge}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">{statusConfig.helper}</p>

                  <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span className="font-medium text-slate-900">Status:</span> {seat.status}
                    {seat.heldUntil ? (
                      <span className="mt-1 block text-xs text-slate-500">
                        Held until {new Date(seat.heldUntil).toLocaleString()}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-6 flex flex-1 items-end">
                    {canReserve ? (
                      <button
                        type="button"
                        onClick={() => handleReserve(seat.id)}
                        disabled={isPending}
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isActiveLoading ? "Processing..." : "Reserve"}
                      </button>
                    ) : isHeld ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700"
                      >
                        Reserved In Progress
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500"
                      >
                        Reserved
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
      </section>
    </div>
  );
}
