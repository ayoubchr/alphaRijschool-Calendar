"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { setPasswordSchema, type SetPasswordInput } from "@/lib/validations/setPassword";

const inputClass = (invalid: boolean) =>
  `mt-1 w-full rounded-[10px] border px-3 py-2 outline-none transition focus:border-[#111827] ${
    invalid ? "border-[#ed1c24]" : "border-black/10"
  }`;

export default function SetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  useEffect(() => {
    const supabase = createBrowserSupabase();
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(Boolean(data.user));
      setReady(true);
    });
  }, []);

  async function onSubmit(values: SetPasswordInput) {
    setServerError("");
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setServerError("Het wachtwoord kon niet worden opgeslagen. Vraag een nieuwe uitnodiging.");
      return;
    }
    router.push("/admin/agenda");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-[#f4f4f5] px-6 py-12">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-4 rounded-[10px] border border-black/10 bg-white p-8 shadow-sm" noValidate>
        <div className="relative mx-auto mb-2 h-[118px] w-[250px] overflow-hidden">
          <a href="/">
            <Image
              src="/alpha-logo.webp"
              alt="Alpha Rijschool"
              width={591}
              height={591}
              priority
              className="absolute left-1/2 top-1/2 h-[210px] w-auto max-w-none -translate-x-1/2 -translate-y-[48%]"
            />
          </a>
        </div>
        <h1 className="text-center text-2xl font-extrabold text-[#111827]">Wachtwoord kiezen</h1>
        {!ready ? (
          <p className="text-center text-sm text-[#58595b]">Even geduld…</p>
        ) : !hasSession ? (
          <p className="text-center text-sm text-[#ed1c24]">Deze uitnodiging is ongeldig of verlopen. Vraag de beheerder om je opnieuw toe te voegen.</p>
        ) : (
          <>
            <p className="text-center text-sm text-[#58595b]">Kies een wachtwoord. Daarna log je daarmee in.</p>
            <label className="block text-sm font-medium">
              Wachtwoord *
              <input {...register("password")} type="password" autoComplete="new-password" className={inputClass(Boolean(errors.password))} />
              {errors.password && <p className="mt-1 text-sm text-[#ed1c24]">{errors.password.message}</p>}
            </label>
            <label className="block text-sm font-medium">
              Herhaal wachtwoord *
              <input {...register("confirm")} type="password" autoComplete="new-password" className={inputClass(Boolean(errors.confirm))} />
              {errors.confirm && <p className="mt-1 text-sm text-[#ed1c24]">{errors.confirm.message}</p>}
            </label>
            {serverError && <p className="text-sm text-[#ed1c24]">{serverError}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-[#ed1c24] px-6 font-medium text-white transition hover:bg-[#111827] disabled:opacity-60"
            >
              {isSubmitting ? "Opslaan..." : "Wachtwoord opslaan"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
