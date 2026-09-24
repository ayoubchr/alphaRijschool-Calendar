import { z } from "zod";

export const dossierLessonSchema = z.object({
  instructorId: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

export type DossierLessonInput = z.infer<typeof dossierLessonSchema>;
