"use client";

import { type FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Ongeldige combinatie van e-mail en wachtwoord.");
      return;
    }
    router.push("/admin/agenda");
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-4 py-24">
      <h1 className="text-2xl font-bold">Beheerder aanmelden</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input name="email" type="email" placeholder="E-mail" required className="w-full rounded border p-3" />
      <input name="password" type="password" placeholder="Wachtwoord" required className="w-full rounded border p-3" />
      <button type="submit" className="w-full rounded-full bg-red-600 px-6 py-3 font-semibold text-white">Aanmelden</button>
    </form>
  );
}
