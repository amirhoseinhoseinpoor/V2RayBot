import { prisma } from "../src/db/index.js";
import { VPN_PLANS } from "../src/constants/plans.js";

async function main() {
  for (const plan of VPN_PLANS) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: {},
      create: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        trafficGB: plan.trafficGB,
        duration: plan.duration,
        description: plan.description,
      },
    });
  }

  console.log("✅ Plans seeded!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
