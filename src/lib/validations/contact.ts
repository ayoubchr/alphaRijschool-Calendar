import { z } from "zod";

export const CONTACT_SUBJECTS = [
  "2 uur manueel",
  "2 uur automaat",
  "6 uur manueel",
  "6 uur automaat",
  "20 uur manueel",
  "20 uur automaat",
  "theorie",
] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(1, { error: "Vul je naam in." }).max(120, { error: "Naam is te lang." }),
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
  message: z
    .string()
    .trim()
    .min(1, { error: "Schrijf een bericht." })
    .max(4000, { error: "Bericht is te lang." }),
  subject: z.enum(CONTACT_SUBJECTS, { error: "Kies een onderwerp." }),
  company: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
