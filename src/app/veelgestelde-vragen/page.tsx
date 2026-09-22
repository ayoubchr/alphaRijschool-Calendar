const faqs = [
  { q: "Wat is een M12?", a: "Een voorlopig rijbewijs dat je kan behalen na 6 uur verplichte rijlessen bij een erkende rijschool. Het is 12 maanden geldig." },
  { q: "Wat is een stageattest?", a: "Een stageattest bevestigt dat je de 20 uur verplichte praktijklessen hebt gevolgd, waarmee je een voorlopig rijbewijs (M18) kan aanvragen." },
  { q: "Hoeveel lessen moet ik nemen?", a: "Dat verschilt van leerling tot leerling en hangt af van je rijervaring en het gekozen traject." },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-6 text-3xl font-extrabold">Veelgestelde vragen</h1>
      <div className="space-y-4">
        {faqs.map((faq) => (
          <details key={faq.q} className="rounded-lg bg-gray-100 p-4">
            <summary className="cursor-pointer font-semibold">{faq.q}</summary>
            <p className="mt-2 text-gray-600">{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
