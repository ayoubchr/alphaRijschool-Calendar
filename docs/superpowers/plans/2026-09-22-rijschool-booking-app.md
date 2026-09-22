# Alpha Rijschool Booking App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working Next.js application where a student can book a driving lesson via a calendar, pay a deposit via Bancontact (Mollie), and where staff can manage availability and bookings.

**Architecture:** Single Next.js (App Router, TypeScript) project with PostgreSQL via Prisma. Public marketing pages + a guest booking wizard + a passwordless "dossier" (magic link) for returning students + a staff admin dashboard with credential login.

**Tech Stack:** Next.js 14, TypeScript, Prisma + PostgreSQL, Tailwind CSS, Vitest + React Testing Library, Mollie API client, Resend (email), NextAuth (Auth.js) credentials provider, react-big-calendar, zod, bcryptjs.

**Spec:** `docs/superpowers/specs/2026-09-22-rijschool-booking-app-design.md`

## Global Constraints

- UI-taal en content: Nederlands.
- Alle bedragen intern in eurocent (integer), nooit floats.
- Geen letterlijke overname van tekst/ontwerp van `antwerpse.biqsdrive.be` of "Antwerpse Rijschool" — enkel de functionele flow als inspiratie (spec §1).
- Voorschot = prijs van het pakket met `isSingleLesson = true`, volgens gekozen transmissie (spec §3 stap 5).
- Annuleringstermijn = 48 uur, als configuratiewaarde (`CANCELLATION_WINDOW_HOURS`), niet hard gecodeerd op meerdere plaatsen (spec §7).
- Rijksregisternummer wordt nooit in leesbare vorm opgeslagen (spec §8).
- Magic links zijn eenmalig en verlopen na 24 uur (spec §8).
- Kalender-UI: `react-big-calendar` (MIT-licentie); geen betaalde/gehoste scheduler-dienst (spec §5).
- Lessen worden geboekt in blokken van 2 uur (`LESSON_BLOCK_MINUTES = 120`).

---

## File Structure

```
alpha-rijschool-app/
  docker-compose.yml
  package.json, tsconfig.json, next.config.ts, tailwind.config.ts
  .env.example, .env.test.example
  prisma/
    schema.prisma
    migrations/.../migration.sql
    seed.ts
  src/
    lib/
      constants.ts, prisma.ts, auth.ts
      availability.ts (+ .test.ts)
      pricing.ts (+ .test.ts)
      magicLink.ts (+ .test.ts)
      cancellation.ts (+ .test.ts)
      encryption.ts (+ .test.ts)
      packages.ts, dossiers.ts
      mollie.ts, email.ts
    test/
      setup.ts, globalSetup.ts, resetDatabase.ts
    components/
      SiteHeader.tsx, SiteFooter.tsx, LessonCalendar.tsx
    app/
      layout.tsx, globals.css, page.tsx
      over-ons/page.tsx, theorie/page.tsx, contact/page.tsx
      veelgestelde-vragen/page.tsx, tarieven-pakketten/page.tsx
      boeken/
        page.tsx
        _components/PackageStep.tsx, TransmissionStep.tsx,
                     CalendarStep.tsx, DetailsStep.tsx, SummaryStep.tsx
      dossier/[token]/page.tsx, DossierView.tsx
      admin/
        login/page.tsx, layout.tsx
        agenda/page.tsx, AgendaView.tsx
        beschikbaarheid/page.tsx, AvailabilityView.tsx
        boekingen/page.tsx, BookingsView.tsx
        dossiers/page.tsx
        rapport/page.tsx
      api/
        packages/route.ts
        availability/route.ts
        bookings/route.ts
        webhooks/mollie/route.ts
        dossier/[token]/route.ts
        dossier/[token]/lessons/route.ts
        auth/[...nextauth]/route.ts
        admin/availability/route.ts
        admin/lessons/[id]/route.ts
```

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `vitest.config.ts`, `src/test/setup.ts`

**Interfaces:** none (foundation task).

- [ ] **Step 1: Scaffold the project**

```bash
npx create-next-app@14 . --typescript --tailwind --app --no-src-dir=false --import-alias "@/*"
```

- [ ] **Step 2: Install remaining dependencies**

```bash
npm install prisma @prisma/client zod bcryptjs next-auth@beta @mollie/api-client resend react-big-calendar date-fns
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom pg dotenv
```

- [ ] **Step 3: Add Vitest config**

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globalSetup: ["./src/test/globalSetup.ts"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

`src/test/setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
import { config } from "dotenv";
config({ path: ".env.test" });
```

- [ ] **Step 4: Write a smoke test for the home page placeholder**

`src/app/page.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home", () => {
  it("renders a heading", () => {
    render(<Home />);
    expect(screen.getByRole("heading")).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npx vitest run src/app/page.test.tsx`
Expected: FAIL (no heading yet in the default scaffolded page, or file doesn't compile).

- [ ] **Step 6: Make it pass with a minimal placeholder page**

`src/app/page.tsx`:
```tsx
export default function Home() {
  return <h1>Alpha Rijschool</h1>;
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run src/app/page.test.tsx`
Expected: PASS

- [ ] **Step 8: Add npm scripts and commit**

`package.json` scripts section:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

```bash
git add -A
git commit -m "chore: scaffold Next.js project with Tailwind and Vitest"
```

---

### Task 2: Prisma schema, Postgres via Docker, initial migration

**Files:**
- Create: `docker-compose.yml`, `prisma/schema.prisma`, `.env.example`, `.env.test.example`

**Interfaces:**
- Produces: Prisma models `Package`, `Instructor`, `AvailabilityRule`, `AvailabilityException`, `Dossier`, `MagicLink`, `Lesson`, `Payment`, `StaffUser`, enums `Transmission`, `LessonStatus`, `PaymentStatus`, `PaymentType`, `StaffRole`.

- [ ] **Step 1: Add docker-compose for local Postgres**

`docker-compose.yml`:
```yaml
version: "3.8"
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: alpha_rijschool
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

```bash
docker compose up -d
```

- [ ] **Step 2: Add env files**

`.env.example`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/alpha_rijschool"
APP_URL="http://localhost:3000"
MOLLIE_API_KEY="test_xxx"
RESEND_API_KEY="re_xxx"
ENCRYPTION_KEY="0000000000000000000000000000000000000000000000000000000000000000"
NEXTAUTH_SECRET="change-me"
```

`.env.test.example`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/alpha_rijschool_test"
APP_URL="http://localhost:3000"
ENCRYPTION_KEY="1111111111111111111111111111111111111111111111111111111111111111"
```

Copy both to `.env` and `.env.test` locally (not committed).

- [ ] **Step 3: Write the Prisma schema**

`prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Transmission {
  AUTOMAAT
  MANUEEL
  BOTH
}

enum LessonStatus {
  PLANNED
  CONFIRMED
  CANCELLED
  COMPLETED
}

enum PaymentStatus {
  OPEN
  PAID
  FAILED
  REFUNDED
}

enum PaymentType {
  DEPOSIT
  BALANCE
}

enum StaffRole {
  ADMIN
  INSTRUCTOR
}

model Package {
  id              String   @id @default(cuid())
  name            String
  description     String
  hours           Int
  priceAutomaat   Int
  priceManueel    Int
  registrationFee Int
  isSingleLesson  Boolean  @default(false)
  active          Boolean  @default(true)
  dossiers        Dossier[]
  lessons         Lesson[]
}

model Instructor {
  id                     String   @id @default(cuid())
  name                   String
  transmission           Transmission
  active                 Boolean  @default(true)
  availabilityRules      AvailabilityRule[]
  availabilityExceptions AvailabilityException[]
  lessons                Lesson[]
  staffUsers             StaffUser[]
}

model AvailabilityRule {
  id           String     @id @default(cuid())
  instructorId String
  instructor   Instructor @relation(fields: [instructorId], references: [id])
  weekday      Int
  startTime    String
  endTime      String
}

model AvailabilityException {
  id           String     @id @default(cuid())
  instructorId String
  instructor   Instructor @relation(fields: [instructorId], references: [id])
  date         DateTime   @db.Date
  startTime    String
  endTime      String
  isAvailable  Boolean    @default(false)
}

model Dossier {
  id                     String    @id @default(cuid())
  email                  String
  firstName              String
  lastName               String
  phone                  String
  address                String
  dateOfBirth            DateTime  @db.Date
  nationalRegisterNumber String?
  packageId              String
  package                Package   @relation(fields: [packageId], references: [id])
  transmission           Transmission
  hoursRemaining         Float
  createdAt              DateTime  @default(now())
  magicLinks             MagicLink[]
  lessons                Lesson[]
  payments               Payment[]
}

model MagicLink {
  id        String    @id @default(cuid())
  dossierId String
  dossier   Dossier   @relation(fields: [dossierId], references: [id])
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}

model Lesson {
  id           String       @id @default(cuid())
  dossierId    String
  dossier      Dossier      @relation(fields: [dossierId], references: [id])
  instructorId String
  instructor   Instructor   @relation(fields: [instructorId], references: [id])
  packageId    String
  package      Package      @relation(fields: [packageId], references: [id])
  startAt      DateTime
  endAt        DateTime
  status       LessonStatus @default(PLANNED)
  createdAt    DateTime     @default(now())
}

model Payment {
  id              String        @id @default(cuid())
  dossierId       String
  dossier         Dossier       @relation(fields: [dossierId], references: [id])
  molliePaymentId String        @unique
  amount          Int
  type            PaymentType
  status          PaymentStatus @default(OPEN)
  createdAt       DateTime      @default(now())
}

model StaffUser {
  id           String     @id @default(cuid())
  email        String     @unique
  passwordHash String
  role         StaffRole
  instructorId String?
  instructor   Instructor? @relation(fields: [instructorId], references: [id])
}
```

- [ ] **Step 4: Create the initial migration**

```bash
npx prisma migrate dev --name init
```

Expected: migration applies cleanly against the local `alpha_rijschool` database, `prisma/migrations/.../migration.sql` is created.

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml prisma .env.example .env.test.example
git commit -m "feat: add Prisma schema and local Postgres setup"
```

---

### Task 3: Overlap-exclusion constraint + test database infrastructure

**Files:**
- Create: `prisma/migrations/.../migration.sql` (via `--create-only`), `src/test/globalSetup.ts`, `src/test/resetDatabase.ts`
- Test: `src/test/resetDatabase.test.ts`

**Interfaces:**
- Produces: `resetDatabase(prisma: PrismaClient): Promise<void>`

- [ ] **Step 1: Create an empty migration for the exclusion constraint**

```bash
npx prisma migrate dev --create-only --name lesson_overlap_constraint
```

- [ ] **Step 2: Write the raw SQL into the generated migration file**

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Lesson"
  ADD CONSTRAINT lesson_no_overlap
  EXCLUDE USING gist (
    "instructorId" WITH =,
    tsrange("startAt", "endAt") WITH &&
  )
  WHERE (status IN ('PLANNED', 'CONFIRMED'));
```

- [ ] **Step 3: Apply the migration**

```bash
npx prisma migrate dev
```

Expected: applies without error against the local dev database.

- [ ] **Step 4: Write the global test-DB setup**

`src/test/globalSetup.ts`:
```ts
import { Client } from "pg";
import { execSync } from "child_process";
import { config } from "dotenv";

export default async function globalSetup() {
  config({ path: ".env.test" });
  const testDbUrl = process.env.DATABASE_URL!;
  const dbName = new URL(testDbUrl).pathname.replace("/", "");
  const adminUrl = testDbUrl.replace(`/${dbName}`, "/postgres");

  const client = new Client({ connectionString: adminUrl });
  await client.connect();
  const { rowCount } = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbName]
  );
  if (rowCount === 0) {
    await client.query(`CREATE DATABASE ${dbName}`);
  }
  await client.end();

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: testDbUrl },
    stdio: "inherit",
  });
}
```

- [ ] **Step 5: Write `resetDatabase` and its test**

`src/test/resetDatabase.ts`:
```ts
import { PrismaClient } from "@prisma/client";

const TABLES = [
  "Payment", "Lesson", "MagicLink", "Dossier",
  "AvailabilityException", "AvailabilityRule",
  "StaffUser", "Instructor", "Package",
];

export async function resetDatabase(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(", ")} CASCADE`
  );
}
```

`src/test/resetDatabase.test.ts`:
```ts
import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { resetDatabase } from "./resetDatabase";

const prisma = new PrismaClient();

describe("resetDatabase", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("removes all packages", async () => {
    await prisma.package.create({
      data: {
        name: "Test", description: "x", hours: 1,
        priceAutomaat: 100, priceManueel: 100, registrationFee: 0,
      },
    });
    await resetDatabase(prisma);
    const count = await prisma.package.count();
    expect(count).toBe(0);
  });
});
```

- [ ] **Step 6: Run test to verify it fails, then passes**

Run: `npx vitest run src/test/resetDatabase.test.ts`
First run before Step 5's files exist would fail with "module not found" — since Step 5 already includes the implementation, instead verify by temporarily commenting the `TRUNCATE` line, confirming FAIL, restoring it, confirming PASS.

- [ ] **Step 7: Commit**

```bash
git add prisma src/test
git commit -m "feat: add lesson overlap constraint and test database helpers"
```

---

### Task 4: Seed script

**Files:**
- Create: `prisma/seed.ts`

**Interfaces:**
- Consumes: Prisma models from Task 2.

- [ ] **Step 1: Write the seed script**

`prisma/seed.ts`:
```ts
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

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

  const passwordHash = await hash("changeme123", 10);
  await prisma.staffUser.create({
    data: { email: "beheerder@alpha-rijschool.be", passwordHash, role: "ADMIN" },
  });

  console.log("Seed klaar. Standaard beheerder-wachtwoord: changeme123 (wijzig dit voor productie).");
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run the seed script against the local dev database**

```bash
npm install -D tsx
npx tsx prisma/seed.ts
```

Expected: prints the confirmation message, no errors.

- [ ] **Step 3: Verify with Prisma Studio**

```bash
npx prisma studio
```

Expected: 8 packages, 1 instructor with 6 availability rules, 1 staff user are visible.

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts package.json package-lock.json
git commit -m "feat: add database seed script"
```

