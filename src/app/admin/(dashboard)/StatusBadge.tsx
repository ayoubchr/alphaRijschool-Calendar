const LABELS: Record<string, string> = {
  PLANNED: "Gepland",
  CONFIRMED: "Bevestigd",
  CANCELLED: "Geannuleerd",
  COMPLETED: "Afgerond",
  OPEN: "Open",
  PAID: "Betaald",
  FAILED: "Mislukt",
  REFUNDED: "Terugbetaald",
};

const TONES: Record<string, string> = {
  PLANNED: "bg-amber-50 text-amber-800",
  CONFIRMED: "bg-emerald-50 text-emerald-800",
  CANCELLED: "bg-neutral-100 text-neutral-600",
  COMPLETED: "bg-[#111827] text-white",
  OPEN: "bg-amber-50 text-amber-800",
  PAID: "bg-emerald-50 text-emerald-800",
  FAILED: "bg-red-50 text-[#ed1c24]",
  REFUNDED: "bg-neutral-100 text-neutral-600",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[status] ?? "bg-[#f9f9f9] text-[#58595b]"}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
