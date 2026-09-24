"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CONTACT_SUBJECTS, contactSchema, type ContactInput } from "@/lib/validations/contact";

const inputClass = (invalid: boolean) =>
  `mt-1 w-full rounded-[10px] border px-3 py-2 outline-none transition focus:border-[#111827] ${
    invalid ? "border-[#ed1c24]" : "border-black/10"
  }`;

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", message: "", company: "" },
  });

  async function onSubmit(values: ContactInput) {
    setServerError("");
    setSent(false);

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setServerError(body?.error ?? "Het bericht kon niet worden verstuurd.");
      return;
    }

    reset();
    setSent(true);
  }

  return (
    <form id="formContact" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <label className="block text-sm font-medium">
        Naam *
        <input {...register("name")} autoComplete="name" className={inputClass(Boolean(errors.name))} />
        {errors.name && <p className="mt-1 text-sm text-[#ed1c24]">{errors.name.message}</p>}
      </label>

      <label className="block text-sm font-medium">
        E-mail *
        <input {...register("email")} type="email" autoComplete="email" className={inputClass(Boolean(errors.email))} />
        {errors.email && <p className="mt-1 text-sm text-[#ed1c24]">{errors.email.message}</p>}
      </label>

      <label className="block text-sm font-medium">
        Telefoon *
        <input {...register("phone")} type="tel" autoComplete="tel" className={inputClass(Boolean(errors.phone))} />
        {errors.phone && <p className="mt-1 text-sm text-[#ed1c24]">{errors.phone.message}</p>}
      </label>

      <label className="block text-sm font-medium">
        Bericht *
        <textarea {...register("message")} rows={5} className={inputClass(Boolean(errors.message))} />
        {errors.message && <p className="mt-1 text-sm text-[#ed1c24]">{errors.message.message}</p>}
      </label>

      <fieldset className={`rounded-[10px] border p-3 ${errors.subject ? "border-[#ed1c24]" : "border-transparent"}`}>
        <legend className="text-sm font-medium">Onderwerp *</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {CONTACT_SUBJECTS.map((subject) => (
            <label key={subject} className="flex items-center gap-2 text-sm text-[#58595b]">
              <input type="radio" value={subject} {...register("subject")} />
              {subject}
            </label>
          ))}
        </div>
        {errors.subject && <p className="mt-2 text-sm text-[#ed1c24]">{errors.subject.message}</p>}
      </fieldset>

      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          Bedrijf
          <input {...register("company")} tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {serverError && <p className="text-sm text-[#ed1c24]">{serverError}</p>}
      {sent && <p className="text-sm text-neutral-800">Bedankt. We hebben je bericht ontvangen en reageren zo snel mogelijk.</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[#ed1c24] px-6 font-medium text-white transition hover:bg-[#111827] disabled:opacity-60"
      >
        {isSubmitting ? "Verzenden..." : "Verzenden"}
      </button>
    </form>
  );
}
