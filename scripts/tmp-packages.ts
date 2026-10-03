import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const packages = await prisma.package.findMany({
    orderBy: { hours: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      hours: true,
      priceAutomaat: true,
      priceManueel: true,
      registrationFee: true,
      isSingleLesson: true,
      active: true,
    },
  });
  console.log(JSON.stringify(packages, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
