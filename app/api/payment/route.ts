import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { confirmSeatReservation } from "@/lib/reservation-confirmation";
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
    const result = await confirmSeatReservation(prisma, {
      seatId: validation.data.seatId,
      userId,
    });

    if (result.kind === "not_found") {
      return NextResponse.json(
        {
          error: "Seat not found.",
        },
        { status: 404 },
      );
    }

    if (result.kind === "duplicate_active_reservation") {
      return NextResponse.json(
        {
          error: "A reservation already exists for this seat.",
        },
        { status: 409 },
      );
    }

    if (result.kind === "validation_failed") {
      return NextResponse.json(
        {
          error: "Seat must be HELD by the current user and the hold must be active.",
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
