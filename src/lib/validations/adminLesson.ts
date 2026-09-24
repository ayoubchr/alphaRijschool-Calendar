import { z } from "zod";

export const adminLessonActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("confirm") }),
  z.object({ action: z.literal("cancel") }),
  z.object({ action: z.literal("reschedule"), startAt: z.string().datetime(), endAt: z.string().datetime() }),
]);

export type AdminLessonAction = z.infer<typeof adminLessonActionSchema>;
