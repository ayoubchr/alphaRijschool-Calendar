"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { createBookingDetailsSchema, type BookingDetailsInput } from "@/lib/validations/bookingDetails";
import { documentIntro, extraDocumentOptions, uploadError, type DocumentSet, type ExtraDocumentKind } from "@/lib/bookingDocuments";

export interface BookingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  nationalRegisterNumber?: string;
  idFile: File;
  extraFile?: File;
  extraKind?: ExtraDocumentKind;
}

interface DetailsStepProps {
  requiresNationalRegisterNumber: boolean;
  documentSet: DocumentSet;
  initialValues?: BookingDetails | null;
  onSubmit: (details: BookingDetails) => void;
  onBack: () => void;
}

const inputClass = (invalid: boolean) =>
  `mt-1 w-full rounded-[10px] border px-3 py-2 outline-none transition focus:border-[#111827] ${
    invalid ? "border-[#ed1c24]" : "border-black/10"
  }`;

export function DetailsStep({ requiresNationalRegisterNumber, documentSet, initialValues, onSubmit, onBack }: DetailsStepProps) {
  const schema = useMemo(
    () => createBookingDetailsSchema(requiresNationalRegisterNumber),
    [requiresNationalRegisterNumber]
  );
  const extraOptions = extraDocumentOptions(documentSet);
  const [idFile, setIdFile] = useState<File | null>(initialValues?.idFile ?? null);
  const [extraKind, setExtraKind] = useState<ExtraDocumentKind | "">(initialValues?.extraKind ?? "");
  const [extraFile, setExtraFile] = useState<File | null>(initialValues?.extraFile ?? null);
  const [fileError, setFileError] = useState<string | null>(null);

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
    const identityError = uploadError(idFile, "een foto van je identiteitskaart");
    if (identityError || !idFile) {
      setFileError(identityError ?? "Voeg een foto van je identiteitskaart toe.");
      return;
    }
    if (extraOptions.length > 0) {
      if (!extraKind || !extraOptions.some((option) => option.kind === extraKind)) {
        setFileError(documentSet === "exam" ? "Kies M18, M36 of Bijlage 4." : "Kies een theorieattest of M36.");
        return;
      }
      const extraError = uploadError(extraFile, "het document");
      if (extraError || !extraFile) {
        setFileError(extraError ?? "Voeg het document toe.");
        return;
      }
    }
    setFileError(null);
    onSubmit({
      ...values,
      nationalRegisterNumber: requiresNationalRegisterNumber ? values.nationalRegisterNumber : undefined,
      idFile,
      extraFile: extraOptions.length > 0 && extraFile ? extraFile : undefined,
      extraKind: extraOptions.length > 0 && extraKind ? extraKind : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <h1 className="mb-2 text-2xl font-extrabold text-[#111827]">Jouw gegevens</h1>
      <p className="text-sm text-[#58595b]">{documentIntro(documentSet)}</p>

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

      <label className="block text-sm font-medium">
        Foto identiteitskaart *
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.pdf,application/pdf"
          className={inputClass(false)}
          onChange={(event) => setIdFile(event.target.files?.[0] ?? idFile)}
        />
        {idFile && <p className="mt-1 text-sm text-[#58595b]">{idFile.name}</p>}
      </label>

      {extraOptions.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{documentSet === "exam" ? "M18, M36 of Bijlage 4 *" : "Theorieattest of M36 *"}</legend>
          <div className="flex flex-wrap gap-2">
            {extraOptions.map((option) => (
              <label key={option.kind} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-semibold ${extraKind === option.kind ? "border-[#ed1c24] bg-[#fff5f5] text-[#ed1c24]" : "border-black/10 text-[#111827]"}`}>
                <input
                  type="radio"
                  name="extraKind"
                  value={option.kind}
                  checked={extraKind === option.kind}
                  onChange={() => setExtraKind(option.kind)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.pdf,application/pdf"
            className={inputClass(false)}
            onChange={(event) => setExtraFile(event.target.files?.[0] ?? extraFile)}
          />
          {extraFile && <p className="text-sm text-[#58595b]">{extraFile.name}</p>}
        </fieldset>
      )}

      {fileError && <p className="text-sm text-[#ed1c24]">{fileError}</p>}

      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack} className="text-sm text-gray-500">&larr; Terug</button>
        <button type="submit" className="rounded-[10px] bg-[#ed1c24] px-6 py-3 font-semibold text-white transition hover:bg-[#111827]">
          Volgende
        </button>
      </div>
    </form>
  );
}
