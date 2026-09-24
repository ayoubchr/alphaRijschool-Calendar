import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  availabilityExceptionSchema,
  availabilityRuleSchema,
  availabilityRuleUpdateSchema,
  dayLeaveSchema,
  daySlotsSchema,
  instructorCreateSchema,
  instructorScheduleSchema,
  weeklySlotsSchema,
} from "@/lib/validations/availability";

type Fail = { ok: false; status: number; error: string };

async function assertCanEditInstructor(instructorId: string): Promise<{ ok: true } | Fail> {
  const session = await auth();
  if (!session?.user) return { ok: false, status: 401, error: "Niet aangemeld." };
  const user = session.user as { role?: string; instructorId?: string };
  if (user.role !== "ADMIN" && user.role !== "INSTRUCTOR") {
    return { ok: false, status: 403, error: "Geen toegang." };
  }
  if (user.role === "INSTRUCTOR" && user.instructorId !== instructorId) {
    return { ok: false, status: 403, error: "Je kan alleen je eigen beschikbaarheid aanpassen." };
  }
  return { ok: true };
}

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function serializeException(exception: {
  id: string;
  instructorId: string;
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}) {
  return {
    id: exception.id,
    instructorId: exception.instructorId,
    date: exception.date.toISOString().slice(0, 10),
    startTime: exception.startTime.slice(0, 5),
    endTime: exception.endTime.slice(0, 5),
    isAvailable: exception.isAvailable,
  };
}

function notFound(error: unknown): Fail | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return { ok: false, status: 404, error: "Niet gevonden." };
  }
  return null;
}

export async function createInstructor(input: unknown) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user) return { ok: false as const, status: 401, error: "Niet aangemeld." };
  if (role !== "ADMIN") return { ok: false as const, status: 403, error: "Alleen een beheerder kan instructeurs toevoegen." };

  const parsed = instructorCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, status: 400, error: "Ongeldige instructeur." };

  const instructor = await prisma.instructor.create({
    data: { name: parsed.data.name, transmission: parsed.data.transmission, active: true },
  });
  return {
    ok: true as const,
    instructor: { ...instructor, availabilityRules: [], availabilityExceptions: [] },
  };
}

export async function setInstructorSchedule(input: unknown) {
  const parsed = instructorScheduleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, status: 400, error: "Ongeldig rooster." };

  const access = await assertCanEditInstructor(parsed.data.instructorId);
  if (!access.ok) return access;

  const weekdays = Array.from(new Set(parsed.data.weekdays));
  const rules = await prisma.$transaction(async (tx) => {
    await tx.availabilityRule.deleteMany({ where: { instructorId: parsed.data.instructorId } });
    if (weekdays.length === 0) return [];
    return Promise.all(
      weekdays.map((weekday) =>
        tx.availabilityRule.create({
          data: {
            instructorId: parsed.data.instructorId,
            weekday,
            startTime: parsed.data.startTime,
            endTime: parsed.data.endTime,
          },
        })
      )
    );
  });
  return { ok: true as const, rules };
}

export async function setDaySlots(input: unknown) {
  const parsed = daySlotsSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, status: 400, error: "Ongeldige dag." };

  const access = await assertCanEditInstructor(parsed.data.instructorId);
  if (!access.ok) return access;

  const date = dateOnly(parsed.data.date);
  const weekday = date.getUTCDay();
  const rules = await prisma.availabilityRule.findMany({
    where: { instructorId: parsed.data.instructorId, weekday },
  });
  const covered = new Set(rules.map((rule) => rule.startTime.slice(0, 5)));
  const wanted = new Set(parsed.data.slots.map((slot) => slot.startTime));
  const overrides = [
    ...parsed.data.slots
      .filter((slot) => !covered.has(slot.startTime))
      .map((slot) => ({ ...slot, isAvailable: true })),
    ...rules
      .filter((rule) => !wanted.has(rule.startTime.slice(0, 5)))
      .map((rule) => ({ startTime: rule.startTime.slice(0, 5), endTime: rule.endTime.slice(0, 5), isAvailable: false })),
  ];
  const created = await prisma.$transaction(async (tx) => {
    await tx.availabilityException.deleteMany({ where: { instructorId: parsed.data.instructorId, date } });
    return Promise.all(
      overrides.map((slot) =>
        tx.availabilityException.create({
          data: {
            instructorId: parsed.data.instructorId,
            date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isAvailable: slot.isAvailable,
          },
        })
      )
    );
  });
  return { ok: true as const, exceptions: created.map(serializeException) };
}

export async function setWeeklySlots(input: unknown) {
  const parsed = weeklySlotsSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, status: 400, error: "Ongeldig weekrooster." };

  const access = await assertCanEditInstructor(parsed.data.instructorId);
  if (!access.ok) return access;

  const weekdays = Array.from(new Set(parsed.data.weekdays));
  const { rules, exceptions } = await prisma.$transaction(async (tx) => {
    await tx.availabilityRule.deleteMany({
      where: { instructorId: parsed.data.instructorId, weekday: { in: weekdays } },
    });
    await Promise.all(
      weekdays.flatMap((weekday) =>
        parsed.data.slots.map((slot) =>
          tx.availabilityRule.create({
            data: {
              instructorId: parsed.data.instructorId,
              weekday,
              startTime: slot.startTime,
              endTime: slot.endTime,
            },
          })
        )
      )
    );
    const existing = await tx.availabilityException.findMany({ where: { instructorId: parsed.data.instructorId } });
    const stale = existing.filter((item) => weekdays.includes(item.date.getUTCDay())).map((item) => item.id);
    if (stale.length > 0) {
      await tx.availabilityException.deleteMany({ where: { id: { in: stale } } });
    }
    const [nextRules, nextExceptions] = await Promise.all([
      tx.availabilityRule.findMany({ where: { instructorId: parsed.data.instructorId } }),
      tx.availabilityException.findMany({ where: { instructorId: parsed.data.instructorId } }),
    ]);
    return { rules: nextRules, exceptions: nextExceptions };
  });
  return {
    ok: true as const,
    rules: rules.map((rule) => ({
      id: rule.id,
      weekday: rule.weekday,
      startTime: rule.startTime.slice(0, 5),
      endTime: rule.endTime.slice(0, 5),
    })),
    exceptions: exceptions.map(serializeException),
  };
}