---

### Task 5: Availability engine (TDD)

**Files:**
- Create: `src/lib/availability.ts`
- Test: `src/lib/availability.test.ts`

**Interfaces:**
- Produces: `computeAvailableSlots(params): Slot[]`, types `AvailabilityRule`, `AvailabilityException`, `BookedLesson`, `Slot`.

- [ ] **Step 1: Write the failing tests**

`src/lib/availability.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { computeAvailableSlots } from "./availability";

describe("computeAvailableSlots", () => {
  it("generates 2-hour slots within a single availability window", () => {
    const slots = computeAvailableSlots({
      rules: [{ weekday: 1, startTime: "09:00", endTime: "13:00" }],
      exceptions: [],
      bookedLessons: [],
      rangeStart: new Date("2026-09-28T00:00:00"), // maandag
      rangeEnd: new Date("2026-09-28T23:59:59"),
      lessonDurationMinutes: 120,
    });
    expect(slots).toHaveLength(2);
    expect(slots[0].startAt.getHours()).toBe(9);
    expect(slots[1].startAt.getHours()).toBe(11);
  });

  it("excludes slots that overlap an existing booking", () => {
    const slots = computeAvailableSlots({
      rules: [{ weekday: 1, startTime: "09:00", endTime: "13:00" }],
      exceptions: [],
      bookedLessons: [{ startAt: new Date("2026-09-28T09:00:00"), endAt: new Date("2026-09-28T11:00:00") }],
      rangeStart: new Date("2026-09-28T00:00:00"),
      rangeEnd: new Date("2026-09-28T23:59:59"),
      lessonDurationMinutes: 120,
    });
    expect(slots).toHaveLength(1);
    expect(slots[0].startAt.getHours()).toBe(11);
  });

  it("respects a weekday filter", () => {
    const slots = computeAvailableSlots({
      rules: [
        { weekday: 1, startTime: "09:00", endTime: "11:00" },
        { weekday: 2, startTime: "09:00", endTime: "11:00" },
      ],
      exceptions: [],
      bookedLessons: [],
      rangeStart: new Date("2026-09-28T00:00:00"),
      rangeEnd: new Date("2026-09-29T23:59:59"),
      lessonDurationMinutes: 120,
      weekdayFilter: [1],
    });
    expect(slots).toHaveLength(1);
  });

  it("blocks a day fully covered by an unavailable exception", () => {
    const slots = computeAvailableSlots({
      rules: [{ weekday: 1, startTime: "09:00", endTime: "11:00" }],
      exceptions: [{ date: "2026-09-28", startTime: "00:00", endTime: "23:59", isAvailable: false }],
      bookedLessons: [],
      rangeStart: new Date("2026-09-28T00:00:00"),
      rangeEnd: new Date("2026-09-28T23:59:59"),
      lessonDurationMinutes: 120,
    });
    expect(slots).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/availability.test.ts`
Expected: FAIL with "Cannot find module './availability'".

- [ ] **Step 3: Implement `computeAvailableSlots`**

`src/lib/availability.ts`:
```ts
export interface AvailabilityRule {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface AvailabilityException {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface BookedLesson {
  startAt: Date;
  endAt: Date;
}

export interface Slot {
  startAt: Date;
  endAt: Date;
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToDate(day: Date, minutes: number): Date {
  const d = new Date(day);
  d.setHours(0, minutes, 0, 0);
  return d;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function toIsoDate(day: Date): string {
  return day.toISOString().slice(0, 10);
}

export function computeAvailableSlots(params: {
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
  bookedLessons: BookedLesson[];
  rangeStart: Date;
  rangeEnd: Date;
  lessonDurationMinutes: number;
  weekdayFilter?: number[];
}): Slot[] {
  const { rules, exceptions, bookedLessons, rangeStart, rangeEnd, lessonDurationMinutes, weekdayFilter } = params;
  const slots: Slot[] = [];

  for (const day = new Date(rangeStart); day <= rangeEnd; day.setDate(day.getDate() + 1)) {
    const weekday = day.getDay();
    if (weekdayFilter && weekdayFilter.length > 0 && !weekdayFilter.includes(weekday)) {
      continue;
    }

    const isoDate = toIsoDate(day);
    const dayExceptions = exceptions.filter((e) => e.date === isoDate);
    const blockedAllDay = dayExceptions.some(
      (e) => !e.isAvailable && e.startTime === "00:00" && e.endTime === "23:59"
    );
    if (blockedAllDay) continue;

    const windows = [
      ...rules.filter((r) => r.weekday === weekday).map((r) => ({ start: r.startTime, end: r.endTime })),
      ...dayExceptions.filter((e) => e.isAvailable).map((e) => ({ start: e.startTime, end: e.endTime })),
    ];

    for (const window of windows) {
      const windowStartMin = parseTimeToMinutes(window.start);
      const windowEndMin = parseTimeToMinutes(window.end);

      for (
        let slotStartMin = windowStartMin;
        slotStartMin + lessonDurationMinutes <= windowEndMin;
        slotStartMin += lessonDurationMinutes
      ) {
        const slotStart = minutesToDate(day, slotStartMin);
        const slotEnd = minutesToDate(day, slotStartMin + lessonDurationMinutes);
        if (slotStart < rangeStart || slotEnd > rangeEnd) continue;

        const blockedByException = dayExceptions.some(
          (e) =>
            !e.isAvailable &&
            overlaps(
              slotStart, slotEnd,
              minutesToDate(day, parseTimeToMinutes(e.startTime)),
              minutesToDate(day, parseTimeToMinutes(e.endTime))
            )
        );
        if (blockedByException) continue;

        const blockedByBooking = bookedLessons.some((l) => overlaps(slotStart, slotEnd, l.startAt, l.endAt));
        if (blockedByBooking) continue;

        slots.push({ startAt: slotStart, endAt: slotEnd });
      }
    }
  }

  return slots;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/availability.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/availability.ts src/lib/availability.test.ts
git commit -m "feat: add availability slot computation engine"
```

---

### Task 6: Pricing and deposit helper (TDD)

**Files:**
- Create: `src/lib/constants.ts`, `src/lib/pricing.ts`
- Test: `src/lib/pricing.test.ts`

**Interfaces:**
- Produces: `LESSON_BLOCK_MINUTES`, `packagePrice(pkg, transmission): number`, `depositAmount(pkg, transmission): number`, type `Transmission = "AUTOMAAT" | "MANUEEL"`.

- [ ] **Step 1: Write the failing tests**

`src/lib/pricing.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { packagePrice, depositAmount } from "./pricing";

const pkg = { priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500 };

describe("packagePrice", () => {
  it("adds the registration fee to the automaat price", () => {
    expect(packagePrice(pkg, "AUTOMAAT")).toBe(18500);
  });
  it("adds the registration fee to the manueel price", () => {
    expect(packagePrice(pkg, "MANUEEL")).toBe(17500);
  });
});

describe("depositAmount", () => {
  it("equals the single lesson price without the registration fee", () => {
    expect(depositAmount(pkg, "AUTOMAAT")).toBe(16000);
    expect(depositAmount(pkg, "MANUEEL")).toBe(15000);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/pricing.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement**

`src/lib/constants.ts`:
```ts
export const LESSON_BLOCK_MINUTES = 120;
```

`src/lib/pricing.ts`:
```ts
export type Transmission = "AUTOMAAT" | "MANUEEL";

export interface PackageLike {
  priceAutomaat: number;
  priceManueel: number;
  registrationFee: number;
}

export function packagePrice(pkg: PackageLike, transmission: Transmission): number {
  const base = transmission === "AUTOMAAT" ? pkg.priceAutomaat : pkg.priceManueel;
  return base + pkg.registrationFee;
}

export function depositAmount(singleLessonPackage: PackageLike, transmission: Transmission): number {
  return transmission === "AUTOMAAT" ? singleLessonPackage.priceAutomaat : singleLessonPackage.priceManueel;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/pricing.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/constants.ts src/lib/pricing.ts src/lib/pricing.test.ts
git commit -m "feat: add pricing and deposit calculation helpers"
```

---

### Task 7: Magic link utility (TDD)

**Files:**
- Create: `src/lib/magicLink.ts`
- Test: `src/lib/magicLink.test.ts`

**Interfaces:**
- Produces: `MAGIC_LINK_TTL_HOURS`, `generateMagicLinkToken(): string`, `magicLinkExpiryDate(now?): Date`, `isMagicLinkValid(link, now?): boolean`.

- [ ] **Step 1: Write the failing tests**

`src/lib/magicLink.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { generateMagicLinkToken, magicLinkExpiryDate, isMagicLinkValid, MAGIC_LINK_TTL_HOURS } from "./magicLink";

describe("generateMagicLinkToken", () => {
  it("produces a 64-character hex string, different each time", () => {
    const a = generateMagicLinkToken();
    const b = generateMagicLinkToken();
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(a).not.toBe(b);
  });
});

describe("magicLinkExpiryDate", () => {
  it("is TTL hours after now", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const expiry = magicLinkExpiryDate(now);
    expect(expiry.getTime() - now.getTime()).toBe(MAGIC_LINK_TTL_HOURS * 60 * 60 * 1000);
  });
});

