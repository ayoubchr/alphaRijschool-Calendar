import { z } from "zod";

export const availabilityRuleSchema = z
  .object({
    instructorId: z.string().min(1),
    weekday: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "startTime must be before endTime",
    path: ["endTime"],
  });

export type AvailabilityRuleInput = z.infer<typeof availabilityRuleSchema>;
