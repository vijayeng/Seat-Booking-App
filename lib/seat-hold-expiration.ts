import type { Prisma, PrismaClient } from "@prisma/client";

type SeatHoldCleanupClient = PrismaClient | Prisma.TransactionClient;

type SeatHoldCleanupResult = {
  expiredCount: number;
};

function getExpiredHoldFilter(currentTime: Date): Prisma.SeatWhereInput {
  return {
    status: "HELD",
    heldUntil: {
      lt: currentTime,
    },
  };
}

export async function expireStaleSeatHolds(
  client: SeatHoldCleanupClient,
  currentTime = new Date(),
): Promise<SeatHoldCleanupResult> {
  const result = await client.seat.updateMany({
    where: getExpiredHoldFilter(currentTime),
    data: {
      status: "AVAILABLE",
      heldByUserId: null,
      heldUntil: null,
    },
  });

  return {
    expiredCount: result.count,
  };
}
