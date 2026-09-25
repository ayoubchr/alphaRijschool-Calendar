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

const time = z.string().regex(/^\d{2}:\d{2}$/);

export const availabilityRuleUpdateSchema = z
  .object({
    id: z.string().min(1),
    startTime: time,
    endTime: time,
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "startTime must be before endTime",
    path: ["endTime"],
  });

export const availabilityExceptionSchema = z
  .object({
    instructorId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: time,
    endTime: time,
    isAvailable: z.boolean(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "startTime must be before endTime",
    path: ["endTime"],
  });

export const daySlotsSchema = z.object({
  instructorId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slots: z
    .array(
      z
        .object({ startTime: time, endTime: time })
        .refine((slot) => slot.startTime < slot.endTime, { path: ["endTime"] })
    )
    .max(8),
});

export const dayLeaveSchema = z.object({
  instructorId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const weeklySlotsSchema = z.object({
  instructorId: z.string().min(1),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  slots: z
    .array(
      z
        .object({ startTime: time, endTime: time })
        .refine((slot) => slot.startTime < slot.endTime, { path: ["endTime"] })
    )
    .min(1)
    .max(8),
});

export const instructorScheduleSchema = z
  .object({
    instructorId: z.string().min(1),
    weekdays: z.array(z.number().int().min(0).max(6)).max(7),
    startTime: time,
    endTime: time,
  })
  .refine((data) => data.weekdays.length === 0 || data.startTime < data.endTime, {
    message: "startTime must be before endTime",
    path: ["endTime"],
  });

export const instructorCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
  transmission: z.enum(["AUTOMAAT", "MANUEEL", "BOTH"]),
});
