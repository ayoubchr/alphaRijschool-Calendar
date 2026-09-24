"use client";

import { type FormEvent, useState } from "react";
import { isValidRijksregisternummer } from "@/lib/rijksregisternummer";

export interface BookingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  nationalRegisterNumber?: string;
}

interface DetailsStepProps {
  requiresNationalRegisterNumber: boolean;
  onSubmit: (details: BookingDetails) => void;
  onBack: () => void;
}

export function DetailsStep({ requiresNationalRegisterNumber, onSubmit, onBack }: DetailsStepProps) {
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const details: BookingDetails = {
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      address: String(form.get("address") ?? ""),
      dateOfBirth: String(form.get("dateOfBirth") ?? ""),
      nationalRegisterNumber: form.get("nationalRegisterNumber") ? String(form.get("nationalRegisterNumber")) : undefined,
    };

    if (!details.firstName || !details.lastName || !details.email) {
      setError("Voornaam, familienaam en e-mailadres zijn verplicht.");
      return;
    }
    if (requiresNationalRegisterNumber && !details.nationalRegisterNumber) {
      setError("Rijksregisternummer is verplicht voor dit pakket.");
      return;
    }
    if (details.nationalRegisterNumber && !isValidRijksregisternummer(details.nationalRegisterNumber)) {
      setError("Rijksregisternummer moet 11 cijfers bevatten (bv. 85.07.30-033.28).");
      return;
    }

    onSubmit(details);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="mb-2 text-2xl font-extrabold text-[#111827]">Jouw gegevens</h1>
      {error && <p className="text-sm text-[#ed1c24]">{error}</p>}
      <input name="firstName" placeholder="Voornaam" required className="w-full rounded-[10px] border border-black/10 px-3 py-3" />
      <input name="lastName" placeholder="Familienaam" required className="w-full rounded-[10px] border border-black/10 px-3 py-3" />
      <input name="email" type="email" placeholder="E-mailadres" required className="w-full rounded-[10px] border border-black/10 px-3 py-3" />
      <input name="phone" placeholder="Telefoonnummer" required className="w-full rounded-[10px] border border-black/10 px-3 py-3" />
      <input name="address" placeholder="Adres" required className="w-full rounded-[10px] border border-black/10 px-3 py-3" />
      <label className="block text-sm font-medium text-[#58595b]">
        Geboortedatum
        <input name="dateOfBirth" type="date" required className="mt-1 w-full rounded-[10px] border border-black/10 px-3 py-3" />
      </label>
      {requiresNationalRegisterNumber && (
        <input name="nationalRegisterNumber" placeholder="Rijksregisternummer" className="w-full rounded-[10px] border border-black/10 px-3 py-3" />
      )}
      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} className="text-sm text-gray-500">&larr; Terug</button>
        <button type="submit" className="rounded-[10px] bg-[#ed1c24] px-6 py-3 font-semibold text-white transition hover:bg-[#111827]">Volgende</button>
      </div>
    </form>
  );
}
