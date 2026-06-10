import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, SeatStatus } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the seed script.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const seats = ["Seat A", "Seat B", "Seat C"] as const;

  for (const seatNumber of seats) {
    await prisma.seat.upsert({
      where: { seatNumber },
      create: {
        seatNumber,
        status: SeatStatus.AVAILABLE,
      },
      update: {
        status: SeatStatus.AVAILABLE,
        heldByUserId: null,
        heldUntil: null,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
