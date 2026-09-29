import { z } from "zod";

export const setPasswordSchema = z
  .object({
    password: z.string().min(8, { error: "Kies een wachtwoord van minstens 8 tekens." }),
    confirm: z.string().min(1, { error: "Herhaal je wachtwoord." }),
  })
  .refine((value) => value.password === value.confirm, {
    path: ["confirm"],
    error: "De wachtwoorden komen niet overeen.",
  });

export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
