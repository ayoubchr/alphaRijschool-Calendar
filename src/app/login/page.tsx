"use client";

import { FormEvent, useState } from "react";
import { requestLoginLink } from "./actions";

export default function LoginPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const email = String(new FormData(event.currentTarget).get("email") ?? "");
      await requestLoginLink(email);
      setSent(true);
    } catch {
      setError("De link kon niet worden verstuurd. Probeer het opnieuw.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 text-3xl font-extrabold text-[#111827]">Mijn lessen</h1>
      <p className="mb-6 text-sm text-[#58595b]">Vul het e-mailadres van je inschrijving in. Je krijgt een link om in te loggen.</p>
      {sent ? (
        <p className="rounded-[10px] bg-[#f9f9f9] p-4 text-sm">Als er een dossier op dit adres staat, staat de link in je mailbox.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm font-medium">
            E-mail
            <input name="email" type="email" required className="mt-1 w-full rounded-[10px] border border-black/10 px-3 py-2" />
          </label>
          {error && <p className="text-sm text-[#ed1c24]">{error}</p>}
          <button disabled={pending} className="rounded-[10px] bg-[#ed1c24] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {pending ? "Bezig..." : "Stuur inloglink"}
          </button>
        </form>
      )}
    </div>
  );
}
