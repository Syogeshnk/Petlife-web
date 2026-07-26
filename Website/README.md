# Petlife — Marketing Website

The public marketing site for the Petlife app, built for **petlifeindia.co**.
Static HTML/CSS/JS — no build step, no framework. Deploy this folder as-is to any
static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3).

## Files

| Path | Purpose |
|---|---|
| `index.html` | Landing page — hero, services, how-it-works, join form, contact form |
| `careers.html` | Careers page: 4 internship roles + application form with resume upload |
| `terms.html` | Terms & Conditions |
| `privacy.html` | Privacy Policy |
| `disclaimer.html` | Platform Disclaimer (plain-language liability position) |
| `css/styles.css` | All styles. Design tokens at the top |
| `js/config.js` | **Edit this** — Supabase credentials + public contact details |
| `js/main.js` | Scroll reveals, paw trail, counters, role toggle, nav, FAQ, form submission |
| `petlife/logo.png` | The single authorised brand asset, served from this local path only (see `petlife/README.md`) |
| `petlife/logo-master.jpg` | Untouched master supplied by the brand owner |
| `supabase/migrations/` | SQL for the three form tables + private resume bucket |
| `supabase/functions/submit-form/` | Edge function: validates, stores, emails |

## Brand

All colour is driven by the token block at the top of `css/styles.css`:

| Token | Value | Used for |
|---|---|---|
| `--primary` | `#1D6B3C` | Logo text, links, active borders, key icons |
| `--primary-dark` | `#185632` | CTA gradient end, footer, dark hovers |
| `--primary-light` | `#2D6B43` | CTA gradient start |
| `--success` | `#38B34A` | Status dots, verified indicators |
| `--light-green` | `#DDEBDD` | Pills, selected/subtle backgrounds |
| `--surface-bg` | `#F5F8F4` | Alternating section backgrounds |
| `--bg-white` | `#FFFFFF` | Page background |
| `--text-primary` / `--text-secondary` / `--text-placeholder` | `#2F343A` / `#68717A` / `#9AA3AA` | Text hierarchy |
| `--border-color` | `#E3E6E3` | Card borders, inputs |
| `--btn-gradient` | `135deg #2D6B43 → #185632` | Primary buttons |

One value sits outside the brief: `--star: #E0A63F`, used **only** for star
glyphs in ratings — green stars misread as something other than a rating.
Change it in `:root` if you'd rather it be green.

- **Type**: Fraunces (display) + Figtree (body) + Caveat (script accent, used
  only for the poster taglines). The app itself uses system fonts; the website
  is deliberately more expressive.
- **Signature element**: the "Garden Walk" — a paw-print trail in the
  how-it-works section that draws itself as you scroll.
- The hero phone is a pure-CSS rebuild of the real app home screen. Update it
  if the app's home screen changes.
- Poster copy reused verbatim: "Care · Love · Trust", "New beginnings ·
  Stronger bonds · Happier tails", "One platform. Many services. Unlimited
  love.", "That's Petlife".

## Motion

Deliberately restrained — nothing loops continuously except one status pulse.

- **Scroll-in**: `opacity 0→1` + `translateY(12px)→0`, `0.6s cubic-bezier(0.16, 1, 0.3, 1)`.
  Add the `reveal` class to any new element to opt in.
- **Buttons**: `translateY(-2px)` and a slightly stronger shadow on hover.
- **Cards** (service, bento, quote, role, FAQ): `border-color` transitions to
  `--primary` over `0.25s`.
- **Status dots**: `.dot` pulses `scale(1) → scale(1.2)` at low opacity over
  `2.5s`. This and the role toggle are the only repeating motion on the site.
- **Dual-role toggle** (`#roleToggle` in the "Why Petlife" bento): the pill
  glides between Pet Parent and Pet Buddy every 3.2s to demonstrate the
  switch-roles feature. It only runs while the card is on screen
  (IntersectionObserver), and hovering either option takes manual control.
- **Testimonials** are a single non-wrapping row (`flex-wrap: nowrap;
  overflow-x: auto`) with scroll snapping. Card width is deliberately under a
  clean third so the next card peeks in and the row reads as scrollable.
