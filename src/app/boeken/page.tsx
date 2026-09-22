"use client";

import { Suspense, useState } from "react";
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
    <Suspense fallback={<div className="mx-auto max-w-2xl px-6 py-12">Laden...</div>}>
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

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {step === "package" && (
        <PackageStep
          preselectedPackageId={preselectedPackageId}
          onSelect={(pkg) => {
            setSelectedPackage(pkg);
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
