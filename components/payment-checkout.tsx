"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

type PaymentResult = {
  success: true;
};

async function fetchSeats(): Promise<SeatsResponse> {
  const response = await fetch("/api/seats", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load seat details.");
  }

  return (await response.json()) as SeatsResponse;
}

async function submitPayment(seatId: string) {
  const response = await fetch("/api/payment", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ seatId }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    throw new Error(payload?.error ?? "Payment failed.");
  }

  return (await response.json()) as PaymentResult;
}

export function PaymentCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seatId = searchParams.get("seatId");

  const [seat, setSeat] = useState<Seat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmationTime, setConfirmationTime] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    async function loadSeat() {
      try {
        setIsLoading(true);
        setError(null);

        if (!seatId) {
          throw new Error("No seat was selected.");
        }

        const data = await fetchSeats();
        const selectedSeat = data.seats.find((item) => item.id === seatId) ?? null;

        if (!active) {
          return;
        }

        if (!selectedSeat) {
          setError("Selected seat was not found.");
          setSeat(null);
          return;
        }

        setSeat(selectedSeat);
      } catch (loadError) {
        if (active) {
          const message =
            loadError instanceof Error ? loadError.message : "Unable to load payment page.";
          setError(message);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadSeat();

    return () => {
      active = false;
    };
  }, [seatId]);

  const isSeatReady = useMemo(
    () => seat?.status === "HELD",
    [seat],
  );

  const handleProceed = () => {
    if (!seat) {
      return;
    }

    startTransition(async () => {
      try {
        setPaymentError(null);
        await submitPayment(seat.id);
        setSuccess(true);
        setConfirmationTime(new Date().toLocaleString());

        const updatedSeats = await fetchSeats();
        const updatedSeat = updatedSeats.seats.find((item) => item.id === seat.id) ?? seat;
        setSeat(updatedSeat);
      } catch (submitError) {
        const message =
          submitError instanceof Error ? submitError.message : "Unable to complete payment.";
        setPaymentError(message);
      }
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_100%)]" />
      <div className="absolute left-[-8rem] top-20 -z-10 h-72 w-72 rounded-full bg-sky-300/30 blur-3xl" />
      <div className="absolute bottom-0 right-[-6rem] -z-10 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center">
        <div className="grid w-full gap-6 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur-lg lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <section className="relative overflow-hidden rounded-[1.5rem] bg-slate-950 p-8 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_40%)]" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
                Payment Review
              </p>
              <h1 className="mt-4 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
                Review your selected seat before payment.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300 sm:text-base">
                Confirm the held seat details and then proceed to complete the reservation.
              </p>
            </div>
          </section>

          <section className="flex flex-col justify-center rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.35)] sm:p-8">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-700">
              Payment Confirmation
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Review Selected Seat
            </h2>

            {isLoading ? (
              <div className="mt-8 space-y-4">
                <div className="h-5 w-48 animate-pulse rounded-full bg-slate-200" />
                <div className="h-5 w-36 animate-pulse rounded-full bg-slate-200" />
                <div className="h-5 w-56 animate-pulse rounded-full bg-slate-200" />
              </div>
            ) : error ? (
              <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : success ? (
              <div className="mt-8 space-y-5">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  Payment successful. Your reservation is confirmed.
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Reservation Details
                  </h3>
                  <dl className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500">Seat</dt>
                      <dd className="font-semibold text-slate-950">{seat?.seatNumber ?? "-"}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500">Status</dt>
                      <dd className="font-semibold text-slate-950">RESERVED</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500">Payment</dt>
                      <dd className="font-semibold text-slate-950">SUCCESS</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500">Confirmed At</dt>
                      <dd className="font-semibold text-slate-950">
                        {confirmationTime ?? "-"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <>
                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <dl className="space-y-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500">Seat Number</dt>
                      <dd className="font-semibold text-slate-950">{seat?.seatNumber ?? "-"}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500">Current Status</dt>
                      <dd className="font-semibold text-slate-950">{seat?.status ?? "-"}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500">Hold Expiry</dt>
                      <dd className="font-semibold text-slate-950">
                        {seat?.heldUntil ? new Date(seat.heldUntil).toLocaleString() : "-"}
                      </dd>
                    </div>
                  </dl>
                </div>

                {paymentError ? (
                  <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {paymentError}
                  </div>
                ) : null}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Back to Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={handleProceed}
                    disabled={!seat || !isSeatReady || isPending}
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? "Processing..." : "Proceed To Payment"}
                  </button>
                </div>

                {!isSeatReady && seat ? (
                  <p className="mt-3 text-sm text-amber-700">
                    This seat is not currently held, so payment cannot continue.
                  </p>
                ) : null}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
