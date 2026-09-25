import "dotenv/config";
import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { SLOT_STARTS } from "../src/lib/constants";
import { createAdminSupabase } from "../src/lib/supabase/admin";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function slotEnd(start: string) {
  return `${String(Number(start.slice(0, 2)) + 2).padStart(2, "0")}:00`;
}

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
    data: [1, 2, 3, 4, 5].flatMap((weekday) =>
      SLOT_STARTS.map((startTime) => ({ instructorId: instructor.id, weekday, startTime, endTime: slotEnd(startTime) }))
    ),
  });

  const email = "beheerder@alpha-rijschool.be";
  const generatedPassword = randomBytes(9).toString("base64url");
  const admin = createAdminSupabase();
  const created = await admin.auth.admin.createUser({
    email,
    password: generatedPassword,
    email_confirm: true,
    app_metadata: { role: "ADMIN", instructor_id: null },
  });
  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? "Beheerder aanmaken in Supabase mislukt.");
  }
  await prisma.profile.create({
    data: { id: created.data.user.id, email, role: "ADMIN" },
  });

  console.log("Seed klaar.");
  console.log(`Beheerder-account: ${email}`);
  console.log(`Gegenereerd wachtwoord: ${generatedPassword}`);
  console.log("Bewaar dit wachtwoord nu (bv. in een password manager) — het wordt niet opnieuw getoond.");
}

main().finally(() => prisma.$disconnect());
