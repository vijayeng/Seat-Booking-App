import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expireStaleSeatHolds } from "@/lib/seat-hold-expiration";
import { validateSeatHoldRequest } from "@/lib/seat-hold-validation";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return unauthorizedResponse();
  }

  let userId: string;

  try {
    const verifiedToken = await verifyAuthToken(token);
    userId = verifiedToken.userId;
  } catch {
    return unauthorizedResponse();
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON body.",
      },
      { status: 400 },
    );
  }

  const validation = validateSeatHoldRequest(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error: validation.error,
      },
      { status: 400 },
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await expireStaleSeatHolds(tx);

      const seatRows = await tx.$queryRaw<
        Array<{
          id: string;
          status: "AVAILABLE" | "HELD" | "RESERVED";
          heldByUserId: string | null;
          heldUntil: Date | null;
        }>
      >`
        SELECT "id", "status", "heldByUserId", "heldUntil"
        FROM "Seat"
        WHERE "id" = ${validation.data.seatId}
        FOR UPDATE
      `;

      const seat = seatRows[0];

      if (!seat) {
        return { kind: "not_found" as const };
      }

      if (seat.status !== "HELD" || seat.heldByUserId !== userId) {
        return {
          kind: "conflict" as const,
        };
      }

      const reservation = await tx.reservation.create({
        data: {
          userId,
          seatId: seat.id,
          status: "PENDING",
        },
        select: {
          id: true,
        },
      });

      const payment = await tx.payment.create({
        data: {
          reservationId: reservation.id,
          status: "PENDING",
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
          status: "SUCCESS",
        },
      });

      await tx.reservation.update({
        where: {
          id: reservation.id,
        },
        data: {
          status: "CONFIRMED",
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

    if (result.kind === "not_found") {
      return NextResponse.json(
        {
          error: "Seat not found.",
        },
        { status: 404 },
      );
    }

    if (result.kind === "conflict") {
      return NextResponse.json(
        {
          error: "Seat must be HELD by the current user before payment.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        error: "Failed to process payment.",
      },
      { status: 500 },
    );
  }
}
