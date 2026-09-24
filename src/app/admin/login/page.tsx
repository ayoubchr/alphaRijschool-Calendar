"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { adminLoginSchema, type AdminLoginInput } from "@/lib/adminLoginSchema";

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
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError("Ongeldige combinatie van e-mail en wachtwoord.");
      return;
    }
    router.push("/admin/agenda");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-sm space-y-4 py-24" noValidate>
      <h1 className="text-2xl font-bold">Beheerder aanmelden</h1>

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
  );
}