export async function removeInstructor(id: string) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user) return { ok: false as const, status: 401, error: "Niet aangemeld." };
  if (role !== "ADMIN") return { ok: false as const, status: 403, error: "Alleen een beheerder kan instructeurs verwijderen." };

  const lessonCount = await prisma.lesson.count({ where: { instructorId: id } });
  if (lessonCount > 0) {
    return { ok: false as const, status: 409, error: "Deze instructeur heeft nog lessen en kan niet verwijderd worden." };
  }

  try {
    await prisma.$transaction([
      prisma.availabilityRule.deleteMany({ where: { instructorId: id } }),
      prisma.availabilityException.deleteMany({ where: { instructorId: id } }),
      prisma.staffUser.updateMany({ where: { instructorId: id }, data: { instructorId: null } }),
      prisma.instructor.delete({ where: { id } }),
    ]);
  } catch (error) {
    const missing = notFound(error);
    if (missing) return missing;
    throw error;
  }
  return { ok: true as const };
}

export async function createAvailabilityRule(input: unknown) {
  const parsed = availabilityRuleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, status: 400, error: "Ongeldig tijdvenster." };

  const access = await assertCanEditInstructor(parsed.data.instructorId);
  if (!access.ok) return access;

  const instructor = await prisma.instructor.findUnique({ where: { id: parsed.data.instructorId } });
  if (!instructor) return { ok: false as const, status: 404, error: "Instructeur niet gevonden." };

  const rule = await prisma.availabilityRule.create({ data: parsed.data });
  return { ok: true as const, rule };
}

export async function updateAvailabilityRule(input: unknown) {
  const parsed = availabilityRuleUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, status: 400, error: "Ongeldig tijdvenster." };

  const existing = await prisma.availabilityRule.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return { ok: false as const, status: 404, error: "Niet gevonden." };
  const access = await assertCanEditInstructor(existing.instructorId);
  if (!access.ok) return access;

  try {
    const rule = await prisma.availabilityRule.update({
      where: { id: parsed.data.id },
      data: { startTime: parsed.data.startTime, endTime: parsed.data.endTime },
    });
    return { ok: true as const, rule };
  } catch (error) {
    const missing = notFound(error);
    if (missing) return missing;
    throw error;
  }
}

export async function deleteAvailabilityRule(id: string) {
  const existing = await prisma.availabilityRule.findUnique({ where: { id } });
  if (!existing) return { ok: false as const, status: 404, error: "Niet gevonden." };
  const access = await assertCanEditInstructor(existing.instructorId);
  if (!access.ok) return access;

  await prisma.availabilityRule.delete({ where: { id } });
  return { ok: true as const };
}

export async function createAvailabilityException(input: unknown) {
  const parsed = availabilityExceptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, status: 400, error: "Ongeldige uitzondering." };

  const access = await assertCanEditInstructor(parsed.data.instructorId);
  if (!access.ok) return access;

  const exception = await prisma.availabilityException.create({
    data: {
      instructorId: parsed.data.instructorId,
      date: dateOnly(parsed.data.date),
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      isAvailable: parsed.data.isAvailable,
    },
  });
  return { ok: true as const, exception: serializeException(exception) };
}

export async function setDayLeave(input: unknown) {
  const parsed = dayLeaveSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, status: 400, error: "Ongeldige datum." };

  const access = await assertCanEditInstructor(parsed.data.instructorId);
  if (!access.ok) return access;

  const date = dateOnly(parsed.data.date);
  const exception = await prisma.$transaction(async (tx) => {
    await tx.availabilityException.deleteMany({ where: { instructorId: parsed.data.instructorId, date } });
    return tx.availabilityException.create({
      data: {
        instructorId: parsed.data.instructorId,
        date,
        startTime: "00:00",
        endTime: "23:59",
        isAvailable: false,
      },
    });
  });
  return { ok: true as const, exception: serializeException(exception) };
}

export async function clearDayExceptions(input: unknown) {
  const parsed = dayLeaveSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, status: 400, error: "Ongeldige datum." };

  const access = await assertCanEditInstructor(parsed.data.instructorId);
  if (!access.ok) return access;

  await prisma.availabilityException.deleteMany({
    where: { instructorId: parsed.data.instructorId, date: dateOnly(parsed.data.date) },
  });
  return { ok: true as const };
}

export async function deleteAvailabilityException(id: string) {
  const existing = await prisma.availabilityException.findUnique({ where: { id } });
  if (!existing) return { ok: false as const, status: 404, error: "Niet gevonden." };
  const access = await assertCanEditInstructor(existing.instructorId);
  if (!access.ok) return access;

  await prisma.availabilityException.delete({ where: { id } });
  return { ok: true as const };
}
