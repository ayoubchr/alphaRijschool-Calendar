# Alpha Rijschool — booking-applicatie met kalender + voorschot

- Datum: 2026-09-22
- Status: goedgekeurd door opdrachtgever, klaar voor implementatieplan

## 1. Doel en context

Alpha Rijschool heeft vandaag een statische WordPress-marketingsite (`alpha-rijschool-theme`)
zonder werkende boekingsfunctionaliteit — elke "Boek nu"-knop verwijst naar een statisch
contactformulier. Dit project vervangt die site door een nieuwe, volledig werkende
webapplicatie waarin een leerling zelf een rijles/pakket kan boeken via een kalender en
daarbij een voorschot betaalt via Bancontact.

De functionele flow is geïnspireerd op het boekingsplatform van een andere rijschool
(BIQS Drive, `antwerpse.biqsdrive.be`) — enkel qua **stappen, velden en logica**. Er wordt
geen tekst, merk, vormgeving of broncode van dat platform of van "Antwerpse Rijschool"
overgenomen; alle content, teksten en het ontwerp van deze applicatie zijn eigen aan
Alpha Rijschool.

### Referentieflow (functioneel, ter inspiratie)
1. Opleiding/categorie kiezen
2. Locatie / sessie / concreet pakket kiezen
3. Lesblokken kiezen in een kalender (filter op weekdag/instructeur, met validatie op
   min/max aantal, overlap en dagmaximum)
4. Verplichte/optionele artikelen
5. Bijkomende vragen
6. Uitgebreid inschrijvingsformulier
7. Samenvatting + akkoord voorwaarden → doorverwijzing naar betaalpagina voor het voorschot

## 2. Scope van deze applicatie

**In scope (MVP):**
- Publieke marketingpagina's: Home, Over ons, Theorie, Tarieven + Pakketten, FAQ, Contact
  (zelfde informatie-architectuur en content als het bestaande theme, herbouwd in React).
- Boekingswizard zonder account (gastboeking): pakket kiezen → transmissie kiezen →
  les(sen) inplannen via kalender → gegevens invullen → samenvatting/akkoord → betaling
  voorschot via Mollie/Bancontact.
- Leerling-dossier zonder wachtwoord: toegang via magic link per e-mail, met overzicht
  van resterend pakket-tegoed en geplande lessen, en de mogelijkheid nieuwe lessen uit
  het tegoed in te plannen zonder nieuw voorschot.
- Instructeur/beheerder-dashboard met login: agenda, beschikbaarheid beheren, boekingen
  bevestigen/verzetten/annuleren, dossiers en betaalstatus inzien.
- Mollie-integratie voor Bancontact-betalingen (voorschot) + webhook-verwerking.
- Transactionele e-mail (bevestiging + magic link) via een gratis e-mailprovider (Resend).

**Buiten scope (latere iteratie, niet nu bouwen):**
- SMS-herinneringen.
- Online theorie-oefenexamens.
- Multi-rijschool/SaaS-ondersteuning (dit is één applicatie voor één rijschool).
- Review-/testimonial-beheer via CMS, blogfunctionaliteit.
- Volledig configureerbaar annuleringsbeleid (zie §7 voor de MVP-default).

## 3. Architectuur

Eén Next.js-project (App Router, TypeScript) dat zowel de publieke site, de
boekingswizard, het leerlingdossier als het beheerdersdashboard bevat, met Next.js
route handlers / server actions als backend. Eén PostgreSQL-database.

- **Frontend**: React via Next.js, eigen visueel ontwerp (rood/zwart/wit zoals het
  bestaande Alpha-merk, maar geen 1-op-1 overname van CSS-bestanden — herbouwd).
- **Backend**: Next.js server actions/route handlers, Node.js runtime.
- **Database**: PostgreSQL (gratis tier via Neon of Supabase).
- **Betalingen**: Mollie API (Bancontact + iDEAL), via de officiële Mollie Node-SDK.
- **E-mail**: Resend (gratis tier) voor bevestigingen en magic links.
- **Kalender-UI**: `react-big-calendar` (MIT-licentie, gratis) voor weergave; alle
  sloten-berekening, overlap-preventie en tegoedlogica is eigen backend-code — er
  bestaat geen kant-en-klare gratis provider die het pakket/voorschot-model ondersteunt.
- **Hosting**: Vercel (gratis hobby-tier, native Next.js-ondersteuning).

## 4. Datamodel

```
packages
  id, name, description, hours, price_automaat, price_manueel,
  registration_fee, is_single_lesson (bool), active

instructors
  id, name, transmission ('automaat' | 'manueel' | 'both'), active

availability_rules
  id, instructor_id, weekday (0-6), start_time, end_time

availability_exceptions
  id, instructor_id, date, start_time, end_time, is_available (bool)
  -- voor verlof (is_available=false) of eenmalige extra beschikbaarheid

dossiers
  id, email, first_name, last_name, phone, address,
  date_of_birth, national_register_number (nullable, versleuteld/afgeschermd),
  package_id, transmission, hours_remaining, created_at

magic_links
  id, dossier_id, token (uniek, random), expires_at, used_at

lessons
  id, dossier_id, instructor_id, package_id, start_at, end_at,
  status ('planned' | 'confirmed' | 'cancelled' | 'completed')
  -- DB-constraint: geen overlappende lessons per instructor_id

payments
  id, dossier_id, mollie_payment_id, amount, type ('deposit' | 'balance'),
  status ('open' | 'paid' | 'failed' | 'refunded'), created_at
```

