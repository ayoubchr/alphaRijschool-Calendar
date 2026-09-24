"use client";

import Image from "next/image";
import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PackageStep, type PackageDTO } from "./_components/PackageStep";
import { TransmissionStep } from "./_components/TransmissionStep";
import { CalendarStep, type BookingSlot } from "./_components/CalendarStep";
import { DetailsStep, type BookingDetails } from "./_components/DetailsStep";
import { SummaryStep } from "./_components/SummaryStep";

type Step = "package" | "transmission" | "calendar" | "details" | "summary";
type Transmission = "AUTOMAAT" | "MANUEEL";

export default function BookingWizardPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ed1c24]/20 border-t-[#ed1c24]" /></div>}>
      <BookingWizard />
    </Suspense>
  );
}

function BookingWizard() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("package");
  const [selectedPackage, setSelectedPackage] = useState<PackageDTO | null>(null);
  const [transmission, setTransmission] = useState<Transmission | null>(null);
  const [slot, setSlot] = useState<BookingSlot | null>(null);
  const [details, setDetails] = useState<BookingDetails | null>(null);

  const preselectedPackageId = searchParams.get("package");
  const didApplyPreselect = useRef(false);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 grid items-center gap-4 md:grid-cols-[1fr_220px]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-red">Online inschrijven</p>
          <h1 className="mt-2 text-3xl font-extrabold text-brand-navy md:text-4xl">Boek je les</h1>
          <p className="mt-2 max-w-xl text-brand-gray">
            Kies een pakket, een moment en betaal je voorschot. Je plek is pas vast na betaling.
          </p>
        </div>
        <Image
          src="/illustraties/hero-contact.png"
          alt=""
          width={640}
          height={360}
          className="hidden h-auto w-full md:block"
        />
      </div>
      <ol className="mb-8 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide text-brand-gray">
        {(
          [
            ["package", "Pakket"],
            ["transmission", "Transmissie"],
            ["calendar", "Moment"],
            ["details", "Gegevens"],
            ["summary", "Bevestigen"],
          ] as const
        ).map(([id, label], index) => (
          <li
            key={id}
            className={`rounded-full px-3 py-1 ${step === id ? "bg-[#ed1c24] text-white" : "bg-[#f9f9f9]"}`}
            aria-current={step === id ? "step" : undefined}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>
      {step === "package" && (
        <PackageStep
          selectedPackageId={selectedPackage?.id ?? null}
          onPackagesLoaded={(packages) => {
            if (didApplyPreselect.current || !preselectedPackageId) return;
            const match = packages.find((pkg) => pkg.id === preselectedPackageId);
            if (!match) return;
            didApplyPreselect.current = true;
            setSelectedPackage(match);
            setStep("transmission");
          }}
          onSelect={(pkg) => {
            setSelectedPackage(pkg);
            setTransmission(null);
            setSlot(null);
            setStep("transmission");
          }}
        />
      )}
      {step === "transmission" && selectedPackage && (
        <TransmissionStep
          selectedPackage={selectedPackage}
          onSelect={(t) => {
            setTransmission(t);
            setStep("calendar");
          }}
          onBack={() => setStep("package")}
        />
      )}
      {step === "calendar" && selectedPackage && transmission && (
        <CalendarStep
          packageId={selectedPackage.id}
          transmission={transmission}
          onConfirm={(chosenSlot) => {
            setSlot(chosenSlot);
            setStep("details");
          }}
          onBack={() => setStep("transmission")}
        />
      )}
      {step === "details" && selectedPackage && (
        <DetailsStep
          requiresNationalRegisterNumber={!selectedPackage.isSingleLesson}
          initialValues={details}
          onSubmit={(d) => {
            setDetails(d);
            setStep("summary");
          }}
          onBack={() => setStep("calendar")}
        />
      )}
      {step === "summary" && selectedPackage && transmission && slot && details && (
        <SummaryStep
          selectedPackage={selectedPackage}
          transmission={transmission}
          slot={slot}
          details={details}
          onBack={() => setStep("details")}
        />
      )}
    </div>
  );
}
