export default function BookingLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6">
      <div
        className="h-11 w-11 animate-spin rounded-full border-4 border-[#ed1c24]/20 border-t-[#ed1c24]"
        role="status"
        aria-label="Pagina laden"
      />
      <p className="text-sm font-medium text-[#58595b]">De boekingspagina wordt geladen…</p>
    </div>
  );
}
