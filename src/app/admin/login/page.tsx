"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { adminLoginSchema, type AdminLoginInput } from "@/lib/validations/adminLogin";

const inputClass = (invalid: boolean) =>
  `mt-1 w-full rounded-[10px] border px-3 py-2 outline-none transition focus:border-[#111827] ${
    invalid ? "border-[#ed1c24]" : "border-black/10"
  }`;

export default function AdminLoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: AdminLoginInput) {
    setServerError("");
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
    if (error) {
      setServerError("Ongeldige combinatie van e-mail en wachtwoord.");
      return;
    }
    const { data } = await supabase.auth.getUser();
    const role = data.user?.app_metadata?.role;
    router.push(role === "STUDENT" ? "/mijn-lessen" : "/admin/agenda");
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
      <h1 className="text-center text-2xl font-extrabold text-[#111827]">Beheerder Dashboard</h1>

      <label className="block text-sm font-medium">
        E-mail *
        <input {...register("email")} type="email" autoComplete="email" className={inputClass(Boolean(errors.email))} />
        {errors.email && <p className="mt-1 text-sm text-[#ed1c24]">{errors.email.message}</p>}
      </label>

      <label className="block text-sm font-medium">
        Wachtwoord *
        <input {...register("password")} type="password" autoComplete="current-password" className={inputClass(Boolean(errors.password))} />
        {errors.password && <p className="mt-1 text-sm text-[#ed1c24]">{errors.password.message}</p>}
      </label>

      {serverError && <p className="text-sm text-[#ed1c24]">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-[#ed1c24] px-6 font-medium text-white transition hover:bg-[#111827] disabled:opacity-60"
      >
        {isSubmitting ? "Aanmelden..." : "Aanmelden"}
      </button>
    </form>
    </div>
  );
}
