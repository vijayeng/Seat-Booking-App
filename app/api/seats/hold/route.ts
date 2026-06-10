import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateSeatHoldRequest } from "@/lib/seat-hold-validation";
import { expireStaleSeatHolds } from "@/lib/seat-hold-expiration";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: string;

  try {
    const verifiedToken = await verifyAuthToken(token);
    userId = verifiedToken.userId;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const heldSeat = await prisma.$transaction(async (tx) => {
      await expireStaleSeatHolds(tx);

      const seat = await tx.$queryRaw<
        Array<{
          id: string;
          seatNumber: string;
          status: "AVAILABLE" | "HELD" | "RESERVED";
          heldUntil: Date | null;
        }>
      >`
        SELECT "id", "seatNumber", "status", "heldUntil"
        FROM "Seat"
        WHERE "id" = ${validation.data.seatId}
        FOR UPDATE
      `;

      const currentSeat = seat[0];

      if (!currentSeat) {
        return null;
      }

      if (currentSeat.status !== "AVAILABLE") {
        return {
          conflict: true as const,
          seat: currentSeat,
        };
      }

      const updatedSeat = await tx.seat.update({
        where: {
          id: currentSeat.id,
        },
        data: {
          status: "HELD",
          heldByUserId: userId,
          heldUntil: new Date(Date.now() + 5 * 60 * 1000),
        },
        select: {
          id: true,
          seatNumber: true,
          status: true,
          heldUntil: true,
        },
      });

      return {
        conflict: false as const,
        seat: updatedSeat,
      };
    });

    if (!heldSeat) {
      return NextResponse.json(
        {
          error: "Seat not found.",
        },
        { status: 404 },
      );
    }

    if (heldSeat.conflict) {
      return NextResponse.json(
        {
          error: "Seat is already held or reserved.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        seat: {
          id: heldSeat.seat.id,
          seatNumber: heldSeat.seat.seatNumber,
          status: heldSeat.seat.status,
          heldUntil: heldSeat.seat.heldUntil
            ? heldSeat.seat.heldUntil.toISOString()
            : null,
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        error: "Failed to hold seat.",
      },
      { status: 500 },
    );
  }
}
