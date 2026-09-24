import { z } from "zod";
import { isValidRijksregisternummer } from "@/lib/rijksregisternummer";

export function createBookingDetailsSchema(requiresNationalRegisterNumber: boolean) {
  return z.object({
    firstName: z.string().trim().min(1, { error: "Vul je voornaam in." }).max(80, { error: "Voornaam is te lang." }),
    lastName: z.string().trim().min(1, { error: "Vul je familienaam in." }).max(80, { error: "Familienaam is te lang." }),
    email: z
      .string()
      .trim()
      .min(1, { error: "Vul je e-mailadres in." })
      .email({ error: "Vul een geldig e-mailadres in." }),
    phone: z
      .string()
      .trim()
      .min(1, { error: "Vul je telefoonnummer in." })
      .max(40, { error: "Telefoonnummer is te lang." }),
    address: z.string().trim().min(1, { error: "Vul je adres in." }).max(200, { error: "Adres is te lang." }),
    dateOfBirth: z
      .string()
      .trim()
      .min(1, { error: "Vul je geboortedatum in." })
      .refine((value) => {
        const date = new Date(`${value}T00:00:00`);
        return !Number.isNaN(date.getTime()) && date < new Date();
      }, { error: "Vul een geldige geboortedatum in." }),
    nationalRegisterNumber: requiresNationalRegisterNumber
      ? z
          .string()
          .trim()
          .min(1, { error: "Vul je rijksregisternummer in." })
          .refine(isValidRijksregisternummer, {
            error: "Rijksregisternummer moet 11 cijfers bevatten (bv. 85.07.30-033.28).",
          })
      : z.string().optional(),
  });
}

export type BookingDetailsInput = z.infer<ReturnType<typeof createBookingDetailsSchema>>;
