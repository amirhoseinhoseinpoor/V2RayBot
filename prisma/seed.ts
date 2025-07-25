import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Seeding started");

    const user = await prisma.user.upsert({
      where: { email: "test@example.com" },
      update: {},
      create: {
        name: "Test User",
        email: "test@example.com",
      },
    });

    console.log("Created user:", user);
    console.log("Seeding finished");
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1); // Exit on error so you know something went wrong
  } finally {
    await prisma.$disconnect();
  }
}

main();
