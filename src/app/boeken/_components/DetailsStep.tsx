"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { createBookingDetailsSchema, type BookingDetailsInput } from "@/lib/validations/bookingDetails";

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
  initialValues?: BookingDetails | null;
  onSubmit: (details: BookingDetails) => void;
  onBack: () => void;
}

const inputClass = (invalid: boolean) =>
  `mt-1 w-full rounded-[10px] border px-3 py-2 outline-none transition focus:border-[#111827] ${
    invalid ? "border-[#ed1c24]" : "border-black/10"
  }`;

export function DetailsStep({ requiresNationalRegisterNumber, initialValues, onSubmit, onBack }: DetailsStepProps) {
  const schema = useMemo(
    () => createBookingDetailsSchema(requiresNationalRegisterNumber),
    [requiresNationalRegisterNumber]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingDetailsInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: initialValues?.firstName ?? "",
      lastName: initialValues?.lastName ?? "",
      email: initialValues?.email ?? "",
      phone: initialValues?.phone ?? "",
      address: initialValues?.address ?? "",
      dateOfBirth: initialValues?.dateOfBirth ?? "",
      nationalRegisterNumber: initialValues?.nationalRegisterNumber ?? "",
    },
  });

  function submit(values: BookingDetailsInput) {
    onSubmit({
      ...values,
      nationalRegisterNumber: requiresNationalRegisterNumber ? values.nationalRegisterNumber : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <h1 className="mb-2 text-2xl font-extrabold text-[#111827]">Jouw gegevens</h1>

      <label className="block text-sm font-medium">
        Voornaam *
        <input {...register("firstName")} autoComplete="given-name" className={inputClass(Boolean(errors.firstName))} />
        {errors.firstName && <p className="mt-1 text-sm text-[#ed1c24]">{errors.firstName.message}</p>}
      </label>

      <label className="block text-sm font-medium">
        Familienaam *
        <input {...register("lastName")} autoComplete="family-name" className={inputClass(Boolean(errors.lastName))} />
        {errors.lastName && <p className="mt-1 text-sm text-[#ed1c24]">{errors.lastName.message}</p>}
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
        Adres *
        <input {...register("address")} autoComplete="street-address" className={inputClass(Boolean(errors.address))} />
        {errors.address && <p className="mt-1 text-sm text-[#ed1c24]">{errors.address.message}</p>}
      </label>

      <label className="block text-sm font-medium">
        Geboortedatum *
        <input {...register("dateOfBirth")} type="date" autoComplete="bdate" className={inputClass(Boolean(errors.dateOfBirth))} />
        {errors.dateOfBirth && <p className="mt-1 text-sm text-[#ed1c24]">{errors.dateOfBirth.message}</p>}
      </label>

      {requiresNationalRegisterNumber && (
        <label className="block text-sm font-medium">
          Rijksregisternummer *
          <input
            {...register("nationalRegisterNumber")}
            placeholder="85.07.30-033.28"
            className={inputClass(Boolean(errors.nationalRegisterNumber))}
          />
          {errors.nationalRegisterNumber && (
            <p className="mt-1 text-sm text-[#ed1c24]">{errors.nationalRegisterNumber.message}</p>
          )}
        </label>
      )}

      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} className="text-sm text-gray-500">&larr; Terug</button>
        <button type="submit" className="rounded-[10px] bg-[#ed1c24] px-6 py-3 font-semibold text-white transition hover:bg-[#111827]">
          Volgende
        </button>
      </div>
    </form>
  );
}
