/* Petlife website configuration.
 *
 * Fill these two values in and both forms go live. Until then the forms show a
 * "not configured yet" message instead of silently failing.
 *
 *   SUPABASE_URL  → Supabase dashboard → Project Settings → Data API → Project URL
 *   SUPABASE_ANON_KEY → same page → Project API keys → anon / public
 *
 * The anon key is safe to ship in the browser. It only lets the page call the
 * submit-form edge function; the form tables themselves are locked to the
 * service role (see supabase/migrations/).
 */
window.PETLIFE_CONFIG = {
  // The website's own Supabase project (petlife-web), separate from the mobile
  // app's project. The publishable key is safe in the browser: it only lets the
  // page call the submit-form edge function, and the website_* tables have RLS
  // on with no policies, so only the service role can read or write them.
  SUPABASE_URL: "https://umvsromotyjbrzykmqoh.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_u8dhsYJQxNQP5F9wA7oi-Q_lP8amE6U",

  // Public contact details, rendered into the page.
  PHONE: "+918451072388",
  PHONE_DISPLAY: "+91 84510 72388",
  WHATSAPP: "918451072388",
  EMAIL: "info@petlifeindia.co",
  EMAIL_HR: "hr@petlifeindia.co",
  INSTAGRAM: "https://www.instagram.com/petlife_india",
};
