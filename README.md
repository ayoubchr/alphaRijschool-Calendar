# Alpha Rijschool

Boekingsapp voor Alpha Rijschool: publieke site, pakket boeken met kalender en voorschot via Mollie (enkel bancontact), leerlingdossier, en een dashboard voor personeel.

- **Leerling** (`STUDENT`): inloggen op `/login`, lessen en tegoed op `/mijn-lessen`.
- **Instructeur** (`INSTRUCTOR`): eigen agenda en beschikbaarheid.
- **Beheerder** (`ADMIN`): alle agenda’s, boekingen, dossiers en rapporten op `/admin`.

Stack: Next.js, PostgreSQL (Prisma), Supabase Auth, Mollie, Resend.

## Starten

```bash
npm install
npm run dev
```

De site draait op [http://localhost:3000](http://localhost:3000). Inloggen als personeel: `/admin`.

## Belangrijk

> `APP_URL` moet een **publieke** URL zijn. Mollie stuurt de betaalstatus naar `/api/webhooks/mollie`; localhost is daarvoor niet bereikbaar.

Lokaal een tunnel opzetten en die URL in `APP_URL` zetten (zonder slash op het einde):

```bash
cloudflared tunnel --url http://localhost:3000
# of
ngrok http 3000
```

> Zet `APP_URL` op de tunnel-URL (bijv. `https://xxxx.trycloudflare.com`) en herstart de dev-server. Dezelfde URL wordt ook gebruikt voor de terugkeer na betaling en voor links in e-mails.
>
> Zet in Supabase onder Authentication → URL Configuration diezelfde URL als Site URL, en voeg ze toe aan de redirect-lijst. Blijft daar `http://localhost:3000` staan, dan landen auth-redirects op localhost. Bij een nieuwe tunnel-URL moet je dit opnieuw instellen.
>
> Het e-mailadres van de beheerder staat in `src/lib/site.ts` (`EMAIL`). Meldingen (zoals het contactformulier) gaan daarheen. Pas dat adres aan als je wil testen of mails aankomen, en zet het daarna terug.
