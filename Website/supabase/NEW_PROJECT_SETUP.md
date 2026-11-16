# Website forms: move to the new Supabase project (16 Nov 2026)

The website's old Supabase project, `umvsromotyjbrzykmqoh`, is paused, so its address no longer resolves. Every
form (Contact, Become a Pet Buddy, Careers) calls its `submit-form` function, fails, and shows "We couldn't reach
our server just now…". The new project is `fazxqwlaxrahqpojousl`, on the new Supabase login.

Steps 1–3 are yours, in the new login. Step 4 is mine, and the website goes live only when you say push.

## 1. Database (SQL editor, about 1 minute)

Dashboard → project `fazxqwlaxrahqpojousl` → SQL Editor → New query → paste all of
`Website/supabase/SETUP_new_project.sql` → Run.

It creates the three `website_*` tables (RLS on, no policies, so only the server can read or write them), the
private `resumes` bucket and the public `site-media` bucket. Running it twice is harmless. It was tested on an
empty Postgres on 16 Nov, run twice.

## 2. The `submit-form` function (terminal)

Run these from the `Petlife web/Petlife-web/Website` folder:

```powershell
npx supabase login
npx supabase functions deploy submit-form --project-ref fazxqwlaxrahqpojousl --no-verify-jwt
```

- `supabase login` opens the browser: sign in with the **new** account.
- `--no-verify-jwt` is required. The page sends the publishable key (`sb_publishable_…`), which is not a JWT, so
  with JWT checking on, every request would be refused before it reaches the function.

## 3. The email secret (dashboard)

Dashboard → Edge Functions → Secrets → add:

| Name | Value |
|---|---|
| `RESEND_API_KEY` | a Resend API key that can send from `petlifeindia.co` (Resend dashboard → API Keys) |
| `NOTIFY_FROM` | optional; default `Petlife <website@petlifeindia.co>` |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided by Supabase automatically; don't add them. Type the
Resend key only into the dashboard, never into a file or a chat.

Without `RESEND_API_KEY`, submissions are still saved, but no notification email reaches info@ or hr@.

## 4. Point the website at the new project (me, after you send the key)

Send me the **publishable** key: Dashboard → Project Settings → API Keys → Publishable key (`sb_publishable_…`).
It is public by design (it is in every visitor's browser), so it is fine to paste. Don't send the secret key or
the service-role key.

I change `Website/js/config.js` (`SUPABASE_URL` → `https://fazxqwlaxrahqpojousl.supabase.co`, plus the key),
commit, and push only when you say so. Pushing `main` deploys the site through Cloudflare in about a minute.

## 5. Check after the push

```powershell
curl.exe -s -o NUL -w "%{http_code}`n" -X OPTIONS -H "Origin: https://petlifeindia.co" https://fazxqwlaxrahqpojousl.supabase.co/functions/v1/submit-form
```

Expect `200` or `204`. Then send one Contact form from petlifeindia.co, and check that the row is in
Table Editor → `website_contact_messages` and that the email reached info@petlifeindia.co.

## Two things to know

- **The old submissions are still in the paused project.** Contact messages, Pet Buddy applications and résumés
  sent before the pause are not copied. A paused free project can be restored from its dashboard if a free slot
  is available, or its backup downloaded from the dashboard, but only for a limited time after the pause.
- **Free projects also pause after about a week with no activity.** The website forms get little traffic, so the
  new project can pause the same way. The usual fixes are the Pro plan or a scheduled weekly request that keeps
  the project active.
