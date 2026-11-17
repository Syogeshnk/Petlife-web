# Website forms: move to the new Supabase project, step by step

**Why the forms fail:** the website's old Supabase project, `umvsromotyjbrzykmqoh`, is paused, and its address
no longer resolves. All three forms (Contact, Become a Pet Buddy, Careers) send to a function called
`submit-form` on that project. The request never arrives, so the page shows "We couldn't reach our server just
now…".

**What we're doing:** the same backend set up again on the new project, `fazxqwlaxrahqpojousl`, on your new
Supabase login.

| Step | Who | Time |
|---|---|---|
| 0. Open the new project | you | 1 min |
| 1. Create the tables (SQL) | you | 2 min |
| 2. Install and log in to the Supabase CLI | you | 3 min |
| 3. Deploy the `submit-form` function | you | 2 min |
| 4. Add the email key | you | 3 min |
| 5. Test the function directly | you | 2 min |
| 6. Send me the publishable key | you | 1 min |
| 7. Point the website at the new project | me | – |
| 8. Push and check the live site | your go, then both | 5 min |

The commands below are for **Windows PowerShell**. In VS Code: Terminal → New Terminal.

The CLI outputs shown are what Supabase CLI 3.2.0 prints, give or take; small wording differences between
versions are normal. The SQL results are exact: the script was run on an empty database on 16 Nov 2026.

---

## Step 0. Open the new project

Open: <https://supabase.com/dashboard/project/fazxqwlaxrahqpojousl>

**You should see:** the project home page, with the name you gave it at the top and a green "Healthy" (or no
warning banner).

**If you see "Project not found" or are asked to sign in:** you're in the old account. Sign out (top-right avatar
→ Sign out), sign in with the new account, and open the link again.

---

## Step 1. Create the tables (SQL editor)

1. Open the SQL editor: <https://supabase.com/dashboard/project/fazxqwlaxrahqpojousl/sql/new>
2. In VS Code, open `Petlife web/Petlife-web/Website/supabase/SETUP_new_project.sql`, press **Ctrl+A**, then
   **Ctrl+C**.
3. Click in the SQL editor, press **Ctrl+V**, then click **Run** (or **Ctrl+Enter**).

**You should see:** `Success. No rows returned` at the bottom.

