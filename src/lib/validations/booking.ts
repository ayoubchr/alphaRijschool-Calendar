import { z } from "zod";
import { isValidRijksregisternummer } from "@/lib/rijksregisternummer";

export const bookingRequestSchema = z.object({
  packageId: z.string().min(1),
  transmission: z.enum(["AUTOMAAT", "MANUEEL"]),
  slots: z
    .array(z.object({ instructorId: z.string().min(1), startAt: z.string().datetime(), endAt: z.string().datetime() }))
    .min(1),
  details: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().min(1),
    dateOfBirth: z.string().min(1),
    nationalRegisterNumber: z
      .string()
      .optional()
      .refine((value) => !value || isValidRijksregisternummer(value), {
        message: "Ongeldig rijksregisternummer. Verwacht formaat: 11 cijfers, eventueel met punten/streepjes.",
      }),
  }),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;
