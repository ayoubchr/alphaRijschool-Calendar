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

type DossierWithRelations = NonNullable<Awaited<ReturnType<typeof findDossierByMagicLinkToken>>>;

/**
 * Strips the dossier down to the fields that are safe to send to the browser
 * (or return from a public API route). The full Prisma record includes PII
 * such as email, phone, address, dateOfBirth and nationalRegisterNumber,
 * none of which the dossier view needs to render.
 */
export function toPublicDossier(dossier: DossierWithRelations) {
  return {
    id: dossier.id,
    firstName: dossier.firstName,
    lastName: dossier.lastName,
    hoursRemaining: dossier.hoursRemaining,
    package: { name: dossier.package.name },
    lessons: dossier.lessons.map((lesson) => ({
      id: lesson.id,
      startAt: lesson.startAt.toISOString(),
      endAt: lesson.endAt.toISOString(),
      status: lesson.status,
      instructor: { name: lesson.instructor.name },
    })),
  };
}