If a box asks you to confirm a query that changes the database ("This query contains destructive
operations" or similar), click **Run this query**. The script only creates things; it deletes nothing.

### 1a. Check it worked

Open a new query tab (**+** next to the tab), paste this, and click Run:

```sql
select table_name from information_schema.tables
where table_schema = 'public' and table_name like 'website_%' order by 1;
```

**You should see 3 rows:**

| table_name |
|---|
| website_buddy_applications |
| website_contact_messages |
| website_job_applications |

Then this:

```sql
select id, public from storage.buckets where id in ('resumes', 'site-media') order by 1;
```

**You should see 2 rows:**

| id | public |
|---|---|
| resumes | false |
| site-media | true |

And this, which checks that the tables are locked (only the server can use them):

```sql
  select relname, relrowsecurity from pg_class
  where relname like 'website_%' and relkind = 'r' order by 1;
```

**You should see `true` in all 3 rows:**

| relname | relrowsecurity |
|---|---|
| website_buddy_applications | true |
| website_contact_messages | true |
| website_job_applications | true |

You can also see the tables at <https://supabase.com/dashboard/project/fazxqwlaxrahqpojousl/editor> and the
buckets at <https://supabase.com/dashboard/project/fazxqwlaxrahqpojousl/storage/buckets>.

**If you see `ERROR: relation ... already exists` or `duplicate key`:** you can ignore it; running the script
twice is harmless. Any other error: copy the full message to me.

---

## Step 2. Install and log in to the Supabase CLI

### 2a. Go to the website folder

```powershell
cd "E:\Pet_Life_India\Petlife web\Petlife-web\Website"
```

**You should see:** the prompt change to `PS E:\Pet_Life_India\Petlife web\Petlife-web\Website  >`.

Check that the function is there:

```powershell
Test-Path .\supabase\functions\submit-form\index.ts
```

**You should see:** `True`

### 2b. Check Node is installed

```powershell
node --version
```

**You should see:** `v24.20.0` (any `v18` or newer is fine).

**If you see "node is not recognized":** install Node LTS from <https://nodejs.org>, close and reopen the
terminal, and start again at 2a.

### 2c. Check the CLI runs

```powershell
npx.cmd supabase@3.2.0 --version
```

**The first time you'll see:**

```
Need to install the following packages:
supabase@3.2.0
Ok to proceed? (y)
```

Type `y` and press Enter. **Then you should see:** `3.2.0`

(`npx.cmd supabase@3.2.0` runs that exact version without installing anything globally. Every command below uses
the same version, so the flags match this guide.)

**Why `npx.cmd` and not `npx`:** on this computer, Windows PowerShell blocks script files, so plain `npx` fails with
`File C:\Program Files\nodejs\npx.ps1 cannot be loaded because running scripts is disabled on this system`.
`npx.cmd` is the same program and isn't blocked, and nothing on the computer has to change.
(The other fix is `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, which allows local scripts for your user
account. You don't need it.)

### 2d. Log in with the NEW account

**First, clear the old token setting (this window only).** This computer has a Windows environment variable,
`SUPABASE_ACCESS_TOKEN`, holding an old token in a retired format. While it's set, `login` fails with
`cannot save provided token: Invalid access token format. Must be like sbp_0102...1920`, and every later command
would use the old token instead of your new login.

```powershell
Test-Path Env:SUPABASE_ACCESS_TOKEN
```

**You should see:** `True` (if `False`, skip the next command). This only answers yes or no; it doesn't show the
token.

```powershell
Remove-Item Env:SUPABASE_ACCESS_TOKEN
Test-Path Env:SUPABASE_ACCESS_TOKEN
```

**You should see:** `False`

This lasts only for this terminal window. **Do steps 2d to 4c in the same window.** If you open a new one, run
`Remove-Item Env:SUPABASE_ACCESS_TOKEN` again first.

If this computer was ever logged in to the old account, log out first:

```powershell
npx.cmd supabase@3.2.0 logout
```

**You should see** `Access token deleted successfully. You are now logged out.` (or a message that you weren't
logged in; either is fine).

Now log in:

```powershell
npx.cmd supabase@3.2.0 login
```

**You should see something like:**

```
Hello from Supabase! Press Enter to open browser and login automatically.
```

Press **Enter**. The browser opens a Supabase page.
- If it asks you to sign in, use the **new** account.
- If it shows a verification code, type that code into the terminal where it asks `Enter your verification code:`.

**Then you should see something like:**

```
Token cli_..._... created successfully.

You are now logged in. Happy coding!
```

### 2e. Check you're on the right account

```powershell
npx.cmd supabase@3.2.0 projects list
```

**You should see a table that includes** a row with `REFERENCE ID` = `fazxqwlaxrahqpojousl`.

**If that row is missing:** you're logged in to the old account. Run `npx.cmd supabase@3.2.0 logout`, then repeat 2d.
In the browser, make sure you're signed in to the new account first:
<https://supabase.com/dashboard/account/me>

---

## Step 3. Deploy the `submit-form` function

Still in the `Website` folder:

```powershell
npx.cmd supabase@3.2.0 functions deploy submit-form --remote=fazxqwlaxrahqpojousl --no-verify-jwt --use-api
```

What the three options do:
- `--remote=fazxqwlaxrahqpojousl` sends it to the new project. Version 3 of the CLI has no `--project-ref` flag;
  older guides that use it won't work with this version.
- `--no-verify-jwt` **is required**. The website sends the publishable key (`sb_publishable_…`), which is not a
  JWT. Without this flag, every form request is refused with `401 Invalid JWT` before it reaches the function.
- `--use-api` builds the function on Supabase's servers, so you don't need Docker.

If it asks you to confirm a change to the hosted project, type `y` and press Enter.

**You should see something like:**

```
Uploading asset (submit-form): supabase/functions/submit-form/index.ts
Deployed Functions on project fazxqwlaxrahqpojousl: submit-form
You can inspect your deployment in the Dashboard: https://supabase.com/dashboard/project/fazxqwlaxrahqpojousl/functions
```

### 3a. Check it in the dashboard

Open <https://supabase.com/dashboard/project/fazxqwlaxrahqpojousl/functions>

**You should see:** `submit-form` in the list. Click it, then **Details**: "Enforce JWT verification" (or
"Verify JWT") must be **off**. If it's on, switch it off there and save, or run the deploy command again with
`--no-verify-jwt`.

### If the deploy fails

| You see | Meaning | Fix |
|---|---|---|
| `Your account does not have the necessary privileges to access this endpoint` | logged in to the old account | step 2d again (logout, login) |
| `Access token not provided. Supply an access token by running supabase login` | not logged in | step 2d |
| `Cannot find project ref` or `unknown flag: --project-ref` | an old command or a typo | copy the command above exactly |
| `failed to read file ... index.ts` / `no such file` | wrong folder | step 2a, then retry |
| `Docker ... not running` | the `--use-api` flag was left out | add `--use-api` |

---

## Step 4. Add the email key (so info@ and hr@ get notified)

Without this, forms still save, but no email reaches info@petlifeindia.co or hr@petlifeindia.co.

### 4a. Get a Resend API key

1. Open <https://resend.com/domains> and sign in to the Resend account that sends Petlife's email.
   **Check:** `petlifeindia.co` is listed with status **Verified**. If it isn't, emails will be refused; tell me.
2. Open <https://resend.com/api-keys> → **Create API Key**.
   - Name: `petlife-website`
   - Permission: **Sending access**
   - Domain: `petlifeindia.co`
3. Click **Add**, and **copy** the key (it starts with `re_`). Resend shows it only once.

Don't paste the key into a file, a commit, or a chat (including with me).

### 4b. Add it to the new project: dashboard (recommended)

1. Open <https://supabase.com/dashboard/project/fazxqwlaxrahqpojousl/functions/secrets>
2. Under **Add new secret**: Name `RESEND_API_KEY`, Value: paste the `re_…` key.
3. Click **Save**.

Optional, only if you want a different sender: add `NOTIFY_FROM` with a value like
`Petlife <website@petlifeindia.co>`. That's the default anyway, so you can skip it.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are already there automatically. Don't add or change them.

**You should see:** `RESEND_API_KEY` in the list, showing a digest, not the key itself.

### 4b (other way). The same from the terminal

This asks for the key without saving it in your command history:

```powershell
$k = Read-Host "Paste the Resend key (re_...)"
npx.cmd supabase@3.2.0 secrets set "RESEND_API_KEY=$k" --remote=fazxqwlaxrahqpojousl
Remove-Variable k
```

**You should see:** `Finished supabase secrets set.`

### 4c. Check the secret is there

```powershell
npx.cmd supabase@3.2.0 secrets list --remote=fazxqwlaxrahqpojousl
```

**You should see a table** with `NAME` and `DIGEST` columns that includes `RESEND_API_KEY` (plus
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` and similar, which Supabase
adds itself). The digest is a fingerprint, not the key.

New secrets reach the function within about a minute; there's no need to redeploy.

---

## Step 5. Test the function directly (before touching the website)

### 5a. Get the publishable key

Open <https://supabase.com/dashboard/project/fazxqwlaxrahqpojousl/settings/api-keys>

Copy the **Publishable key** (starts with `sb_publishable_`). This key is public by design: it ends up in every
visitor's browser. **Don't** copy the **Secret key** (`sb_secret_…`) or the `service_role` key.

### 5b. The browser preflight check

```powershell
curl.exe -s -o NUL -w "%{http_code}`n" -X OPTIONS -H "Origin: https://petlifeindia.co" https://fazxqwlaxrahqpojousl.supabase.co/functions/v1/submit-form
```

**You should see:** `204`

| You see | Meaning |
|---|---|
| `204` | function deployed and answering |
| `404` | function not deployed, or deployed to another project: redo step 3 |
| `000` | no network, or the URL is mistyped |

### 5c. Send one test message

Put your own email in `email` (the 15-minute limit per address applies). This saves a real row and sends a
real email to info@petlifeindia.co.

```powershell
$KEY = Read-Host "Paste the publishable key (sb_publishable_...)"
$h = @{ apikey = $KEY; Authorization = "Bearer $KEY"; Origin = "https://petlifeindia.co" }
$b = @{ form = "contact"; name = "Setup Test"; email = "your-own@email.com"; subject = "Setup test"; message = "Testing the new website backend." } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://fazxqwlaxrahqpojousl.supabase.co/functions/v1/submit-form" -Headers $h -ContentType "application/json" -Body $b
```

**You should see:**

```
  ok
  --
True
```

**Then check:**
1. Table: <https://supabase.com/dashboard/project/fazxqwlaxrahqpojousl/editor> → `website_contact_messages`.
   **You should see** one row named "Setup Test", with `email_sent` = `true`.
2. Inbox: an email "New contact message from Setup Test" at info@petlifeindia.co.

**If something's wrong:**

| You see | Meaning | Fix |
|---|---|---|
| `{"code":401,"message":"Invalid JWT"}` | JWT checking is on | step 3a: switch it off, or redeploy with `--no-verify-jwt` |
| `{"error":"We couldn't save that. Please try again."}` | the tables are missing | step 1 |
| `{"error":"You've just sent us a message ... in 15 minutes."}` | the per-email limit; the function works | wait 15 minutes, or use another email |
| Row saved but `email_sent` = `false` | Resend refused it, or the key is missing | step 4; then check the logs (below) |
| `{"error":"Enter a valid email address."}` | typo in the test email | fix the `email` value |

**Function logs** (what the function printed, newest first):
<https://supabase.com/dashboard/project/fazxqwlaxrahqpojousl/functions/submit-form/logs>
- `RESEND_API_KEY not set — stored submission but sent no email` → step 4 not done, or still saving.
- `contact insert failed` → step 1.

You can delete the test row afterwards: Table editor → tick the row → **Delete**.

---

## Step 6. Send me the publishable key

Paste the `sb_publishable_…` key here in chat. It's safe to share; the old one is already in the live page.

---

## Step 7. Point the website at the new project (me)

I change two lines in `Website/js/config.js`:

```js
SUPABASE_URL: "https://fazxqwlaxrahqpojousl.supabase.co",
SUPABASE_ANON_KEY: "sb_publishable_...",   // the key you send
```

I test the three forms against a local copy of the site, commit, and show you the result. **Nothing goes live
until you tell me to push.**

---

## Step 8. Push and check the live site

When you say push, I push `main` of Syogeshnk/Petlife-web. Cloudflare rebuilds the site in about a minute.

You can watch the build at <https://dash.cloudflare.com> → Workers & Pages → `petlifeweb` → Deployments.
**You should see** a new deployment with status **Success**.

Then, on <https://petlifeindia.co>:

1. **Contact form** (bottom of the home page): send a message using an email you haven't used in the last
   15 minutes.
   **You should see:** "Message sent. We'll reply to your email shortly — usually the same day."
2. **Become a Pet Buddy**: one application per email address.
   **You should see:** "Application received. Our team will get back to you within 2 working days."
3. **Careers** (<https://petlifeindia.co/careers>), with a small PDF.
   **You should see:** "Application received. We read every one and reply within a week."
   The file appears at <https://supabase.com/dashboard/project/fazxqwlaxrahqpojousl/storage/buckets/resumes>.

If a form still says "We couldn't reach our server just now": press **Ctrl+Shift+R** to reload without the
cache, then try again. If it persists, press **F12** → **Console**, and send me the red line.

---

## Good to know

- **Old submissions** (messages, applications and résumés sent before the pause) stay in the old project
  <https://supabase.com/dashboard/project/umvsromotyjbrzykmqoh>, in the old account. To keep them, restore that
  project from its page (it needs a free slot in that account), or download its backup from the same page.
  That's only possible for a limited time after a pause.
- **Free projects pause after about a week with no activity.** The forms get little traffic, so this one could
  pause too. The fixes are the Pro plan, or a weekly scheduled request that keeps it active (I can set that up).
- **Free plan limit:** 2 active projects per account. This new account now has 1.
