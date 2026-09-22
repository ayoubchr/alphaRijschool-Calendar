export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-6 text-3xl font-extrabold">Contact</h1>
      <ul className="space-y-2 text-gray-600">
        <li><strong>Telefoon:</strong> +32 486 29 53 75</li>
        <li><strong>E-mail:</strong> rijschoolalpha@gmail.com</li>
        <li><strong>Adres:</strong> Turnhoutsebaan 76B, 2100 Antwerpen</li>
      </ul>
      <p className="mt-6 text-gray-600">
        Wil je meteen een les inplannen? Ga naar <a href="/boeken" className="text-red-600 underline">de boekingspagina</a>.
      </p>
    </div>
  );
}