Overlap tussen `lessons` per instructor wordt afgedwongen met een PostgreSQL
exclusion constraint (`EXCLUDE USING gist`) op `(instructor_id, tsrange(start_at, end_at))`,
zodat dit nooit enkel in applicatiecode leeft.

## 5. Boekingsflow (detail)

1. **Pakket + transmissie kiezen** — vanaf de tarievenpagina (pakket voorgeselecteerd) of
   rechtstreeks in de wizard. Prijs wordt getoond incl. inschrijvingskosten.
2. **Les(sen) inplannen** — kalenderweergave toont enkel sloten die vallen binnen een
   `availability_rule`, niet vallen binnen een `availability_exception` (verlof), en niet
   overlappen met een bestaande `lesson`. Filters: weekdag, instructeur. Bij een
   meerurenpakket kan de leerling meteen 1 of meerdere blokken kiezen tot aan het
   pakket-tegoed.
3. **Gegevens invullen** — naam, adres, e-mail, telefoon, geboortedatum verplicht;
   rijksregisternummer enkel gevraagd (en apart, duidelijk gemarkeerd) wanneer het
   gekozen pakket dat wettelijk vereist (bv. rijbewijsaanvraag-gerelateerde pakketten).
4. **Samenvatting + akkoord** — eigen algemene voorwaarden en annuleringsbeleid (§7),
   checkbox verplicht vóór verdergaan.
5. **Betaling** — server maakt een Mollie-payment aan voor het voorschotbedrag
   (= prijs van de "Losse Rijles (2u)" volgens gekozen transmissie, of het
   theorie-pakket bij een theorie-inschrijving) en stuurt de leerling naar de
   Mollie-betaalpagina (Bancontact).
6. **Bevestiging** — Mollie-webhook zet `payments.status = paid`, maakt/werkt het
   `dossier` bij, bevestigt de gekozen `lessons` (`status = confirmed`), trekt het
   ingeplande aantal uren af van `hours_remaining`, en verstuurt een bevestigingsmail
   met een magic link naar het dossier.
7. **Dossierpagina** (via magic link, geen wachtwoord) — toont resterend tegoed,
   geplande/afgeronde lessen, en laat toe nieuwe lessen in te plannen zolang
   `hours_remaining > 0`, zonder nieuw voorschot (rechtstreeks bevestigd, geen betaalstap).

## 6. Instructeur/beheerder-dashboard

Login met e-mail + wachtwoord (personeel, niet leerlingen; simpele credentials-based
auth, bv. via `next-auth` met een credentials-provider).

- Agenda (dag/week) van eigen of alle instructeurs (rolafhankelijk: instructeur ziet
  enkel eigen agenda, beheerder ziet alles).
- Beschikbaarheid beheren (`availability_rules` en `availability_exceptions`).
- Boekingen bevestigen, verzetten (nieuwe `start_at`/`end_at`, met dezelfde
  overlap-constraint) of annuleren.
- Dossieroverzicht: leerling, pakket, resterend tegoed, betaalstatus.
- Eenvoudig rapport: aantal boekingen en ontvangen voorschotten per week/maand.

## 7. Annuleringsbeleid (MVP-default)

Annuleren kan tot 48 uur voor de geplande les; het voorschot blijft dan geldig voor een
nieuwe afspraak. Bij annuleren binnen 48 uur, of niet komen opdagen, vervalt het
voorschot. Dit bedrag/deze termijn is een configuratiewaarde, geen hard-coded regel.

**Let op:** dit is geen juridisch advies. De uiteindelijke tekst van de algemene
voorwaarden (inclusief het wettelijk herroepingsrecht bij online diensten) moet voor
publicatie nagekeken worden door iemand met juridische kennis.

## 8. Niet-functionele aandachtspunten

- **Persoonsgegevens (GDPR)**: rijksregisternummer en medische informatie zijn
  gevoelige gegevens — enkel opvragen wanneer strikt nodig, versleuteld opslaan,
  duidelijke privacyverklaring, en een bewaartermijn/verwijderprocedure voorzien.
- **Beveiliging**: magic links zijn eenmalig en verlopen na een beperkte tijd (bv. 24u);
  Mollie-webhook-signatures worden geverifieerd; alle formulieren server-side
  gevalideerd (niet enkel client-side).
- **E-mail-deliverability**: SPF/DKIM correct instellen voor het verzenddomein via Resend.

## 9. Openstaande vragen voor later (expliciet uitgesteld, geen blokkade voor MVP)

- Exacte annuleringstermijn/-percentage (nu: 48u-default, zie §7).
- Of het instructeursdashboard per instructeur een eigen login krijgt of enkel de
  rijschool-eigenaar toegang heeft (nu: rolgebaseerd voorzien in het datamodel, invulling
  tijdens implementatie/oplevering).
