import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { error: "Vul je e-mailadres in." })
    .email({ error: "Vul een geldig e-mailadres in." }),
  password: z.string().min(1, { error: "Vul je wachtwoord in." }),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