- `prefers-reduced-motion` disables all of it.

## Copy conventions

- A pet owner is always a **Pet Parent** (capitalised, like **Pet Buddy**).
  Never "pet owner" or "user".
- Em dashes are avoided in headings and microcopy; use colons, commas or full
  stops instead. The one exception is the official tagline,
  **"Happy Pet, Happy Life — Petlife"**, which keeps its dash.
- The tagline appears in the hero (as a script accent under the H1), the page
  `<title>`, the Open Graph title, and the final CTA.

## Making the forms live

All three forms (contact, Pet Buddy application, job application) save to
Postgres **and** email the team. Until credentials are set they show a fallback
message pointing at the phone number and email; they never fail silently.

1. **Create a Supabase project** (or reuse the Petlife app's project).
2. **Run the migrations** (creates all three tables and the `resumes` bucket):
   ```bash
   supabase link --project-ref <your-ref>
   supabase db push
   ```
3. **Set the email secrets.** Email goes out via [Resend](https://resend.com)
   (free tier is plenty). Verify `petlifeindia.co` as a sending domain first:
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxx
   supabase secrets set NOTIFY_FROM="Petlife <website@petlifeindia.co>"
   ```
4. **Deploy the function** (public — no JWT, it's a public form):
   ```bash
   supabase functions deploy submit-form --no-verify-jwt
   ```
5. **Fill in `js/config.js`** with your Project URL and the **anon** key
   (Project Settings → Data API). The anon key is safe in the browser.

Where submissions go:

| Form | Table | Email to |
|---|---|---|
| Contact us (`index.html`) | `website_contact_messages` | `info@petlifeindia.co` |
| Join as a Pet Buddy (`index.html`) | `website_buddy_applications` | `hr@petlifeindia.co` |
| Job application (`careers.html`) | `website_job_applications` | `hr@petlifeindia.co` |

Pet Buddy experience is captured as `experience_years` 0–5 (5 means "5+").
Careers experience is a separate `experience_level` band:
`fresher | lt3 | 3to6 | 6to10 | 10plus`.

Read submissions any time in the Supabase Table Editor. If `RESEND_API_KEY`
isn't set, rows are still saved — only the email is skipped, and `email_sent`
stays `false` so you can spot them.

**Resumes**: uploaded files go to a **private** `resumes` storage bucket (created
by the migration, no public policies). The database row stores only the object
path; the HR notification email carries the file as an attachment. Limits are
4 MB and `.pdf` / `.doc` / `.docx`, enforced in the browser *and* again in the
edge function. If the database insert fails after upload, the function deletes
the orphaned file.

### Security notes

- Both tables have RLS enabled with **no policies**, and privileges are revoked
  from `anon`/`authenticated`. Only the edge function (service role) can read or
  write them — the browser never touches the tables directly.
- The function re-validates every field server-side; browser validation is only
  for fast feedback.
- A hidden honeypot field silently drops bots, and CORS is restricted to
  `petlifeindia.co` plus localhost.

## Contact details baked into the site

Phone `+91 84510 72388` · `info@petlifeindia.co` · `hr@petlifeindia.co` ·
Instagram [@petlife_india](https://www.instagram.com/petlife_india).
All of these also live in `js/config.js` — update them there **and** in the
markup if they change.

## Images

Pet photos are hotlinked from Unsplash ([Unsplash
License](https://unsplash.com/license), free to use). All URLs verified live.
The on-page attribution line was removed at the client's request; the Unsplash
License does not require credit, so this is fine.

For production, consider downloading them into an `img/` folder and updating the
`src` attributes so the site doesn't depend on a third-party CDN.

**Note on the "Indian aesthetic" photos**: Momo (puppy on a brightly woven rug),
Mango (ginger cat in warm golden light) and Laddu (pug in a marigold cap) were
chosen for warm, vibrant, textile-rich tones. They are *warm-toned*, not
verifiably Indian interiors, because Unsplash's free library has little
authentic Indian home-decor pet photography. Swapping in your own photos would
be a straight `src` replacement in the `.gallery__grid` block.

## Legal pages

Three pages, linked from a **Legal** column in the footer and from the footer
bottom bar on every page. A short platform notice also sits above the footer
bottom bar site-wide, and each form links to the relevant policy.

They all say the same thing in different registers: **Petlife is a listing
platform, not a service provider.** Specifically:

- Pet Buddies are **independent contractors**, not employees, agents or partners.
  Petlife does not employ, supervise, direct, schedule or control them.
- A booking is a contract **between the Pet Parent and the Pet Buddy**.
  Petlife is not a party to it.
- Petlife **does not accept responsibility or liability** for the services
  individual providers deliver, or for disputes and payments between users
  (`terms.html#liability`, `disclaimer.html#responsibility`).
- Verification confirms **identity only** — it is not an endorsement or a
  guarantee of quality.
- Payment is direct to the Pet Buddy; Petlife never holds or refunds it.
- Petlife currently takes **0% commission** and **expressly reserves the right to
  introduce a commission or platform fee in future, at its sole discretion**,
  with advance notice and never applied retroactively to a confirmed booking
  (`terms.html#fees`, `disclaimer.html#payments`).

Drafted in formal legalese at the client's direction (26 July 2026), and
incorporating the client's own specified clauses: exclusive jurisdiction of the
**District Court of Ahmednagar, Maharashtra**; a **₹10,000 aggregate liability
cap**; the Pet Parent's **non-delegable pre-service verification onus**;
**mandatory disclosure of behavioural and bite history** (failure being a
material breach); a **reciprocal vigilance and reporting protocol**; and
**absolute unilateral suspension/deletion rights**.

> **These pages are a starting draft, not legal advice.** I am not a lawyer.
> Have them reviewed by a qualified Indian lawyer before you rely on them.
> Three points in particular are worth raising with counsel, because Indian
> courts may not enforce them as drafted:
>
> 1. A **₹10,000 cap** is unlikely to bind a consumer claim under the Consumer
>    Protection Act, 2019, and an unconscionably low cap risks the whole clause
>    being struck down rather than merely reduced.
> 2. **Exclusive jurisdiction at Ahmednagar** does not displace a consumer's
>    statutory right to file where they reside or work. Clause 22.4 says so
>    explicitly, which is safer than pretending otherwise.
> 3. **Suspension without notice or reasons** and **"final determination rests
>    with the Company"** on data erasure sit awkwardly against DPDP Act erasure
>    duties and natural-justice expectations. The savings clause at 14.5 is
>    deliberately included so that if one limb falls, the rest survives.

**Placeholders you must fill in before launch** — search for `[` in the three
files:

| Placeholder | Appears in |
|---|---|
| `[registered company name]` | `terms.html` cl. 1.1, 2.1, 23.2; `privacy.html` §1 |
| `[registered office address]` | `terms.html` cl. 2.1, 23.2; `privacy.html` §1, §14 |
| `[Grievance Officer name]` | `privacy.html` §14 |

Jurisdiction is now fixed as the District Court of Ahmednagar, Maharashtra
(`terms.html` cl. 22.2), so there is no longer a `[city]` placeholder.

> **Note on the supplied draft:** it referred to the operator as "NeuralPath"
> with a contact of `support@neuralpath.app`. That appears to be carried over
> from a different project, and the same draft refers to "Petlife" elsewhere, so
> the pages use **Petlife** and `info@petlifeindia.co` throughout. Tell me if
> NeuralPath is in fact the registered entity and I will switch it.

Also confirm the retention periods in `privacy.html` §8 match what you actually
do, and the DPDP grievance timelines in §14.

## Before launch

- **App store buttons** currently read "Coming soon on Google Play / App Store"
  and are non-clickable `<span>`s in `#download` and the footer. At launch,
  swap each `<span class="store-btn">` for an `<a href="…">`, change the `<em>`
  text back to "Get it on" / "Download on the", and drop the "Launching soon"
  `soon-tag` and the copy referencing it in the FAQ ("When is the app launching?").
- Replace the trust-strip numbers (`data-count` in `index.html`) with live
  figures — currently 300+ Buddies, 12 cities, 4,000+ pets, 4.6 rating.
- Confirm the domain: the site uses **petlifeindia.co** throughout, matching the
  `@petlifeindia.co` email addresses. Switch to `.com` if that's the real domain.