describe("isMagicLinkValid", () => {
  const now = new Date("2026-01-02T00:00:00Z");
  it("is false when already used", () => {
    expect(isMagicLinkValid({ expiresAt: new Date("2026-01-03T00:00:00Z"), usedAt: now }, now)).toBe(false);
  });
  it("is false when expired", () => {
    expect(isMagicLinkValid({ expiresAt: new Date("2026-01-01T00:00:00Z"), usedAt: null }, now)).toBe(false);
  });
  it("is true when unused and not expired", () => {
    expect(isMagicLinkValid({ expiresAt: new Date("2026-01-03T00:00:00Z"), usedAt: null }, now)).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run src/lib/magicLink.test.ts` → FAIL.

- [ ] **Step 3: Implement**

`src/lib/magicLink.ts`:
```ts
import { randomBytes } from "crypto";

export const MAGIC_LINK_TTL_HOURS = 24;

export function generateMagicLinkToken(): string {
  return randomBytes(32).toString("hex");
}

export function magicLinkExpiryDate(now: Date = new Date()): Date {
  return new Date(now.getTime() + MAGIC_LINK_TTL_HOURS * 60 * 60 * 1000);
}

export function isMagicLinkValid(
  link: { expiresAt: Date; usedAt: Date | null },
  now: Date = new Date()
): boolean {
  if (link.usedAt) return false;
  return link.expiresAt > now;
}
```

- [ ] **Step 4: Run to verify pass** — PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/magicLink.ts src/lib/magicLink.test.ts
git commit -m "feat: add magic link generation and validation"
```

---

### Task 8: Cancellation policy helper (TDD)

**Files:**
- Create: `src/lib/cancellation.ts`
- Test: `src/lib/cancellation.test.ts`

**Interfaces:**
- Produces: `CANCELLATION_WINDOW_HOURS`, `canCancelWithRefund(lessonStartAt, now?): boolean`.

- [ ] **Step 1: Write the failing tests**

`src/lib/cancellation.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { canCancelWithRefund } from "./cancellation";

describe("canCancelWithRefund", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("is true when more than 48 hours before the lesson", () => {
    const lessonStart = new Date("2026-01-04T00:00:01Z");
    expect(canCancelWithRefund(lessonStart, now)).toBe(true);
  });

  it("is false when less than 48 hours before the lesson", () => {
    const lessonStart = new Date("2026-01-02T00:00:00Z");
    expect(canCancelWithRefund(lessonStart, now)).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement**

`src/lib/cancellation.ts`:
```ts
export const CANCELLATION_WINDOW_HOURS = 48;

export function canCancelWithRefund(lessonStartAt: Date, now: Date = new Date()): boolean {
  const hoursUntilLesson = (lessonStartAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilLesson >= CANCELLATION_WINDOW_HOURS;
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cancellation.ts src/lib/cancellation.test.ts
git commit -m "feat: add cancellation policy helper"
```

---

### Task 9: Encryption helper for the national register number (TDD)

**Files:**
- Create: `src/lib/encryption.ts`
- Test: `src/lib/encryption.test.ts`

**Interfaces:**
- Produces: `encryptField(plainText): string`, `decryptField(payload): string`.

- [ ] **Step 1: Write the failing tests**

`src/lib/encryption.test.ts`:
```ts
import { describe, it, expect, beforeAll } from "vitest";
import { encryptField, decryptField } from "./encryption";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = "1111111111111111111111111111111111111111111111111111111111111111".slice(0, 64);
});

describe("encryptField / decryptField", () => {
  it("round-trips a value", () => {
    const encrypted = encryptField("85073003328");
    expect(decryptField(encrypted)).toBe("85073003328");
  });

  it("produces different ciphertext for the same input each time", () => {
    const a = encryptField("85073003328");
    const b = encryptField("85073003328");
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement**

`src/lib/encryption.ts`:
```ts
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error("ENCRYPTION_KEY moet een 64-karakter hex-string zijn (32 bytes).");
  }
  return Buffer.from(key, "hex");
}

export function encryptField(plainText: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptField(payload: string): string {
  const [ivHex, authTagHex, dataHex] = payload.split(":");
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/encryption.ts src/lib/encryption.test.ts
git commit -m "feat: add field-level encryption for sensitive personal data"
```

---

### Task 10: Prisma client singleton + packages data access + GET /api/packages

**Files:**
- Create: `src/lib/prisma.ts`, `src/lib/packages.ts`, `src/app/api/packages/route.ts`
- Test: `src/lib/packages.test.ts`

**Interfaces:**
- Consumes: `resetDatabase` (Task 3).
- Produces: `prisma` singleton, `getActivePackages()`, `getPackageById(id)`, `getSingleLessonPackage()`.

- [ ] **Step 1: Write the Prisma singleton**

`src/lib/prisma.ts`:
```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 2: Write the failing integration test**

`src/lib/packages.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "./prisma";
import { resetDatabase } from "../test/resetDatabase";
import { getActivePackages, getSingleLessonPackage } from "./packages";

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

describe("getActivePackages", () => {
  it("returns only active packages", async () => {
    await prisma.package.create({ data: { name: "Actief", description: "x", hours: 1, priceAutomaat: 100, priceManueel: 100, registrationFee: 0, active: true } });
    await prisma.package.create({ data: { name: "Inactief", description: "x", hours: 1, priceAutomaat: 100, priceManueel: 100, registrationFee: 0, active: false } });

    const packages = await getActivePackages();
    expect(packages).toHaveLength(1);
    expect(packages[0].name).toBe("Actief");
  });
});

describe("getSingleLessonPackage", () => {
  it("throws when no single-lesson package is configured", async () => {
    await expect(getSingleLessonPackage()).rejects.toThrow();
  });

  it("returns the package flagged as single lesson", async () => {
    await prisma.package.create({ data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true } });
    const pkg = await getSingleLessonPackage();
    expect(pkg.name).toBe("Losse Rijles");
  });
});
```

- [ ] **Step 3: Run to verify failure** — FAIL (module not found).

- [ ] **Step 4: Implement `packages.ts` and the API route**

`src/lib/packages.ts`:
```ts
import { prisma } from "@/lib/prisma";

export async function getActivePackages() {
  return prisma.package.findMany({ where: { active: true }, orderBy: { hours: "desc" } });
}

export async function getPackageById(id: string) {
  return prisma.package.findUnique({ where: { id } });
}

export async function getSingleLessonPackage() {
  const pkg = await prisma.package.findFirst({ where: { isSingleLesson: true, active: true } });
  if (!pkg) {
    throw new Error("Geen 'losse rijles'-pakket geconfigureerd — nodig voor de voorschotberekening.");
  }
  return pkg;
}
```

`src/app/api/packages/route.ts`:
```ts
import { NextResponse } from "next/server";
import { getActivePackages } from "@/lib/packages";

export async function GET() {
  const packages = await getActivePackages();
  return NextResponse.json(packages);
}
```

- [ ] **Step 5: Run to verify pass** — `npx vitest run src/lib/packages.test.ts` → PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/prisma.ts src/lib/packages.ts src/lib/packages.test.ts src/app/api/packages
git commit -m "feat: add packages data access and API route"
```

---

### Task 11: Availability API route

**Files:**
- Create: `src/app/api/availability/route.ts`
- Test: `src/app/api/availability/route.test.ts`

**Interfaces:**
- Consumes: `computeAvailableSlots` (Task 5), `LESSON_BLOCK_MINUTES` (Task 6), `prisma` (Task 10).
- Produces: `GET` handler returning `{ instructorId, instructorName, slots: { startAt, endAt }[] }[]`.

- [ ] **Step 1: Write the failing integration test**

`src/app/api/availability/route.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/resetDatabase";
import { GET } from "./route";

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

describe("GET /api/availability", () => {
  it("returns available slots for an instructor's weekly rule", async () => {
    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
    await prisma.availabilityRule.create({ data: { instructorId: instructor.id, weekday: 1, startTime: "09:00", endTime: "13:00" } });

    const url = `http://localhost/api/availability?packageId=${pkg.id}&from=2026-09-28T00:00:00.000Z&to=2026-09-28T23:59:59.000Z`;
    const response = await GET(new Request(url) as any);
    const body = await response.json();

    expect(body).toHaveLength(1);
    expect(body[0].instructorId).toBe(instructor.id);
    expect(body[0].slots).toHaveLength(2);
  });

  it("returns 400 when required params are missing", async () => {
    const response = await GET(new Request("http://localhost/api/availability") as any);
    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL (module not found).

- [ ] **Step 3: Implement the route**

`src/app/api/availability/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeAvailableSlots } from "@/lib/availability";
import { LESSON_BLOCK_MINUTES } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const packageId = searchParams.get("packageId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const weekdayParam = searchParams.get("weekdays");
  const instructorId = searchParams.get("instructorId") ?? undefined;

  if (!packageId || !from || !to) {
    return NextResponse.json({ error: "packageId, from en to zijn verplicht." }, { status: 400 });
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg) {
    return NextResponse.json({ error: "Pakket niet gevonden." }, { status: 404 });
  }

  const instructors = await prisma.instructor.findMany({
    where: instructorId ? { id: instructorId, active: true } : { active: true },
    include: { availabilityRules: true, availabilityExceptions: true },
  });

  const rangeStart = new Date(from);
  const rangeEnd = new Date(to);
  const weekdayFilter = weekdayParam ? weekdayParam.split(",").map(Number) : undefined;

  const bookedLessons = await prisma.lesson.findMany({
    where: {
      startAt: { gte: rangeStart },
      endAt: { lte: rangeEnd },
      status: { in: ["PLANNED", "CONFIRMED"] },
      ...(instructorId ? { instructorId } : {}),
    },
  });

  const result = instructors.map((instructor) => ({
    instructorId: instructor.id,
    instructorName: instructor.name,
    slots: computeAvailableSlots({
      rules: instructor.availabilityRules,
      exceptions: instructor.availabilityExceptions.map((e) => ({
        date: e.date.toISOString().slice(0, 10),
        startTime: e.startTime,
        endTime: e.endTime,
        isAvailable: e.isAvailable,
      })),
      bookedLessons: bookedLessons
        .filter((l) => l.instructorId === instructor.id)
        .map((l) => ({ startAt: l.startAt, endAt: l.endAt })),
      rangeStart,
      rangeEnd,
      lessonDurationMinutes: LESSON_BLOCK_MINUTES,
      weekdayFilter,
    }),
  }));

  return NextResponse.json(result);
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/availability
git commit -m "feat: add availability API route"
```

---

### Task 12: Mollie client wrapper

**Files:**
- Create: `src/lib/mollie.ts`
- Test: `src/lib/mollie.test.ts`

**Interfaces:**
- Produces: `getMollieClient()`, `createDepositPayment(params): Promise<{ id: string; checkoutUrl: string }>`, `getPaymentStatus(paymentId): Promise<{ status: string; metadata: Record<string,string> }>`.

- [ ] **Step 1: Write the failing test (mocking the Mollie SDK)**

`src/lib/mollie.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const createMock = vi.fn();
const getMock = vi.fn();

vi.mock("@mollie/api-client", () => ({
  default: () => ({ payments: { create: createMock, get: getMock } }),
  PaymentMethod: { bancontact: "bancontact" },
}));

beforeEach(() => {
  process.env.MOLLIE_API_KEY = "test_key";
  createMock.mockReset();
  getMock.mockReset();
});

describe("createDepositPayment", () => {
  it("creates a Bancontact payment with the amount formatted as euros", async () => {
    createMock.mockResolvedValue({ id: "tr_123", getCheckoutUrl: () => "https://mollie.test/pay/tr_123" });
    const { createDepositPayment } = await import("./mollie");

    const result = await createDepositPayment({
      amountCents: 16000,
      description: "Voorschot",
      redirectUrl: "https://app.test/ok",
      webhookUrl: "https://app.test/webhook",
      metadata: { dossierId: "abc" },
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ amount: { currency: "EUR", value: "160.00" }, method: "bancontact" })
    );
    expect(result).toEqual({ id: "tr_123", checkoutUrl: "https://mollie.test/pay/tr_123" });
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement**

`src/lib/mollie.ts`:
```ts
import createMollieClient, { PaymentMethod } from "@mollie/api-client";

let client: ReturnType<typeof createMollieClient> | null = null;

export function getMollieClient() {
  if (!client) {
    const apiKey = process.env.MOLLIE_API_KEY;
    if (!apiKey) throw new Error("MOLLIE_API_KEY ontbreekt.");
    client = createMollieClient({ apiKey });
  }
  return client;
}

export async function createDepositPayment(params: {
  amountCents: number;
  description: string;
  redirectUrl: string;
  webhookUrl: string;
  metadata: Record<string, string>;
}) {
  const mollie = getMollieClient();
  const payment = await mollie.payments.create({
    amount: { currency: "EUR", value: (params.amountCents / 100).toFixed(2) },
    description: params.description,
    redirectUrl: params.redirectUrl,
    webhookUrl: params.webhookUrl,
    method: PaymentMethod.bancontact,
    metadata: params.metadata,
  });
  return { id: payment.id, checkoutUrl: payment.getCheckoutUrl() ?? "" };
}

export async function getPaymentStatus(paymentId: string) {
  const mollie = getMollieClient();
  const payment = await mollie.payments.get(paymentId);
  return { status: payment.status, metadata: (payment.metadata ?? {}) as Record<string, string> };
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mollie.ts src/lib/mollie.test.ts
git commit -m "feat: add Mollie Bancontact payment wrapper"
```

---

### Task 13: Email templates via Resend

**Files:**
- Create: `src/lib/email.ts`
- Test: `src/lib/email.test.ts`

**Interfaces:**
- Produces: `magicLinkUrlFor(token): string`, `sendBookingConfirmationEmail(params): Promise<void>`.

- [ ] **Step 1: Write the failing test**

`src/lib/email.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMock = vi.fn().mockResolvedValue({});

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: sendMock } })),
}));

beforeEach(() => {
  process.env.RESEND_API_KEY = "re_test";
  process.env.APP_URL = "https://app.test";
  sendMock.mockClear();
});

describe("sendBookingConfirmationEmail", () => {
  it("sends an email containing the magic link and lesson time", async () => {
    const { sendBookingConfirmationEmail } = await import("./email");
    await sendBookingConfirmationEmail({
      to: "student@example.com",
      dossierName: "Jan Jansen",
      magicLinkToken: "abc123",
      lessons: [{ startAt: new Date("2026-09-28T09:00:00Z"), endAt: new Date("2026-09-28T11:00:00Z") }],
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const call = sendMock.mock.calls[0][0];
    expect(call.to).toBe("student@example.com");
    expect(call.text).toContain("https://app.test/dossier/abc123");
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement**

`src/lib/email.ts`:
```ts
import { Resend } from "resend";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY ontbreekt.");
  return new Resend(apiKey);
}

export function magicLinkUrlFor(token: string) {
  return `${process.env.APP_URL}/dossier/${token}`;
}

export async function sendBookingConfirmationEmail(params: {
  to: string;
  dossierName: string;
  magicLinkToken: string;
  lessons: { startAt: Date; endAt: Date }[];
}) {
  const resend = getResendClient();
  const lessonLines = params.lessons
    .map((l) => `- ${l.startAt.toLocaleString("nl-BE")} tot ${l.endAt.toLocaleString("nl-BE")}`)
    .join("\n");

  await resend.emails.send({
    from: "Alpha Rijschool <inschrijvingen@alpha-rijschool.be>",
    to: params.to,
    subject: "Bevestiging van je inschrijving bij Alpha Rijschool",
    text: [
      `Beste ${params.dossierName},`,
      "",
      "Je voorschot is ontvangen en onderstaande les(sen) staan bevestigd:",
      lessonLines,
      "",
      `Bekijk of beheer je dossier op elk moment via: ${magicLinkUrlFor(params.magicLinkToken)}`,
      "",
      "Tot binnenkort!",
      "Alpha Rijschool",
    ].join("\n"),
  });
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/email.ts src/lib/email.test.ts
git commit -m "feat: add booking confirmation email via Resend"
```

---

### Task 14: POST /api/bookings — create dossier, lessons and Mollie payment

**Files:**
- Create: `src/app/api/bookings/route.ts`
- Test: `src/app/api/bookings/route.test.ts`

**Interfaces:**
- Consumes: `getPackageById`, `getSingleLessonPackage` (Task 10), `depositAmount` (Task 6), `createDepositPayment` (Task 12), `encryptField` (Task 9).
- Produces: `POST` handler returning `{ checkoutUrl: string }`.

- [ ] **Step 1: Write the failing integration test**

`src/app/api/bookings/route.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/resetDatabase";

vi.mock("@/lib/mollie", () => ({
  createDepositPayment: vi.fn().mockResolvedValue({ id: "tr_test", checkoutUrl: "https://mollie.test/pay/tr_test" }),
}));

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

describe("POST /api/bookings", () => {
  it("creates a dossier, planned lessons and an open payment, and returns a checkout URL", async () => {
    process.env.ENCRYPTION_KEY = "1111111111111111111111111111111111111111111111111111111111111111".slice(0, 64);
    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        packageId: pkg.id,
        transmission: "AUTOMAAT",
        instructorId: instructor.id,
        slots: [{ startAt: "2026-09-28T09:00:00.000Z", endAt: "2026-09-28T11:00:00.000Z" }],
        details: {
          firstName: "Jan", lastName: "Jansen", email: "jan@example.com",
          phone: "0470000000", address: "Straat 1", dateOfBirth: "2000-01-01",
        },
      }),
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.checkoutUrl).toBe("https://mollie.test/pay/tr_test");

    const dossier = await prisma.dossier.findFirstOrThrow();
    expect(dossier.email).toBe("jan@example.com");
    const lessons = await prisma.lesson.findMany();
    expect(lessons).toHaveLength(1);
    const payments = await prisma.payment.findMany();
    expect(payments[0].amount).toBe(16000);
    expect(payments[0].status).toBe("OPEN");
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement the route**

`src/app/api/bookings/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPackageById, getSingleLessonPackage } from "@/lib/packages";
import { depositAmount } from "@/lib/pricing";
import { createDepositPayment } from "@/lib/mollie";
import { encryptField } from "@/lib/encryption";

const bookingSchema = z.object({
  packageId: z.string().min(1),
  transmission: z.enum(["AUTOMAAT", "MANUEEL"]),
  instructorId: z.string().min(1),
  slots: z.array(z.object({ startAt: z.string().datetime(), endAt: z.string().datetime() })).min(1),
  details: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().min(1),
    dateOfBirth: z.string().min(1),
    nationalRegisterNumber: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  const parsed = bookingSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { packageId, transmission, instructorId, slots, details } = parsed.data;

  const pkg = await getPackageById(packageId);
  if (!pkg) {
    return NextResponse.json({ error: "Pakket niet gevonden." }, { status: 404 });
  }

  const singleLessonPkg = await getSingleLessonPackage();
  const amount = depositAmount(singleLessonPkg, transmission);

  let dossierId: string;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const dossier = await tx.dossier.create({
        data: {
          email: details.email,
          firstName: details.firstName,
          lastName: details.lastName,
          phone: details.phone,
          address: details.address,
          dateOfBirth: new Date(details.dateOfBirth),
          nationalRegisterNumber: details.nationalRegisterNumber
            ? encryptField(details.nationalRegisterNumber)
            : null,
          packageId: pkg.id,
          transmission,
          hoursRemaining: pkg.hours,
        },
      });

      for (const slot of slots) {
        await tx.lesson.create({
          data: {
            dossierId: dossier.id,
            instructorId,
            packageId: pkg.id,
            startAt: new Date(slot.startAt),
            endAt: new Date(slot.endAt),
            status: "PLANNED",
          },
        });
      }

      return dossier;
    });
    dossierId = result.id;
  } catch {
    return NextResponse.json({ error: "Dit lesmoment is ondertussen al bezet." }, { status: 409 });
  }

  const payment = await createDepositPayment({
    amountCents: amount,
    description: `Voorschot ${pkg.name}`,
    redirectUrl: `${process.env.APP_URL}/boeken/bevestiging?dossier=${dossierId}`,
    webhookUrl: `${process.env.APP_URL}/api/webhooks/mollie`,
    metadata: { dossierId },
  });

  await prisma.payment.create({
    data: { dossierId, molliePaymentId: payment.id, amount, type: "DEPOSIT", status: "OPEN" },
  });

  return NextResponse.json({ checkoutUrl: payment.checkoutUrl });
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/bookings
git commit -m "feat: add booking creation endpoint with Mollie deposit payment"
```

---

### Task 15: POST /api/webhooks/mollie — confirm payment and send confirmation

**Files:**
- Create: `src/app/api/webhooks/mollie/route.ts`
- Test: `src/app/api/webhooks/mollie/route.test.ts`

**Interfaces:**
- Consumes: `getPaymentStatus` (Task 12), `generateMagicLinkToken`, `magicLinkExpiryDate` (Task 7), `sendBookingConfirmationEmail` (Task 13), `LESSON_BLOCK_MINUTES` (Task 6).
- Produces: `POST` handler.

- [ ] **Step 1: Write the failing integration test**

`src/app/api/webhooks/mollie/route.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/resetDatabase";

vi.mock("@/lib/mollie", () => ({ getPaymentStatus: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendBookingConfirmationEmail: vi.fn().mockResolvedValue(undefined) }));

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

describe("POST /api/webhooks/mollie", () => {
  it("confirms lessons, decrements hoursRemaining and creates a magic link when paid", async () => {
    const { getPaymentStatus } = await import("@/lib/mollie");
    vi.mocked(getPaymentStatus).mockResolvedValue({ status: "paid", metadata: {} });

    const pkg = await prisma.package.create({
      data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true },
    });
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
    const dossier = await prisma.dossier.create({
      data: { email: "jan@example.com", firstName: "Jan", lastName: "Jansen", phone: "0470000000", address: "x", dateOfBirth: new Date("2000-01-01"), packageId: pkg.id, transmission: "AUTOMAAT", hoursRemaining: 2 },
    });
    await prisma.lesson.create({ data: { dossierId: dossier.id, instructorId: instructor.id, packageId: pkg.id, startAt: new Date("2026-09-28T09:00:00Z"), endAt: new Date("2026-09-28T11:00:00Z"), status: "PLANNED" } });
    await prisma.payment.create({ data: { dossierId: dossier.id, molliePaymentId: "tr_test", amount: 16000, type: "DEPOSIT", status: "OPEN" } });

    const { POST } = await import("./route");
    const form = new URLSearchParams({ id: "tr_test" });
    const request = new Request("http://localhost/api/webhooks/mollie", { method: "POST", body: form });
    const response = await POST(request as any);

    expect(response.status).toBe(200);
    const updatedPayment = await prisma.payment.findUniqueOrThrow({ where: { molliePaymentId: "tr_test" } });
    expect(updatedPayment.status).toBe("PAID");
    const lesson = await prisma.lesson.findFirstOrThrow();
    expect(lesson.status).toBe("CONFIRMED");
    const updatedDossier = await prisma.dossier.findUniqueOrThrow({ where: { id: dossier.id } });
    expect(updatedDossier.hoursRemaining).toBe(0);
    const magicLink = await prisma.magicLink.findFirstOrThrow();
    expect(magicLink.dossierId).toBe(dossier.id);
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement the route**

`src/app/api/webhooks/mollie/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentStatus } from "@/lib/mollie";
import { generateMagicLinkToken, magicLinkExpiryDate } from "@/lib/magicLink";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { LESSON_BLOCK_MINUTES } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const paymentId = formData.get("id")?.toString();
  if (!paymentId) {
    return NextResponse.json({ error: "Geen betalings-id ontvangen." }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { molliePaymentId: paymentId },
    include: { dossier: { include: { lessons: true } } },
  });
  if (!payment) {
    return NextResponse.json({ error: "Onbekende betaling." }, { status: 404 });
  }

  const { status } = await getPaymentStatus(paymentId);
  const blockHours = LESSON_BLOCK_MINUTES / 60;

  if (status === "paid" && payment.status !== "PAID") {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "PAID" } }),
      prisma.lesson.updateMany({ where: { dossierId: payment.dossierId, status: "PLANNED" }, data: { status: "CONFIRMED" } }),
      prisma.dossier.update({
        where: { id: payment.dossierId },
        data: { hoursRemaining: { decrement: payment.dossier.lessons.length * blockHours } },
      }),
    ]);

    const magicLink = await prisma.magicLink.create({
      data: { dossierId: payment.dossierId, token: generateMagicLinkToken(), expiresAt: magicLinkExpiryDate() },
    });

    await sendBookingConfirmationEmail({
      to: payment.dossier.email,
      dossierName: `${payment.dossier.firstName} ${payment.dossier.lastName}`,
      magicLinkToken: magicLink.token,
      lessons: payment.dossier.lessons.map((l) => ({ startAt: l.startAt, endAt: l.endAt })),
    });
  } else if (["failed", "canceled", "expired"].includes(status)) {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } }),
      prisma.lesson.updateMany({ where: { dossierId: payment.dossierId, status: "PLANNED" }, data: { status: "CANCELLED" } }),
    ]);
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/webhooks
git commit -m "feat: add Mollie webhook handler for deposit confirmation"
```

---

### Task 16: Dossier lookup + magic link page

**Files:**
- Create: `src/lib/dossiers.ts`, `src/app/api/dossier/[token]/route.ts`, `src/app/dossier/[token]/page.tsx`, `src/app/dossier/[token]/DossierView.tsx`
- Test: `src/lib/dossiers.test.ts`

**Interfaces:**
- Consumes: `isMagicLinkValid` (Task 7).
- Produces: `findDossierByMagicLinkToken(token)`.

- [ ] **Step 1: Write the failing test**

`src/lib/dossiers.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "./prisma";
import { resetDatabase } from "../test/resetDatabase";
import { findDossierByMagicLinkToken } from "./dossiers";

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

async function createDossierWithLink(overrides: Partial<{ expiresAt: Date; usedAt: Date | null }> = {}) {
  const pkg = await prisma.package.create({
    data: { name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500 },
  });
  const dossier = await prisma.dossier.create({
    data: { email: "jan@example.com", firstName: "Jan", lastName: "Jansen", phone: "x", address: "x", dateOfBirth: new Date("2000-01-01"), packageId: pkg.id, transmission: "AUTOMAAT", hoursRemaining: 2 },
  });
  await prisma.magicLink.create({
    data: { dossierId: dossier.id, token: "abc123", expiresAt: overrides.expiresAt ?? new Date(Date.now() + 3600_000), usedAt: overrides.usedAt ?? null },
  });
  return dossier;
}

describe("findDossierByMagicLinkToken", () => {
  it("returns the dossier for a valid token", async () => {
    const dossier = await createDossierWithLink();
    const found = await findDossierByMagicLinkToken("abc123");
    expect(found?.id).toBe(dossier.id);
  });

  it("returns null for an expired token", async () => {
    await createDossierWithLink({ expiresAt: new Date(Date.now() - 3600_000) });
    expect(await findDossierByMagicLinkToken("abc123")).toBeNull();
  });

  it("returns null for an unknown token", async () => {
    expect(await findDossierByMagicLinkToken("does-not-exist")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement `dossiers.ts`, the API route and the page**

`src/lib/dossiers.ts`:
```ts
import { prisma } from "@/lib/prisma";
import { isMagicLinkValid } from "@/lib/magicLink";

export async function findDossierByMagicLinkToken(token: string) {
  const link = await prisma.magicLink.findUnique({
    where: { token },
    include: { dossier: { include: { package: true, lessons: { include: { instructor: true } } } } },
  });

  if (!link || !isMagicLinkValid(link)) {
    return null;
  }

  return link.dossier;
}
```

`src/app/api/dossier/[token]/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { findDossierByMagicLinkToken } from "@/lib/dossiers";

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const dossier = await findDossierByMagicLinkToken(params.token);
  if (!dossier) {
    return NextResponse.json({ error: "Link is ongeldig of verlopen." }, { status: 404 });
  }
  return NextResponse.json(dossier);
}
```

`src/app/dossier/[token]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { findDossierByMagicLinkToken } from "@/lib/dossiers";
import { DossierView } from "./DossierView";

export default async function DossierPage({ params }: { params: { token: string } }) {
  const dossier = await findDossierByMagicLinkToken(params.token);
  if (!dossier) notFound();
  return <DossierView dossier={dossier} token={params.token} />;
}
```

`src/app/dossier/[token]/DossierView.tsx`:
```tsx
"use client";

import { useState } from "react";

interface DossierLesson {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  instructor: { name: string };
}

interface DossierData {
  id: string;
  firstName: string;
  lastName: string;
  hoursRemaining: number;
  package: { name: string };
  lessons: DossierLesson[];
}

export function DossierView({ dossier, token }: { dossier: DossierData; token: string }) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-bold">Welkom terug, {dossier.firstName}</h1>
      <p className="mb-6 text-gray-600">
        Pakket: {dossier.package.name} &mdash; resterend tegoed: {dossier.hoursRemaining} uur
      </p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <h2 className="mb-2 text-lg font-semibold">Geplande lessen</h2>
      <ul className="mb-8 space-y-2">
        {dossier.lessons.map((lesson) => (
          <li key={lesson.id} className="rounded border p-3 text-sm">
            {new Date(lesson.startAt).toLocaleString("nl-BE")} met {lesson.instructor.name} &mdash; {lesson.status}
          </li>
        ))}
      </ul>

      {dossier.hoursRemaining > 0 ? (
        <p className="text-sm text-gray-600">
          Je hebt nog tegoed. Neem contact op of gebruik de boekingslink die je ontving om een nieuwe les in te
          plannen zonder nieuw voorschot.
        </p>
      ) : (
        <p className="text-sm text-gray-600">Je pakket-tegoed is volledig ingepland.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass** — `npx vitest run src/lib/dossiers.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dossiers.ts src/lib/dossiers.test.ts src/app/api/dossier src/app/dossier
git commit -m "feat: add dossier lookup via magic link and dossier page"
```

---

### Task 17: POST /api/dossier/[token]/lessons — book from remaining credit

**Files:**
- Create: `src/app/api/dossier/[token]/lessons/route.ts`
- Test: `src/app/api/dossier/[token]/lessons/route.test.ts`

**Interfaces:**
- Consumes: `findDossierByMagicLinkToken` (Task 16), `LESSON_BLOCK_MINUTES` (Task 6).
- Produces: `POST` handler returning the created lesson or a 409 on conflict.

- [ ] **Step 1: Write the failing integration test**

`src/app/api/dossier/[token]/lessons/route.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/resetDatabase";

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

async function setupDossier(hoursRemaining: number) {
  const pkg = await prisma.package.create({
    data: { name: "20-Uur Pakket", description: "x", hours: 20, priceAutomaat: 155000, priceManueel: 145000, registrationFee: 2500 },
  });
  const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
  const dossier = await prisma.dossier.create({
    data: { email: "jan@example.com", firstName: "Jan", lastName: "Jansen", phone: "x", address: "x", dateOfBirth: new Date("2000-01-01"), packageId: pkg.id, transmission: "AUTOMAAT", hoursRemaining },
  });
  await prisma.magicLink.create({ data: { dossierId: dossier.id, token: "abc123", expiresAt: new Date(Date.now() + 3600_000) } });
  return { dossier, instructor };
}

describe("POST /api/dossier/[token]/lessons", () => {
  it("books a confirmed lesson and decrements hoursRemaining", async () => {
    const { instructor } = await setupDossier(4);
    const { POST } = await import("./route");
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ instructorId: instructor.id, startAt: "2026-09-28T09:00:00.000Z", endAt: "2026-09-28T11:00:00.000Z" }),
    });

    const response = await POST(request as any, { params: { token: "abc123" } });
    expect(response.status).toBe(201);

    const dossier = await prisma.dossier.findFirstOrThrow();
    expect(dossier.hoursRemaining).toBe(2);
    const lesson = await prisma.lesson.findFirstOrThrow();
    expect(lesson.status).toBe("CONFIRMED");
  });

  it("rejects when there is not enough remaining credit", async () => {
    const { instructor } = await setupDossier(1);
    const { POST } = await import("./route");
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ instructorId: instructor.id, startAt: "2026-09-28T09:00:00.000Z", endAt: "2026-09-28T11:00:00.000Z" }),
    });

    const response = await POST(request as any, { params: { token: "abc123" } });
    expect(response.status).toBe(409);
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement the route**

`src/app/api/dossier/[token]/lessons/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findDossierByMagicLinkToken } from "@/lib/dossiers";
import { LESSON_BLOCK_MINUTES } from "@/lib/constants";

const schema = z.object({
  instructorId: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const dossier = await findDossierByMagicLinkToken(params.token);
  if (!dossier) {
    return NextResponse.json({ error: "Link is ongeldig of verlopen." }, { status: 404 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const blockHours = LESSON_BLOCK_MINUTES / 60;
  if (dossier.hoursRemaining < blockHours) {
    return NextResponse.json({ error: "Onvoldoende tegoed over voor een nieuwe les." }, { status: 409 });
  }

  try {
    const lesson = await prisma.$transaction(async (tx) => {
      const created = await tx.lesson.create({
        data: {
          dossierId: dossier.id,
          instructorId: parsed.data.instructorId,
          packageId: dossier.packageId,
          startAt: new Date(parsed.data.startAt),
          endAt: new Date(parsed.data.endAt),
          status: "CONFIRMED",
        },
      });
      await tx.dossier.update({ where: { id: dossier.id }, data: { hoursRemaining: { decrement: blockHours } } });
      return created;
    });
    return NextResponse.json(lesson, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Dit lesblok is ondertussen al bezet." }, { status: 409 });
  }
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/dossier
git commit -m "feat: allow booking additional lessons from remaining package credit"
```

---

### Task 18: Shared LessonCalendar component

**Files:**
- Create: `src/components/LessonCalendar.tsx`
- Test: `src/components/LessonCalendar.test.tsx`

**Interfaces:**
- Produces: `Slot` type `{ startAt: string; endAt: string }`, `LessonCalendar` component with props `{ slots: Slot[]; selectedSlot: Slot | null; onSelectSlot: (slot: Slot) => void }`.

- [ ] **Step 1: Write the failing test**

`src/components/LessonCalendar.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LessonCalendar } from "./LessonCalendar";

describe("LessonCalendar", () => {
  it("renders one event per slot and reports a click", () => {
    const onSelectSlot = vi.fn();
    const slots = [
      { startAt: "2026-09-28T09:00:00.000Z", endAt: "2026-09-28T11:00:00.000Z" },
      { startAt: "2026-09-28T11:00:00.000Z", endAt: "2026-09-28T13:00:00.000Z" },
    ];

    render(<LessonCalendar slots={slots} selectedSlot={null} onSelectSlot={onSelectSlot} />);

    const events = screen.getAllByText("Beschikbaar");
    expect(events).toHaveLength(2);

    fireEvent.click(events[0]);
    expect(onSelectSlot).toHaveBeenCalledWith(slots[0]);
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement**

`src/components/LessonCalendar.tsx`:
```tsx
"use client";

import { Calendar, dateFnsLocalizer, type Event } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { nl } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: nl }),
  getDay,
  locales: { nl },
});

export interface Slot {
  startAt: string;
  endAt: string;
}

interface LessonCalendarProps {
  slots: Slot[];
  selectedSlot: Slot | null;
  onSelectSlot: (slot: Slot) => void;
}

export function LessonCalendar({ slots, selectedSlot, onSelectSlot }: LessonCalendarProps) {
  const events: Event[] = slots.map((slot) => ({
    title: selectedSlot?.startAt === slot.startAt ? "Geselecteerd" : "Beschikbaar",
    start: new Date(slot.startAt),
    end: new Date(slot.endAt),
    resource: slot,
  }));

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 500 }}
      views={["week", "day"]}
      onSelectEvent={(event) => onSelectSlot(event.resource as Slot)}
    />
  );
}
```

- [ ] **Step 4: Run to verify pass** — PASS. If `react-big-calendar`'s rendered text differs from a plain "Beschikbaar" text node in your installed version, adjust the test's query (e.g. `getAllByRole("button")` scoped to events) rather than the component's data contract.

- [ ] **Step 5: Commit**

```bash
git add src/components/LessonCalendar.tsx src/components/LessonCalendar.test.tsx
git commit -m "feat: add shared lesson calendar component"
```

---

### Task 19: Booking wizard shell

**Files:**
- Create: `src/app/boeken/page.tsx`
- Test: `src/app/boeken/page.test.tsx`

**Interfaces:**
- Consumes: step components from Tasks 20–23 (stubbed with minimal placeholders in this task's test via mocks, then wired for real once those tasks land).
- Produces: `BookingWizardPage` default export managing step state `"package" | "transmission" | "calendar" | "details" | "summary"`.

- [ ] **Step 1: Write the failing test**

`src/app/boeken/page.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));

vi.mock("./_components/PackageStep", () => ({
  PackageStep: ({ onSelect }: any) => (
    <button onClick={() => onSelect({ id: "p1", name: "Pakket 1", isSingleLesson: true, priceAutomaat: 100, priceManueel: 100 })}>
      Kies pakket 1
    </button>
  ),
}));
vi.mock("./_components/TransmissionStep", () => ({
  TransmissionStep: ({ onSelect }: any) => <button onClick={() => onSelect("AUTOMAAT")}>Kies automaat</button>,
}));

import BookingWizardPage from "./page";

describe("BookingWizardPage", () => {
  it("moves from the package step to the transmission step", () => {
    render(<BookingWizardPage />);
    fireEvent.click(screen.getByText("Kies pakket 1"));
    expect(screen.getByText("Kies automaat")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL (page and step components don't exist yet).

- [ ] **Step 3: Implement the wizard shell**

`src/app/boeken/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PackageStep, type PackageDTO } from "./_components/PackageStep";
import { TransmissionStep } from "./_components/TransmissionStep";
import { CalendarStep, type BookingSlot } from "./_components/CalendarStep";
import { DetailsStep, type BookingDetails } from "./_components/DetailsStep";
import { SummaryStep } from "./_components/SummaryStep";

type Step = "package" | "transmission" | "calendar" | "details" | "summary";
type Transmission = "AUTOMAAT" | "MANUEEL";

export default function BookingWizardPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("package");
  const [selectedPackage, setSelectedPackage] = useState<PackageDTO | null>(null);
  const [transmission, setTransmission] = useState<Transmission | null>(null);
  const [slot, setSlot] = useState<BookingSlot | null>(null);
  const [details, setDetails] = useState<BookingDetails | null>(null);

  const preselectedPackageId = searchParams.get("package");

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {step === "package" && (
        <PackageStep
          preselectedPackageId={preselectedPackageId}
          onSelect={(pkg) => {
            setSelectedPackage(pkg);
            setStep("transmission");
          }}
        />
      )}
      {step === "transmission" && selectedPackage && (
        <TransmissionStep
          selectedPackage={selectedPackage}
          onSelect={(t) => {
            setTransmission(t);
            setStep("calendar");
          }}
          onBack={() => setStep("package")}
        />
      )}
      {step === "calendar" && selectedPackage && transmission && (
        <CalendarStep
          packageId={selectedPackage.id}
          onConfirm={(chosenSlot) => {
            setSlot(chosenSlot);
            setStep("details");
          }}
          onBack={() => setStep("transmission")}
        />
      )}
      {step === "details" && selectedPackage && (
        <DetailsStep
          requiresNationalRegisterNumber={!selectedPackage.isSingleLesson}
          onSubmit={(d) => {
            setDetails(d);
            setStep("summary");
          }}
          onBack={() => setStep("calendar")}
        />
      )}
      {step === "summary" && selectedPackage && transmission && slot && details && (
        <SummaryStep
          selectedPackage={selectedPackage}
          transmission={transmission}
          slot={slot}
          details={details}
          onBack={() => setStep("details")}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass** — Once Tasks 20–23 have created the real (non-mocked) step files, `npx vitest run src/app/boeken/page.test.tsx` → PASS. The mocks in this task's test are enough to pass immediately since Vitest resolves `vi.mock` before the module graph needs the real files to exist on disk for type-checking at runtime.

- [ ] **Step 5: Commit**

```bash
git add src/app/boeken/page.tsx src/app/boeken/page.test.tsx
git commit -m "feat: add booking wizard shell with step navigation"
```

---

### Task 20: PackageStep and TransmissionStep components

**Files:**
- Create: `src/app/boeken/_components/PackageStep.tsx`, `src/app/boeken/_components/TransmissionStep.tsx`
- Test: `src/app/boeken/_components/PackageStep.test.tsx`, `src/app/boeken/_components/TransmissionStep.test.tsx`

**Interfaces:**
- Produces: `PackageDTO` type, `PackageStep` component `{ preselectedPackageId, onSelect(pkg: PackageDTO) }`, `TransmissionStep` component `{ selectedPackage: PackageDTO, onSelect(t), onBack() }`.

- [ ] **Step 1: Write the failing tests**

`src/app/boeken/_components/PackageStep.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PackageStep } from "./PackageStep";

const packages = [
  { id: "p1", name: "Pakket 1", description: "Beschrijving 1", hours: 10, priceAutomaat: 100, priceManueel: 90, registrationFee: 25, isSingleLesson: false },
  { id: "p2", name: "Pakket 2", description: "Beschrijving 2", hours: 2, priceAutomaat: 160, priceManueel: 150, registrationFee: 25, isSingleLesson: true },
];

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve(packages) }) as any;
});

describe("PackageStep", () => {
  it("lists fetched packages and reports a selection", async () => {
    const onSelect = vi.fn();
    render(<PackageStep preselectedPackageId={null} onSelect={onSelect} />);

    await waitFor(() => expect(screen.getByText("Pakket 1")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Pakket 1"));
    expect(onSelect).toHaveBeenCalledWith(packages[0]);
  });

  it("auto-selects the preselected package once loaded", async () => {
    const onSelect = vi.fn();
    render(<PackageStep preselectedPackageId="p2" onSelect={onSelect} />);
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(packages[1]));
  });
});
```

`src/app/boeken/_components/TransmissionStep.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TransmissionStep } from "./TransmissionStep";

const pkg = { id: "p1", name: "Pakket 1", description: "x", hours: 10, priceAutomaat: 10000, priceManueel: 9000, registrationFee: 2500, isSingleLesson: false };

describe("TransmissionStep", () => {
  it("reports the chosen transmission with its price", () => {
    const onSelect = vi.fn();
    render(<TransmissionStep selectedPackage={pkg} onSelect={onSelect} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText(/Automaat/));
    expect(onSelect).toHaveBeenCalledWith("AUTOMAAT");
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement**

`src/app/boeken/_components/PackageStep.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";

export interface PackageDTO {
  id: string;
  name: string;
  description: string;
  hours: number;
  priceAutomaat: number;
  priceManueel: number;
  registrationFee: number;
  isSingleLesson: boolean;
}

interface PackageStepProps {
  preselectedPackageId: string | null;
  onSelect: (pkg: PackageDTO) => void;
}

export function PackageStep({ preselectedPackageId, onSelect }: PackageStepProps) {
  const [packages, setPackages] = useState<PackageDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/packages")
      .then((res) => res.json())
      .then((data: PackageDTO[]) => {
        setPackages(data);
        setLoading(false);
        const preselected = data.find((p) => p.id === preselectedPackageId);
        if (preselected) onSelect(preselected);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedPackageId]);

  if (loading) return <p>Pakketten laden...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Kies je pakket</h1>
      <ul className="space-y-4">
        {packages.map((pkg) => (
          <li key={pkg.id}>
            <button onClick={() => onSelect(pkg)} className="w-full rounded-lg border p-4 text-left hover:border-red-600">
              <span className="block font-semibold">{pkg.name}</span>
              <span className="block text-sm text-gray-600">{pkg.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

`src/app/boeken/_components/TransmissionStep.tsx`:
```tsx
"use client";

import type { PackageDTO } from "./PackageStep";

interface TransmissionStepProps {
  selectedPackage: PackageDTO;
  onSelect: (transmission: "AUTOMAAT" | "MANUEEL") => void;
  onBack: () => void;
}

export function TransmissionStep({ selectedPackage, onSelect, onBack }: TransmissionStepProps) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Automaat of manueel?</h1>
      <div className="flex gap-4">
        <button onClick={() => onSelect("AUTOMAAT")} className="flex-1 rounded-lg border p-4 hover:border-red-600">
          Automaat &mdash; &euro;{(selectedPackage.priceAutomaat / 100).toFixed(2)}
        </button>
        <button onClick={() => onSelect("MANUEEL")} className="flex-1 rounded-lg border p-4 hover:border-red-600">
          Manueel &mdash; &euro;{(selectedPackage.priceManueel / 100).toFixed(2)}
        </button>
      </div>
      <button onClick={onBack} className="mt-6 text-sm text-gray-500">&larr; Terug</button>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/boeken/_components/PackageStep.tsx src/app/boeken/_components/PackageStep.test.tsx src/app/boeken/_components/TransmissionStep.tsx src/app/boeken/_components/TransmissionStep.test.tsx
git commit -m "feat: add package and transmission wizard steps"
```

---

### Task 21: CalendarStep component

**Files:**
- Create: `src/app/boeken/_components/CalendarStep.tsx`
- Test: `src/app/boeken/_components/CalendarStep.test.tsx`

**Interfaces:**
- Consumes: `LessonCalendar` (Task 18).
- Produces: `BookingSlot` type `Slot & { instructorId: string; instructorName: string }`, `CalendarStep` component `{ packageId, onConfirm(slot), onBack() }`.

- [ ] **Step 1: Write the failing test**

`src/app/boeken/_components/CalendarStep.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CalendarStep } from "./CalendarStep";

vi.mock("@/components/LessonCalendar", () => ({
  LessonCalendar: ({ slots, onSelectSlot }: any) => (
    <button onClick={() => onSelectSlot(slots[0])}>Kies eerste slot ({slots.length})</button>
  ),
}));

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    json: () =>
      Promise.resolve([
        { instructorId: "i1", instructorName: "Jan", slots: [{ startAt: "2026-09-28T09:00:00.000Z", endAt: "2026-09-28T11:00:00.000Z" }] },
      ]),
  }) as any;
});

describe("CalendarStep", () => {
  it("loads slots and confirms the chosen one", async () => {
    const onConfirm = vi.fn();
    render(<CalendarStep packageId="p1" onConfirm={onConfirm} onBack={vi.fn()} />);

    await waitFor(() => expect(screen.getByText(/Kies eerste slot/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Kies eerste slot/));
    fireEvent.click(screen.getByText("Volgende"));

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ instructorId: "i1", instructorName: "Jan" })
    );
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement**

`src/app/boeken/_components/CalendarStep.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { LessonCalendar, type Slot } from "@/components/LessonCalendar";

export type BookingSlot = Slot & { instructorId: string; instructorName: string };

interface InstructorSlots {
  instructorId: string;
  instructorName: string;
  slots: Slot[];
}

interface CalendarStepProps {
  packageId: string;
  onConfirm: (slot: BookingSlot) => void;
  onBack: () => void;
}

export function CalendarStep({ packageId, onConfirm, onBack }: CalendarStepProps) {
  const [instructorSlots, setInstructorSlots] = useState<InstructorSlots[]>([]);
  const [selected, setSelected] = useState<BookingSlot | null>(null);

  useEffect(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 30);

    fetch(`/api/availability?packageId=${packageId}&from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((res) => res.json())
      .then(setInstructorSlots);
  }, [packageId]);

  const allSlots: BookingSlot[] = instructorSlots.flatMap((entry) =>
    entry.slots.map((slot) => ({ ...slot, instructorId: entry.instructorId, instructorName: entry.instructorName }))
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Kies je lesmoment</h1>
      <LessonCalendar slots={allSlots} selectedSlot={selected} onSelectSlot={(slot) => setSelected(slot as BookingSlot)} />
      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="text-sm text-gray-500">&larr; Terug</button>
        <button
          disabled={!selected}
          onClick={() => selected && onConfirm(selected)}
          className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white disabled:opacity-40"
        >
          Volgende
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/boeken/_components/CalendarStep.tsx src/app/boeken/_components/CalendarStep.test.tsx
git commit -m "feat: add calendar wizard step"
```

---

### Task 22: DetailsStep component

**Files:**
- Create: `src/app/boeken/_components/DetailsStep.tsx`
- Test: `src/app/boeken/_components/DetailsStep.test.tsx`

**Interfaces:**
- Produces: `BookingDetails` type, `DetailsStep` component `{ requiresNationalRegisterNumber, onSubmit(details), onBack() }`.

- [ ] **Step 1: Write the failing test**

`src/app/boeken/_components/DetailsStep.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DetailsStep } from "./DetailsStep";

function fillCommonFields() {
  fireEvent.change(screen.getByPlaceholderText("Voornaam"), { target: { value: "Jan" } });
  fireEvent.change(screen.getByPlaceholderText("Familienaam"), { target: { value: "Jansen" } });
  fireEvent.change(screen.getByPlaceholderText("E-mailadres"), { target: { value: "jan@example.com" } });
  fireEvent.change(screen.getByPlaceholderText("Telefoonnummer"), { target: { value: "0470000000" } });
  fireEvent.change(screen.getByPlaceholderText("Adres"), { target: { value: "Straat 1" } });
}

describe("DetailsStep", () => {
  it("submits the filled-in details when the register number is not required", () => {
    const onSubmit = vi.fn();
    render(<DetailsStep requiresNationalRegisterNumber={false} onSubmit={onSubmit} onBack={vi.fn()} />);
    fillCommonFields();
    fireEvent.click(screen.getByText("Volgende"));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ firstName: "Jan", email: "jan@example.com" }));
  });

  it("blocks submission when the register number is required but empty", () => {
    const onSubmit = vi.fn();
    render(<DetailsStep requiresNationalRegisterNumber={true} onSubmit={onSubmit} onBack={vi.fn()} />);
    fillCommonFields();
    fireEvent.click(screen.getByText("Volgende"));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Rijksregisternummer is verplicht/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement**

`src/app/boeken/_components/DetailsStep.tsx`:
```tsx
"use client";

import { type FormEvent, useState } from "react";

export interface BookingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  nationalRegisterNumber?: string;
}

interface DetailsStepProps {
  requiresNationalRegisterNumber: boolean;
  onSubmit: (details: BookingDetails) => void;
  onBack: () => void;
}

export function DetailsStep({ requiresNationalRegisterNumber, onSubmit, onBack }: DetailsStepProps) {
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const details: BookingDetails = {
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      address: String(form.get("address") ?? ""),
      dateOfBirth: String(form.get("dateOfBirth") ?? ""),
      nationalRegisterNumber: form.get("nationalRegisterNumber") ? String(form.get("nationalRegisterNumber")) : undefined,
    };

    if (!details.firstName || !details.lastName || !details.email) {
      setError("Voornaam, familienaam en e-mailadres zijn verplicht.");
      return;
    }
    if (requiresNationalRegisterNumber && !details.nationalRegisterNumber) {
      setError("Rijksregisternummer is verplicht voor dit pakket.");
      return;
    }

    onSubmit(details);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="mb-2 text-2xl font-bold">Jouw gegevens</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input name="firstName" placeholder="Voornaam" required className="w-full rounded border p-3" />
      <input name="lastName" placeholder="Familienaam" required className="w-full rounded border p-3" />
      <input name="email" type="email" placeholder="E-mailadres" required className="w-full rounded border p-3" />
      <input name="phone" placeholder="Telefoonnummer" required className="w-full rounded border p-3" />
      <input name="address" placeholder="Adres" required className="w-full rounded border p-3" />
      <input name="dateOfBirth" type="date" required className="w-full rounded border p-3" />
      {requiresNationalRegisterNumber && (
        <input name="nationalRegisterNumber" placeholder="Rijksregisternummer" required className="w-full rounded border p-3" />
      )}
      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} className="text-sm text-gray-500">&larr; Terug</button>
        <button type="submit" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Volgende</button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/boeken/_components/DetailsStep.tsx src/app/boeken/_components/DetailsStep.test.tsx
git commit -m "feat: add personal details wizard step"
```

---

### Task 23: SummaryStep component

**Files:**
- Create: `src/app/boeken/_components/SummaryStep.tsx`
- Test: `src/app/boeken/_components/SummaryStep.test.tsx`

**Interfaces:**
- Consumes: `PackageDTO` (Task 20), `BookingSlot` (Task 21), `BookingDetails` (Task 22).
- Produces: `SummaryStep` component `{ selectedPackage, transmission, slot, details, onBack() }` that POSTs to `/api/bookings` and redirects to the returned `checkoutUrl`.

- [ ] **Step 1: Write the failing test**

`src/app/boeken/_components/SummaryStep.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SummaryStep } from "./SummaryStep";

const pkg = { id: "p1", name: "Losse Rijles", description: "x", hours: 2, priceAutomaat: 16000, priceManueel: 15000, registrationFee: 2500, isSingleLesson: true };
const slot = { startAt: "2026-09-28T09:00:00.000Z", endAt: "2026-09-28T11:00:00.000Z", instructorId: "i1", instructorName: "Jan" };
const details = { firstName: "Jan", lastName: "Jansen", email: "jan@example.com", phone: "x", address: "x", dateOfBirth: "2000-01-01" };

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ checkoutUrl: "https://mollie.test/pay/tr_1" }) }) as any;
  delete (window as any).location;
  (window as any).location = { href: "" };
});

describe("SummaryStep", () => {
  it("requires accepting the terms before confirming", () => {
    render(<SummaryStep selectedPackage={pkg} transmission="AUTOMAAT" slot={slot} details={details} onBack={vi.fn()} />);
    expect(screen.getByText(/Bevestig en betaal voorschot/)).toBeDisabled();
  });

  it("posts the booking and redirects to the checkout URL once confirmed", async () => {
    render(<SummaryStep selectedPackage={pkg} transmission="AUTOMAAT" slot={slot} details={details} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByText(/Bevestig en betaal voorschot/));

    await waitFor(() => expect(window.location.href).toBe("https://mollie.test/pay/tr_1"));
    expect(fetch).toHaveBeenCalledWith("/api/bookings", expect.objectContaining({ method: "POST" }));
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement**

`src/app/boeken/_components/SummaryStep.tsx`:
```tsx
"use client";

import { useState } from "react";
import type { PackageDTO } from "./PackageStep";
import type { BookingSlot } from "./CalendarStep";
import type { BookingDetails } from "./DetailsStep";

interface SummaryStepProps {
  selectedPackage: PackageDTO;
  transmission: "AUTOMAAT" | "MANUEEL";
  slot: BookingSlot;
  details: BookingDetails;
  onBack: () => void;
}

export function SummaryStep({ selectedPackage, transmission, slot, details, onBack }: SummaryStepProps) {
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          transmission,
          instructorId: slot.instructorId,
          slots: [{ startAt: slot.startAt, endAt: slot.endAt }],
          details,
        }),
      });

      if (!response.ok) throw new Error("Boeking mislukt, probeer opnieuw.");

      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Samenvatting</h1>
      <p><strong>Pakket:</strong> {selectedPackage.name} ({transmission === "AUTOMAAT" ? "automaat" : "manueel"})</p>
      <p><strong>Lesmoment:</strong> {new Date(slot.startAt).toLocaleString("nl-BE")}</p>
      <p><strong>Naam:</strong> {details.firstName} {details.lastName}</p>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <label className="mt-6 flex items-start gap-2">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        <span className="text-sm">Ik ga akkoord met de algemene voorwaarden en het reglement van Alpha Rijschool.</span>
      </label>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="text-sm text-gray-500">&larr; Terug</button>
        <button
          disabled={!accepted || submitting}
          onClick={handleConfirm}
          className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white disabled:opacity-40"
        >
          {submitting ? "Bezig..." : "Bevestig en betaal voorschot"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/boeken/_components/SummaryStep.tsx src/app/boeken/_components/SummaryStep.test.tsx
git commit -m "feat: add summary wizard step with Mollie checkout redirect"
```

---

### Task 24: NextAuth credentials login for staff

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/admin/login/page.tsx`
- Test: `src/lib/auth.test.ts`

**Interfaces:**
- Produces: `auth()`, `handlers`, `signIn`, `signOut` from `src/lib/auth.ts`.

- [ ] **Step 1: Write the failing test for the credentials `authorize` logic**

`src/lib/auth.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { hash } from "bcryptjs";
import { prisma } from "./prisma";
import { resetDatabase } from "../test/resetDatabase";
import { authorizeStaffUser } from "./auth";

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

describe("authorizeStaffUser", () => {
  it("returns the user when the password matches", async () => {
    const passwordHash = await hash("secret123", 10);
    await prisma.staffUser.create({ data: { email: "admin@example.com", passwordHash, role: "ADMIN" } });

    const result = await authorizeStaffUser("admin@example.com", "secret123");
    expect(result?.email).toBe("admin@example.com");
  });

  it("returns null when the password does not match", async () => {
    const passwordHash = await hash("secret123", 10);
    await prisma.staffUser.create({ data: { email: "admin@example.com", passwordHash, role: "ADMIN" } });

    expect(await authorizeStaffUser("admin@example.com", "wrong")).toBeNull();
  });

  it("returns null for an unknown email", async () => {
    expect(await authorizeStaffUser("nobody@example.com", "secret123")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement `authorizeStaffUser` and wire NextAuth around it**

`src/lib/auth.ts`:
```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function authorizeStaffUser(email: string, password: string) {
  const user = await prisma.staffUser.findUnique({ where: { email } });
  if (!user) return null;
  const valid = await compare(password, user.passwordHash);
  if (!valid) return null;
  return { id: user.id, email: user.email, role: user.role, instructorId: user.instructorId ?? undefined };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;
        return authorizeStaffUser(email, password);
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.role = (user as any).role;
        token.instructorId = (user as any).instructorId;
      }
      return token;
    },
    session: ({ session, token }) => {
      (session.user as any).role = token.role;
      (session.user as any).instructorId = token.instructorId;
      return session;
    },
  },
});
```

`src/app/api/auth/[...nextauth]/route.ts`:
```ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

`src/app/admin/login/page.tsx`:
```tsx
"use client";

import { type FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Ongeldige combinatie van e-mail en wachtwoord.");
      return;
    }
    router.push("/admin/agenda");
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-4 py-24">
      <h1 className="text-2xl font-bold">Beheerder aanmelden</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input name="email" type="email" placeholder="E-mail" required className="w-full rounded border p-3" />
      <input name="password" type="password" placeholder="Wachtwoord" required className="w-full rounded border p-3" />
      <button type="submit" className="w-full rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Aanmelden</button>
    </form>
  );
}
```

Add to `.env.example`: `NEXTAUTH_SECRET` was already included in Task 2.

- [ ] **Step 4: Run to verify pass** — `npx vitest run src/lib/auth.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/lib/auth.test.ts src/app/api/auth src/app/admin/login
git commit -m "feat: add staff credentials authentication"
```

---

### Task 25: Admin layout (auth guard) + agenda page

**Files:**
- Create: `src/app/admin/layout.tsx`, `src/app/admin/agenda/page.tsx`, `src/app/admin/agenda/AgendaView.tsx`
- Test: `src/app/admin/agenda/AgendaView.test.tsx`

**Interfaces:**
- Consumes: `auth()` (Task 24).
- Produces: `AgendaView` component `{ lessons: AgendaLesson[] }`.

- [ ] **Step 1: Write the failing test for `AgendaView`**

`src/app/admin/agenda/AgendaView.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgendaView } from "./AgendaView";

describe("AgendaView", () => {
  it("lists each lesson with student, instructor and status", () => {
    render(
      <AgendaView
        lessons={[
          {
            id: "l1",
            startAt: new Date("2026-09-28T09:00:00Z"),
            endAt: new Date("2026-09-28T11:00:00Z"),
            status: "CONFIRMED",
            dossier: { firstName: "Jan", lastName: "Jansen" },
            instructor: { name: "Piet" },
          },
        ]}
      />
    );
    expect(screen.getByText(/Jan Jansen/)).toBeInTheDocument();
    expect(screen.getByText("Piet")).toBeInTheDocument();
    expect(screen.getByText("CONFIRMED")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement**

`src/app/admin/agenda/AgendaView.tsx`:
```tsx
interface AgendaLesson {
  id: string;
  startAt: Date;
  endAt: Date;
  status: string;
  dossier: { firstName: string; lastName: string };
  instructor: { name: string };
}

export function AgendaView({ lessons }: { lessons: AgendaLesson[] }) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Agenda</h1>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Datum</th>
            <th>Leerling</th>
            <th>Instructeur</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {lessons.map((lesson) => (
            <tr key={lesson.id} className="border-b">
              <td className="py-2">{new Date(lesson.startAt).toLocaleString("nl-BE")}</td>
              <td>{lesson.dossier.firstName} {lesson.dossier.lastName}</td>
              <td>{lesson.instructor.name}</td>
              <td>{lesson.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

`src/app/admin/agenda/page.tsx`:
```tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AgendaView } from "./AgendaView";

export default async function AdminAgendaPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const instructorId = (session?.user as any)?.instructorId;

  const lessons = await prisma.lesson.findMany({
    where: {
      status: { in: ["PLANNED", "CONFIRMED"] },
      ...(role === "INSTRUCTOR" ? { instructorId } : {}),
    },
    include: { dossier: true, instructor: true },
    orderBy: { startAt: "asc" },
  });

  return <AgendaView lessons={lessons} />;
}
```

`src/app/admin/layout.tsx`:
```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/admin/login");
  const role = (session.user as any).role;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <nav className="mb-8 flex gap-6 border-b pb-4 text-sm font-semibold">
        <a href="/admin/agenda">Agenda</a>
        <a href="/admin/beschikbaarheid">Beschikbaarheid</a>
        <a href="/admin/boekingen">Boekingen</a>
        <a href="/admin/dossiers">Dossiers</a>
        {role === "ADMIN" && <a href="/admin/rapport">Rapport</a>}
      </nav>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/layout.tsx src/app/admin/agenda
git commit -m "feat: add admin auth guard and agenda view"
```

---

### Task 26: Admin availability management (page + API)

**Files:**
- Create: `src/app/api/admin/availability/route.ts`, `src/app/admin/beschikbaarheid/page.tsx`, `src/app/admin/beschikbaarheid/AvailabilityView.tsx`
- Test: `src/app/api/admin/availability/route.test.ts`

**Interfaces:**
- Produces: `POST /api/admin/availability` creating an `AvailabilityRule`; `GET` listing instructors with their rules/exceptions.

- [ ] **Step 1: Write the failing integration test**

`src/app/api/admin/availability/route.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/resetDatabase";

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

describe("POST /api/admin/availability", () => {
  it("creates a weekly availability rule for an instructor", async () => {
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
    const { POST } = await import("./route");

    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ instructorId: instructor.id, weekday: 2, startTime: "09:00", endTime: "17:00" }),
    });
    const response = await POST(request as any);
    expect(response.status).toBe(201);

    const rules = await prisma.availabilityRule.findMany({ where: { instructorId: instructor.id } });
    expect(rules).toHaveLength(1);
    expect(rules[0].weekday).toBe(2);
  });
});

describe("GET /api/admin/availability", () => {
  it("returns instructors with their rules", async () => {
    const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
    await prisma.availabilityRule.create({ data: { instructorId: instructor.id, weekday: 1, startTime: "09:00", endTime: "12:00" } });

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(body).toHaveLength(1);
    expect(body[0].availabilityRules).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement**

`src/app/api/admin/availability/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ruleSchema = z.object({
  instructorId: z.string().min(1),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function GET() {
  const instructors = await prisma.instructor.findMany({
    include: { availabilityRules: true, availabilityExceptions: true },
  });
  return NextResponse.json(instructors);
}

export async function POST(request: NextRequest) {
  const parsed = ruleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const rule = await prisma.availabilityRule.create({ data: parsed.data });
  return NextResponse.json(rule, { status: 201 });
}
```

`src/app/admin/beschikbaarheid/AvailabilityView.tsx`:
```tsx
"use client";

import { type FormEvent, useState } from "react";

interface Instructor {
  id: string;
  name: string;
  availabilityRules: { id: string; weekday: number; startTime: string; endTime: string }[];
}

const WEEKDAY_NAMES = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

export function AvailabilityView({ instructors: initialInstructors }: { instructors: Instructor[] }) {
  const [instructors, setInstructors] = useState(initialInstructors);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instructorId: form.get("instructorId"),
        weekday: Number(form.get("weekday")),
        startTime: form.get("startTime"),
        endTime: form.get("endTime"),
      }),
    });
    if (!response.ok) {
      setError("Kon de regel niet opslaan.");
      return;
    }
    const created = await response.json();
    setInstructors((prev) =>
      prev.map((i) => (i.id === created.instructorId ? { ...i, availabilityRules: [...i.availabilityRules, created] } : i))
    );
    (event.target as HTMLFormElement).reset();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Beschikbaarheid</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="mb-8 flex flex-wrap items-end gap-3">
        <select name="instructorId" required className="rounded border p-2">
          {instructors.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
        <select name="weekday" required className="rounded border p-2">
          {WEEKDAY_NAMES.map((name, index) => (
            <option key={index} value={index}>{name}</option>
          ))}
        </select>
        <input name="startTime" type="time" required className="rounded border p-2" />
        <input name="endTime" type="time" required className="rounded border p-2" />
        <button type="submit" className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">Toevoegen</button>
      </form>

      {instructors.map((instructor) => (
        <div key={instructor.id} className="mb-6">
          <h2 className="font-semibold">{instructor.name}</h2>
          <ul className="text-sm text-gray-600">
            {instructor.availabilityRules.map((rule) => (
              <li key={rule.id}>{WEEKDAY_NAMES[rule.weekday]}: {rule.startTime} - {rule.endTime}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

`src/app/admin/beschikbaarheid/page.tsx`:
```tsx
import { prisma } from "@/lib/prisma";
import { AvailabilityView } from "./AvailabilityView";

export default async function AdminAvailabilityPage() {
  const instructors = await prisma.instructor.findMany({ include: { availabilityRules: true } });
  return <AvailabilityView instructors={instructors} />;
}
```

- [ ] **Step 4: Run to verify pass** — `npx vitest run src/app/api/admin/availability/route.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/availability src/app/admin/beschikbaarheid
git commit -m "feat: add admin availability management"
```

---

### Task 27: Admin bookings management (confirm/cancel/reschedule)

**Files:**
- Create: `src/app/api/admin/lessons/[id]/route.ts`, `src/app/admin/boekingen/page.tsx`, `src/app/admin/boekingen/BookingsView.tsx`
- Test: `src/app/api/admin/lessons/[id]/route.test.ts`

**Interfaces:**
- Consumes: `canCancelWithRefund` (Task 8).
- Produces: `PATCH /api/admin/lessons/[id]` accepting `{ action: "confirm" | "cancel" | "reschedule", startAt?, endAt? }`.

- [ ] **Step 1: Write the failing integration test**

`src/app/api/admin/lessons/[id]/route.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/resetDatabase";

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

async function setupLesson(startAt: Date) {
  const pkg = await prisma.package.create({ data: { name: "x", description: "x", hours: 2, priceAutomaat: 100, priceManueel: 100, registrationFee: 0 } });
  const instructor = await prisma.instructor.create({ data: { name: "Jan", transmission: "BOTH" } });
  const dossier = await prisma.dossier.create({ data: { email: "x@example.com", firstName: "x", lastName: "x", phone: "x", address: "x", dateOfBirth: new Date("2000-01-01"), packageId: pkg.id, transmission: "AUTOMAAT", hoursRemaining: 2 } });
  const lesson = await prisma.lesson.create({ data: { dossierId: dossier.id, instructorId: instructor.id, packageId: pkg.id, startAt, endAt: new Date(startAt.getTime() + 2 * 3600_000), status: "PLANNED" } });
  return lesson;
}

describe("PATCH /api/admin/lessons/[id]", () => {
  it("confirms a planned lesson", async () => {
    const lesson = await setupLesson(new Date(Date.now() + 7 * 24 * 3600_000));
    const { PATCH } = await import("./route");
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ action: "confirm" }) }) as any, { params: { id: lesson.id } });
    expect(response.status).toBe(200);
    const updated = await prisma.lesson.findUniqueOrThrow({ where: { id: lesson.id } });
    expect(updated.status).toBe("CONFIRMED");
  });

  it("cancels a lesson booked more than 48 hours out", async () => {
    const lesson = await setupLesson(new Date(Date.now() + 7 * 24 * 3600_000));
    const { PATCH } = await import("./route");
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ action: "cancel" }) }) as any, { params: { id: lesson.id } });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.refundEligible).toBe(true);
  });

  it("reports no refund when cancelling within 48 hours", async () => {
    const lesson = await setupLesson(new Date(Date.now() + 3600_000));
    const { PATCH } = await import("./route");
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ action: "cancel" }) }) as any, { params: { id: lesson.id } });
    const body = await response.json();
    expect(body.refundEligible).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement**

`src/app/api/admin/lessons/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canCancelWithRefund } from "@/lib/cancellation";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("confirm") }),
  z.object({ action: z.literal("cancel") }),
  z.object({ action: z.literal("reschedule"), startAt: z.string().datetime(), endAt: z.string().datetime() }),
]);

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const lesson = await prisma.lesson.findUnique({ where: { id: params.id } });
  if (!lesson) {
    return NextResponse.json({ error: "Les niet gevonden." }, { status: 404 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.action === "confirm") {
    await prisma.lesson.update({ where: { id: lesson.id }, data: { status: "CONFIRMED" } });
    return NextResponse.json({ status: "CONFIRMED" });
  }

  if (parsed.data.action === "cancel") {
    const refundEligible = canCancelWithRefund(lesson.startAt);
    await prisma.lesson.update({ where: { id: lesson.id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ status: "CANCELLED", refundEligible });
  }

  try {
    const updated = await prisma.lesson.update({
      where: { id: lesson.id },
      data: { startAt: new Date(parsed.data.startAt), endAt: new Date(parsed.data.endAt) },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Dit nieuwe tijdstip is al bezet." }, { status: 409 });
  }
}
```

`src/app/admin/boekingen/BookingsView.tsx`:
```tsx
"use client";

import { useState } from "react";

interface Lesson {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  dossier: { firstName: string; lastName: string };
  instructor: { name: string };
}

export function BookingsView({ lessons: initialLessons }: { lessons: Lesson[] }) {
  const [lessons, setLessons] = useState(initialLessons);

  async function handleAction(id: string, action: "confirm" | "cancel") {
    const response = await fetch(`/api/admin/lessons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (response.ok) {
      const body = await response.json();
      setLessons((prev) => prev.map((l) => (l.id === id ? { ...l, status: body.status } : l)));
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Boekingen</h1>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Datum</th><th>Leerling</th><th>Instructeur</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          {lessons.map((lesson) => (
            <tr key={lesson.id} className="border-b">
              <td className="py-2">{new Date(lesson.startAt).toLocaleString("nl-BE")}</td>
              <td>{lesson.dossier.firstName} {lesson.dossier.lastName}</td>
              <td>{lesson.instructor.name}</td>
              <td>{lesson.status}</td>
              <td className="space-x-2">
                <button onClick={() => handleAction(lesson.id, "confirm")} className="text-sm text-green-700">Bevestigen</button>
                <button onClick={() => handleAction(lesson.id, "cancel")} className="text-sm text-red-700">Annuleren</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

`src/app/admin/boekingen/page.tsx`:
```tsx
import { prisma } from "@/lib/prisma";
import { BookingsView } from "./BookingsView";

export default async function AdminBookingsPage() {
  const lessons = await prisma.lesson.findMany({
    where: { status: { in: ["PLANNED", "CONFIRMED"] } },
    include: { dossier: true, instructor: true },
    orderBy: { startAt: "asc" },
  });
  return <BookingsView lessons={lessons} />;
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/lessons src/app/admin/boekingen
git commit -m "feat: add admin booking confirm/cancel management with cancellation policy"
```

---

### Task 28: Admin dossiers overview + simple report

**Files:**
- Create: `src/app/admin/dossiers/page.tsx`, `src/app/admin/rapport/page.tsx`

**Interfaces:** none new — reuses `prisma` and existing models.

- [ ] **Step 1: Write a smoke test for the dossiers listing query**

`src/app/admin/dossiers/dossierQuery.test.ts`:
```ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "@/test/resetDatabase";
import { getDossierOverview } from "./dossierQuery";

beforeEach(() => resetDatabase(prisma));
afterAll(() => prisma.$disconnect());

describe("getDossierOverview", () => {
  it("includes package name and payment status", async () => {
    const pkg = await prisma.package.create({ data: { name: "20-Uur Pakket", description: "x", hours: 20, priceAutomaat: 100, priceManueel: 100, registrationFee: 0 } });
    const dossier = await prisma.dossier.create({ data: { email: "x@example.com", firstName: "Jan", lastName: "Jansen", phone: "x", address: "x", dateOfBirth: new Date("2000-01-01"), packageId: pkg.id, transmission: "AUTOMAAT", hoursRemaining: 18 } });
    await prisma.payment.create({ data: { dossierId: dossier.id, molliePaymentId: "tr_1", amount: 16000, type: "DEPOSIT", status: "PAID" } });

    const overview = await getDossierOverview();
    expect(overview[0].package.name).toBe("20-Uur Pakket");
    expect(overview[0].payments[0].status).toBe("PAID");
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement the query helper and both pages**

`src/app/admin/dossiers/dossierQuery.ts`:
```ts
import { prisma } from "@/lib/prisma";

export async function getDossierOverview() {
  return prisma.dossier.findMany({
    include: { package: true, payments: true },
    orderBy: { createdAt: "desc" },
  });
}
```

`src/app/admin/dossiers/page.tsx`:
```tsx
import { getDossierOverview } from "./dossierQuery";

export default async function AdminDossiersPage() {
  const dossiers = await getDossierOverview();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dossiers</h1>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Leerling</th><th>Pakket</th><th>Tegoed</th><th>Betaalstatus</th>
          </tr>
        </thead>
        <tbody>
          {dossiers.map((dossier) => (
            <tr key={dossier.id} className="border-b">
              <td className="py-2">{dossier.firstName} {dossier.lastName}</td>
              <td>{dossier.package.name}</td>
              <td>{dossier.hoursRemaining} uur</td>
              <td>{dossier.payments[0]?.status ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

`src/app/admin/rapport/page.tsx`:
```tsx
import { prisma } from "@/lib/prisma";

export default async function AdminReportPage() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [bookingCount, payments] = await Promise.all([
    prisma.lesson.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.payment.findMany({ where: { status: "PAID", createdAt: { gte: sevenDaysAgo } } }),
  ]);
  const revenue = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Rapport (laatste 7 dagen)</h1>
      <p>Aantal boekingen: {bookingCount}</p>
      <p>Ontvangen voorschotten: &euro;{(revenue / 100).toFixed(2)}</p>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/dossiers src/app/admin/rapport
git commit -m "feat: add admin dossier overview and revenue report"
```

---

### Task 29: SiteHeader, SiteFooter and Home page

**Files:**
- Create: `src/components/SiteHeader.tsx`, `src/components/SiteFooter.tsx`, `src/app/layout.tsx`, `src/app/page.tsx`
- Test: `src/components/SiteHeader.test.tsx`, `src/app/page.test.tsx`

**Interfaces:**
- Produces: `SiteHeader`, `SiteFooter` components (no props — static business info).

- [ ] **Step 1: Write the failing tests**

`src/components/SiteHeader.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  it("shows the brand name and a link to the booking wizard", () => {
    render(<SiteHeader />);
    expect(screen.getByText(/Alpha/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Boek Nu/i })).toHaveAttribute("href", "/boeken");
  });
});
```

`src/app/page.test.tsx` (replaces the Task 1 placeholder test):
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home", () => {
  it("renders the hero heading and a link to the booking wizard", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: /Welkom bij Alpha Rijschool/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Boek een les/i })).toHaveAttribute("href", "/boeken");
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL (`SiteHeader` doesn't exist yet; `Home` no longer matches the Task 1 placeholder).

- [ ] **Step 3: Implement**

`src/components/SiteHeader.tsx`:
```tsx
import Link from "next/link";

const PHONE = "+32 486 29 53 75";
const PHONE_HREF = "tel:+32486295375";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-extrabold uppercase tracking-wide">
          Alpha <span className="text-red-600">Rijschool</span>
        </Link>
        <nav className="hidden gap-6 text-sm font-semibold md:flex">
          <Link href="/over-ons">Over ons</Link>
          <Link href="/theorie">Theorie</Link>
          <Link href="/tarieven-pakketten">Tarieven + Pakketten</Link>
          <Link href="/veelgestelde-vragen">Veelgestelde vragen</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div className="flex items-center gap-4">
          <a href={PHONE_HREF} className="hidden text-sm font-semibold md:inline">{PHONE}</a>
          <Link href="/boeken" className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white">
            Boek Nu &rarr;
          </Link>
        </div>
      </div>
    </header>
  );
}
```

`src/components/SiteFooter.tsx`:
```tsx
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-red-600 py-10 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-lg font-extrabold uppercase">Alpha Rijschool</p>
        <p className="mt-2 text-sm opacity-90">Turnhoutsebaan 76B, 2100 Antwerpen, Belgi&euml;</p>
        <p className="text-sm opacity-90">rijschoolalpha@gmail.com &middot; +32 486 29 53 75</p>
        <nav className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link href="/tarieven-pakketten">Tarieven + Pakketten</Link>
          <Link href="/theorie">Theorie</Link>
          <Link href="/veelgestelde-vragen">Veelgestelde vragen</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <p className="mt-8 text-xs opacity-75">&copy; {new Date().getFullYear()} Alpha Rijschool. Alle rechten voorbehouden.</p>
      </div>
    </footer>
  );
}
```

`src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Alpha Rijschool",
  description: "Rijschool in Antwerpen — boek je rijlessen online.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
```

`src/app/page.tsx`:
```tsx
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <section className="bg-gray-100 px-6 py-24 text-center">
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-red-600">Alpha Rijschool</p>
        <h1 className="mb-4 text-4xl font-extrabold">Welkom bij Alpha Rijschool</h1>
        <p className="mx-auto mb-8 max-w-xl text-gray-600">
          Kies voor kwaliteit, kies voor zekerheid. Begin vandaag nog aan je rijavontuur.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/boeken" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Boek een les</Link>
          <Link href="/over-ons" className="rounded-full border-2 border-red-600 px-6 py-3 font-semibold text-red-600">
            Meer informatie
          </Link>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SiteHeader.tsx src/components/SiteHeader.test.tsx src/components/SiteFooter.tsx src/app/layout.tsx src/app/page.tsx src/app/page.test.tsx
git commit -m "feat: add site header, footer and home page"
```

---

### Task 30: Over ons, Theorie, FAQ and Contact pages

**Files:**
- Create: `src/app/over-ons/page.tsx`, `src/app/theorie/page.tsx`, `src/app/veelgestelde-vragen/page.tsx`, `src/app/contact/page.tsx`
- Test: `src/app/over-ons/page.test.tsx`, `src/app/veelgestelde-vragen/page.test.tsx`

These pages are static content (mirroring the existing WordPress theme's own copy, not BIQS/Antwerpse Rijschool content). A render smoke test per page is sufficient — no business logic to unit test.

- [ ] **Step 1: Write the failing tests**

`src/app/over-ons/page.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import OverOnsPage from "./page";

describe("OverOnsPage", () => {
  it("renders the page heading", () => {
    render(<OverOnsPage />);
    expect(screen.getByRole("heading", { name: "Over ons" })).toBeInTheDocument();
  });
});
```

`src/app/veelgestelde-vragen/page.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FaqPage from "./page";

describe("FaqPage", () => {
  it("renders at least one question", () => {
    render(<FaqPage />);
    expect(screen.getByText(/M12/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement the four pages**

`src/app/over-ons/page.tsx`:
```tsx
export default function OverOnsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-6 text-3xl font-extrabold">Over ons</h1>
      <p className="mb-4 text-gray-600">
        Wij bieden m&eacute;&eacute;r dan alleen rijlessen. Met aandacht en passie begeleiden we je om uit te
        groeien tot een zelfverzekerde en verantwoordelijke bestuurder.
      </p>
      <p className="mb-4 text-gray-600">
        Met flexibele lesuren, ervaren instructeurs en een aanpak die aansluit op jouw leerstijl, helpen we je
        stap voor stap naar succes.
      </p>
    </div>
  );
}
```

`src/app/theorie/page.tsx`:
```tsx
export default function TheoriePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-6 text-3xl font-extrabold">Theorie</h1>
      <div className="rounded-lg border p-6 shadow-sm">
        <h2 className="text-xl font-bold">Theorieles Pakket (12 uur)</h2>
        <p className="text-red-600">Uitgebreide voorbereiding op je theorie-examen</p>
        <p className="mt-2 text-gray-600">Verdeeld over 3 dagen, inclusief inschrijvingskosten: &euro;175 totaal.</p>
      </div>
    </div>
  );
}
```

`src/app/veelgestelde-vragen/page.tsx`:
```tsx
const faqs = [
  { q: "Wat is een M12?", a: "Het M12 is een voorlopig rijbewijs dat je kan behalen na 6 uur verplichte rijlessen bij een erkende rijschool. Het is 12 maanden geldig." },
  { q: "Wat is een stageattest?", a: "Een stageattest bevestigt dat je de 20 uur verplichte praktijklessen hebt gevolgd, waarmee je een voorlopig rijbewijs (M18) kan aanvragen." },
  { q: "Hoeveel lessen moet ik nemen?", a: "Dat verschilt van leerling tot leerling en hangt af van je rijervaring en het gekozen traject." },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-6 text-3xl font-extrabold">Veelgestelde vragen</h1>
      <div className="space-y-4">
        {faqs.map((faq) => (
          <details key={faq.q} className="rounded-lg bg-gray-100 p-4">
            <summary className="cursor-pointer font-semibold">{faq.q}</summary>
            <p className="mt-2 text-gray-600">{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
```

`src/app/contact/page.tsx`:
```tsx
export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-6 text-3xl font-extrabold">Contact</h1>
      <ul className="space-y-2 text-gray-600">
        <li><strong>Telefoon:</strong> +32 486 29 53 75</li>
        <li><strong>E-mail:</strong> rijschoolalpha@gmail.com</li>
        <li><strong>Adres:</strong> Turnhoutsebaan 76B, 2100 Antwerpen</li>
      </ul>
      <p className="mt-6 text-gray-600">
        Wil je meteen een les inplannen? Ga naar <a href="/boeken" className="text-red-600 underline">de boekingspagina</a>.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/over-ons src/app/theorie src/app/veelgestelde-vragen src/app/contact
git commit -m "feat: add static marketing pages"
```

---

### Task 31: Tarieven + Pakketten page (dynamic) with preselected booking links

**Files:**
- Create: `src/app/tarieven-pakketten/page.tsx`
- Test: `src/app/tarieven-pakketten/page.test.tsx`

**Interfaces:**
- Consumes: `getActivePackages` (Task 10).

- [ ] **Step 1: Write the failing test**

`src/app/tarieven-pakketten/page.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/packages", () => ({
  getActivePackages: vi.fn().mockResolvedValue([
    { id: "p1", name: "20-Uur Pakket", description: "Basisopleiding.", hours: 20, priceAutomaat: 155000, priceManueel: 145000, registrationFee: 2500, isSingleLesson: false },
  ]),
}));

describe("TarievenPakkettenPage", () => {
  it("lists each package with a booking link carrying its id", async () => {
    const { default: TarievenPakkettenPage } = await import("./page");
    render(await TarievenPakkettenPage());

    expect(screen.getByText("20-Uur Pakket")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Schrijf je nu in/i })).toHaveAttribute("href", "/boeken?package=p1");
  });
});
```

- [ ] **Step 2: Run to verify failure** — FAIL.

- [ ] **Step 3: Implement**

`src/app/tarieven-pakketten/page.tsx`:
```tsx
import Link from "next/link";
import { getActivePackages } from "@/lib/packages";

export default async function TarievenPakkettenPage() {
  const packages = await getActivePackages();

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="mb-10 text-3xl font-extrabold">Tarieven + Pakketten</h1>
      <div className="grid gap-6 md:grid-cols-3">
        {packages.map((pkg) => (
          <div key={pkg.id} className="flex flex-col rounded-lg border p-6 shadow-sm">
            <h2 className="text-lg font-bold">{pkg.name}</h2>
            <p className="mt-2 flex-1 text-sm text-gray-600">{pkg.description}</p>
            <div className="my-4 flex gap-4 border-y py-4 text-sm">
              <div><p className="text-gray-500">Automaat</p><p className="text-xl font-extrabold">&euro;{(pkg.priceAutomaat / 100).toFixed(2)}</p></div>
              <div><p className="text-gray-500">Manueel</p><p className="text-xl font-extrabold">&euro;{(pkg.priceManueel / 100).toFixed(2)}</p></div>
            </div>
            <p className="mb-4 text-xs text-gray-500">+ &euro;{(pkg.registrationFee / 100).toFixed(2)} inschrijvingskosten</p>
            <Link href={`/boeken?package=${pkg.id}`} className="rounded-full bg-red-600 px-5 py-2 text-center text-sm font-semibold text-white">
              Schrijf je nu in
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/tarieven-pakketten
git commit -m "feat: add dynamic pricing page wired into the booking wizard"
```

---

## Self-Review Notes

- **Spec coverage:** §2 marketing pages → Tasks 29–31; booking wizard → Tasks 18–23; dossier/magic link → Tasks 16–17; admin dashboard → Tasks 24–28; Mollie/Bancontact → Tasks 12, 14, 15; kalender-engine → Tasks 5, 11, 18, 21; annuleringsbeleid §7 → Tasks 8, 27; GDPR/encryptie §8 → Task 9; magic link TTL §8 → Task 7. All spec sections are covered by at least one task.
- **Type consistency:** `Slot { startAt, endAt }` (Task 18) is extended consistently as `BookingSlot` in Task 21 and consumed identically in Tasks 19/23. `PackageDTO` (Task 20) fields match the Prisma `Package` model (Task 2) and `getActivePackages()` (Task 10). `Transmission` string union `"AUTOMAAT" | "MANUEEL"` is used identically across Tasks 6, 14, 19, 20, 23; the Prisma enum additionally has `BOTH` for `Instructor.transmission`, which is intentionally a separate type (an instructor supports one or both, a booking always picks one).
- **No placeholders:** every step contains runnable code; no task ends in "TBD" or unshown logic.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-22-rijschool-booking-app.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
