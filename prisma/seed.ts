import "dotenv/config";
import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.package.createMany({
    data: [
      { name: "20-Uur Pakket", description: "Basisopleiding voor beginnende bestuurders.", hours: 20, priceAutomaat: 155000, priceManueel: 145000, registrationFee: 2500 },
      { name: "10-Uur Pakket", description: "Gericht op het verbeteren van je zwakke punten.", hours: 10, priceAutomaat: 80000, priceManueel: 75000, registrationFee: 2500 },
      { name: "6 uur - 2x mislukt examen", description: "Voor wie 2 keer gezakt is voor het examen.", hours: 6, priceAutomaat: 48000, priceManueel: 45000, registrationFee: 2500 },
      { name: "M12 Voorlopig Rijbewijs Pakket", description: "Behaal je M12 voorlopig rijbewijs.", hours: 6, priceAutomaat: 48000, priceManueel: 45000, registrationFee: 2500 },
      { name: "Losse Rijles (2 uur)", description: "Extra oefening voor specifieke vaardigheden.", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
      { name: "Losse Rijles (2u) + Praktijkexamen", description: "Nog wat oefenen en meteen examen afleggen.", hours: 2, priceAutomaat: 37500, priceManueel: 35000, registrationFee: 2500 },
      { name: "Praktijkexamen", description: "Leg je praktijkexamen af.", hours: 0, priceAutomaat: 21500, priceManueel: 20000, registrationFee: 2500 },
      { name: "Theorieles Pakket (12 uur)", description: "Voorbereiding op het theorie-examen, verdeeld over 3 dagen.", hours: 12, priceAutomaat: 15000, priceManueel: 15000, registrationFee: 2500 },
    ],
  });

  const instructor = await prisma.instructor.create({
    data: { name: "Jan Peeters", transmission: "BOTH", active: true },
  });

  await prisma.availabilityRule.createMany({
    data: [1, 2, 3, 4, 5].map((weekday) => ({
      instructorId: instructor.id, weekday, startTime: "09:00", endTime: "17:00",
    })).concat([{ instructorId: instructor.id, weekday: 6, startTime: "09:00", endTime: "13:00" }]),
  });

  // Generate a random password each time the seed runs, rather than shipping a fixed,
  // publicly-documented default (e.g. "changeme123") that would otherwise sit unchanged in
  // every dev/staging database until someone remembers to rotate it.
  const generatedPassword = randomBytes(9).toString("base64url");
  const passwordHash = await hash(generatedPassword, 10);
  await prisma.staffUser.create({
    data: { email: "beheerder@alpha-rijschool.be", passwordHash, role: "ADMIN" },
  });

  console.log("Seed klaar.");
  console.log(`Beheerder-account: beheerder@alpha-rijschool.be`);
  console.log(`Gegenereerd wachtwoord: ${generatedPassword}`);
  console.log("Bewaar dit wachtwoord nu (bv. in een password manager) — het wordt niet opnieuw getoond.");
}

main().finally(() => prisma.$disconnect());
