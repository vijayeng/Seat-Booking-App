import "dotenv/config";

import { PrismaClient, SeatStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.seat.deleteMany();

  await prisma.seat.createMany({
    data: [
      { seatNumber: "Seat A", status: SeatStatus.AVAILABLE },
      { seatNumber: "Seat B", status: SeatStatus.AVAILABLE },
      { seatNumber: "Seat C", status: SeatStatus.AVAILABLE },
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
