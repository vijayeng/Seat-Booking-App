import type { PrismaClient, Prisma } from "@prisma/client";
import { ReservationStatus, PaymentStatus } from "@prisma/client";

import { expireStaleSeatHolds } from "@/lib/seat-hold-expiration";

type ReservationConfirmationClient = PrismaClient | Prisma.TransactionClient;

export type ReservationConfirmationInput = {
  seatId: string;
  userId: string;
  currentTime?: Date;
};

export type ReservationConfirmationResult =
  | { kind: "success" }
  | { kind: "not_found" }
  | { kind: "duplicate_active_reservation" }
  | { kind: "validation_failed" };

type SeatRow = {
  id: string;
  status: "AVAILABLE" | "HELD" | "RESERVED";
  heldByUserId: string | null;
  heldUntil: Date | null;
};

function isHoldValid(seat: SeatRow, userId: string, currentTime: Date) {
  return (
    seat.status === "HELD" &&
    seat.heldByUserId === userId &&
    seat.heldUntil !== null &&
    seat.heldUntil > currentTime
  );
}

async function createReservationRecord(
  tx: Prisma.TransactionClient,
  seatId: string,
  userId: string,
) {
  const reservation = await tx.reservation.create({
    data: {
      userId,
      seatId,
      status: ReservationStatus.PENDING,
    },
    select: {
      id: true,
    },
  });

  return reservation.id;
}

export async function confirmSeatReservation(
  client: ReservationConfirmationClient,
  input: ReservationConfirmationInput,
): Promise<ReservationConfirmationResult> {
  const currentTime = input.currentTime ?? new Date();

  return client.$transaction(async (tx) => {
    await expireStaleSeatHolds(tx, currentTime);

    const seatRows = await tx.$queryRaw<SeatRow[]>`
      SELECT "id", "status", "heldByUserId", "heldUntil"
      FROM "Seat"
      WHERE "id" = ${input.seatId}
      FOR UPDATE
    `;

    const seat = seatRows[0];

    if (!seat) {
      return { kind: "not_found" as const };
    }

    const activeReservation = await tx.reservation.findFirst({
      where: {
        seatId: seat.id,
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
      },
      select: {
        id: true,
      },
    });

    if (activeReservation) {
      return { kind: "duplicate_active_reservation" as const };
    }

    const reservationId = await createReservationRecord(tx, seat.id, input.userId);

    if (!isHoldValid(seat, input.userId, currentTime)) {
      await tx.reservation.update({
        where: {
          id: reservationId,
        },
        data: {
          status: ReservationStatus.FAILED,
        },
      });

      return { kind: "validation_failed" as const };
    }

    const payment = await tx.payment.create({
      data: {
        reservationId,
        status: PaymentStatus.PENDING,
      },
      select: {
        id: true,
      },
    });

    await tx.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.SUCCESS,
      },
    });

    await tx.reservation.update({
      where: {
        id: reservationId,
      },
      data: {
        status: ReservationStatus.CONFIRMED,
      },
    });

    await tx.seat.update({
      where: {
        id: seat.id,
      },
      data: {
        status: "RESERVED",
        heldByUserId: null,
        heldUntil: null,
      },
    });

    return { kind: "success" as const };
  });
}
