import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expireStaleSeatHolds } from "@/lib/seat-hold-expiration";

type SeatResponse = {
  id: string;
  seatNumber: string;
  status: "AVAILABLE" | "HELD" | "RESERVED";
  heldUntil: string | null;
};

function unauthorizedResponse() {
  return NextResponse.json(
    {
      error: "Unauthorized",
    },
    { status: 401 },
  );
}

async function requireAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { userId } = await verifyAuthToken(token);
    return { userId };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const authUser = await requireAuthenticatedUser(request);

  if (!authUser) {
    return unauthorizedResponse();
  }

  try {
    await expireStaleSeatHolds(prisma);

    const seats = await prisma.seat.findMany({
      select: {
        id: true,
        seatNumber: true,
        status: true,
        heldUntil: true,
      },
      orderBy: {
        seatNumber: "asc",
      },
    });

    const responseBody: { seats: SeatResponse[] } = {
      seats: seats.map((seat) => ({
        id: seat.id,
        seatNumber: seat.seatNumber,
        status: seat.status,
        heldUntil: seat.heldUntil ? seat.heldUntil.toISOString() : null,
      })),
    };

    return NextResponse.json(responseBody, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        error: "Failed to fetch seats.",
      },
      { status: 500 },
    );
  }
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Method not allowed.",
    },
    { status: 405 },
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      error: "Method not allowed.",
    },
    { status: 405 },
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error: "Method not allowed.",
    },
    { status: 405 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: "Method not allowed.",
    },
    { status: 405 },
  );
}
