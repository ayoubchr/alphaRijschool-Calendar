"use client";

import { type FormEvent, useState } from "react";

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

    onSubmit(details);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="mb-2 text-2xl font-bold">Jouw gegevens</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input name="firstName" placeholder="Voornaam" required className="w-full rounded border p-3" />
      <input name="lastName" placeholder="Familienaam" required className="w-full rounded border p-3" />
      <input name="email" type="email" placeholder="E-mailadres" required className="w-full rounded border p-3" />
      <input name="phone" placeholder="Telefoonnummer" required className="w-full rounded border p-3" />
      <input name="address" placeholder="Adres" required className="w-full rounded border p-3" />
      <input name="dateOfBirth" type="date" required className="w-full rounded border p-3" />
      {requiresNationalRegisterNumber && (
        <input name="nationalRegisterNumber" placeholder="Rijksregisternummer" className="w-full rounded border p-3" />
      )}
      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} className="text-sm text-gray-500">&larr; Terug</button>
        <button type="submit" className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Volgende</button>
      </div>
    </form>
  );
}
