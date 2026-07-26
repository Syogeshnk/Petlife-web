# Petlife — Feature Build Guide

> Every feature: what the user experiences, the logic behind it, and exactly what's needed to build it.
> Platform: React Native + Expo (Expo Router, NativeWind). This file was originally written for the
> Next.js web version and has been rewritten to match the mobile pivot (see CLAUDE.md change log,
> 2026-06-19). Column names match DATABASE_MIGRATIONS.md / DB_TYPES.md exactly — verify against those
> two files before writing any query, they are the source of truth if this file ever drifts again.
> Last updated: 2026-07-04 (added §25-29: dual-role switching, booking flow, dual-OTP session
> validation, provider government ID verification via DigiLocker, live GPS tracking during a session —
> see PROJECT_PLAN.md §3/§9A/§9B/§9C for the product reasoning behind these. **Same day, later:**
> rewrote §1 for WhatsApp OTP signup verification, fixed a drift bug in §2 that still referenced the
> deprecated `profiles.role` column instead of `is_pet_parent`/`is_provider`/`active_role`, expanded §2's
> pet/provider fields to match the redesigned onboarding screens, and added §30 In-App Chat.
> **2026-07-04, per the companion FRD:** §1 login flow gained lockout + OTP-based password reset,
> §24 gained ban-evasion admin steps, §26 gained aggression-disclosure/auto-expiry/double-booking
> notes and address geocoding for the Start-OTP geofence, §27 gained the GPS-geofence check itself.)

---

## Index

1. [Authentication](#1-authentication)
2. [Onboarding Wizard](#2-onboarding-wizard)
3. [GPS Location Capture](#3-gps-location-capture)
4. [Profile System](#4-profile-system)
5. [Profile Picture & Gallery Upload](#5-profile-picture--gallery-upload)
6. [Working Hours](#6-working-hours)
7. [Profile Completeness Indicator](#7-profile-completeness-indicator)
8. [Search & Discovery](#8-search--discovery)
9. [Map View](#9-map-view)
10. [Rating System](#10-rating-system)
11. [Pet Buddy Reply to Review](#11-pet-buddy-reply-to-review)
12. [Contact System](#12-contact-system)
13. [Saved Pet Buddies (Bookmarks)](#13-saved-pet-buddies-bookmarks)
14. [Share a Profile](#14-share-a-profile)
15. [App Store Discovery & Deep Links](#15-app-store-discovery--deep-links)
16. [Notifications](#16-notifications)
17. [Block a User](#17-block-a-user)
18. [Report a User / Review](#18-report-a-user--review)
19. [Account Deactivation & Deletion](#19-account-deactivation--deletion)
20. [View Profile as Public](#20-view-profile-as-public)
21. [Empty States](#21-empty-states)
22. [App Icon, Splash Screen & OTA Updates](#22-app-icon-splash-screen--ota-updates)
23. [Legal Pages](#23-legal-pages)
24. [Admin Moderation](#24-admin-moderation)
25. [Role Switching (Pet Parent ⇄ Pet Buddy)](#25-role-switching-pet-parent--pet-buddy)
26. [Booking Flow](#26-booking-flow)
27. [Dual-OTP Session Validation](#27-dual-otp-session-validation)
28. [Pet Buddy Government ID Verification (DigiLocker)](#28-pet-buddy-government-id-verification-digilocker)
29. [Live GPS Tracking During a Session](#29-live-gps-tracking-during-a-session)
30. [In-App Chat](#30-in-app-chat)

> Sections 25-29 were added 2026-07-02, addressing a persona/scope gap: the app had no real
> service-provider-side experience or booking lifecycle, just pet-parent discovery. See
> PROJECT_PLAN.md §3/§9A/§9B/§9C for the product reasoning and DATABASE_MIGRATIONS.md migrations
> 010-015 for the schema these sections build on. **Section 30 and the WhatsApp OTP rewrite of §1 were
> added the same day, during the registration-flow redesign** — see DATABASE_MIGRATIONS.md migrations
> 016-018 and PROJECT_PLAN.md §5.1/§23.

---

## 1. Authentication

> **v1 = Google OAuth + Email/password (₹0 forever) + WhatsApp OTP mobile verification at signup
> (small per-message cost after Meta's free tier — see COST_METRIC.md §2.12).** The WhatsApp OTP piece
> is new as of 2026-07-02, reversing the original "phone OTP deferred to v2" plan by explicit user
> choice — see PROJECT_PLAN.md §5.1 for the product reasoning. It is unrelated to the in-app
> booking-session OTPs (§27), which need no delivery channel at all.

### What the user experiences

**New user (redesigned 2026-07-02 — see design/screen-signup.md, design/screen-otp-verification.md):**
The signup screen leads with a form — Full Name, Mobile Number, Email, Password, Confirm Password,
plus Terms/Privacy/notifications consent checkboxes — and a **"Create Account"** button. "Continue with
Google" is offered below as a secondary, optional shortcut (a deliberate change from the original
"Google primary" pattern, made to accommodate mobile verification). After tapping Create Account, the
user is taken straight to a dedicated OTP-entry screen and enters the 6-digit code sent to their
WhatsApp. Role selection (Pet Parent / Pet Buddy / Both) happens on its own screen immediately
after — not on the signup form itself, and not gated behind OTP success being mandatory (see fallback
note below).

**Returning user:**
Session is still active (persisted encrypted on-device) — they go straight to their dashboard tab. If the session expired, Google re-authenticates in one tap; email shows the login form.

---

### Logic & Algorithm

**Google OAuth flow (native browser overlay + deep link, not a web redirect):**
```
User taps "Continue with Google"
  → expo-auth-session useAuthRequest({ clientId, redirectUri: 'petlife://oauth2redirect/google' })
  → expo-web-browser opens accounts.google.com in a browser overlay
  → User selects their Google account
  → Google redirects to petlife://oauth2redirect/google?code=xxx
  → expo-linking receives the deep link, closes the browser overlay
  → exchangeCodeAsync() exchanges the code for an id_token
  → supabase.auth.signInWithIdToken({ provider: 'google', token: id_token })
  → Session stored via lib/secureStore.ts (expo-secure-store, NOT plain AsyncStorage — see below)
  → DB trigger fires: creates profiles row if first login
  → Check profiles.onboarding_complete
       ├─ false → router.replace('/onboarding')
       └─ true  → router.replace('/(tabs)')
```

**Email/password flow (identical API surface to web — Supabase JS client is the same library):**
```
Signup:
  User enters email + password
  → supabase.auth.signUp({ email, password })
  → Supabase sends free verification email (uses Supabase built-in SMTP)
  → User clicks link → email verified → session created
  → DB trigger creates profiles row
  → router.replace('/onboarding')

Login (updated 2026-07-04, per FRD US-A02 — login lockout):
  → supabase.rpc('check_login_lockout', { p_identifier: email })
       └─ true → show "Too many attempts — try again in 15 minutes", stop here (no Auth call)
  → supabase.auth.signInWithPassword({ email, password })
       ├─ failure → supabase.rpc('record_login_failure', { p_identifier: email })
       │            → show generic "Invalid email or password" — never differentiate
       │              wrong-password vs. no-such-account, even though Auth's error codes do
       └─ success → supabase.rpc('reset_login_attempts', { p_identifier: email })
                    → Session created → check onboarding_complete → route accordingly

Password reset (updated 2026-07-04, per FRD US-A03 — OTP instead of a magic link):
  → supabase.auth.resetPasswordForEmail(email)  // same call — behavior change is dashboard config only
  → Supabase Auth's "Email OTP" template (toggled in Project Settings → Auth → Email Templates,
    not a code change) sends a 6-digit code instead of a link
  → supabase.auth.verifyOtp({ email, token: code, type: 'recovery' }) → session created → set new password
```

**Session persistence — SecureStore, not AsyncStorage:**
Plain `AsyncStorage` stores the JWT/refresh token in cleartext on-device. Use an encrypted wrapper instead:
```typescript
// lib/secureStore.ts — chunked wrapper implementing the AsyncStorage interface,
// backed by expo-secure-store (Android Keystore / iOS Secure Enclave).
// JWTs can exceed SecureStore's 2048-byte-per-key limit, so long values are
// split into indexed chunks on write and reassembled on read.
import * as SecureStore from 'expo-secure-store'

const CHUNK_SIZE = 2048

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const chunkCount = await SecureStore.getItemAsync(`${key}_chunks`)
    if (!chunkCount) return SecureStore.getItemAsync(key)
    const chunks = await Promise.all(
      Array.from({ length: Number(chunkCount) }, (_, i) => SecureStore.getItemAsync(`${key}_${i}`))
    )
    return chunks.join('')
  },
  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) return SecureStore.setItemAsync(key, value)
    const chunks = Math.ceil(value.length / CHUNK_SIZE)
    await SecureStore.setItemAsync(`${key}_chunks`, String(chunks))
    await Promise.all(
      Array.from({ length: chunks }, (_, i) =>
        SecureStore.setItemAsync(`${key}_${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE))
      )
    )
  },
  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key)
    await SecureStore.deleteItemAsync(`${key}_chunks`)
  },
}
```
```typescript
// lib/supabase.ts
import { secureStorage } from '@/lib/secureStore'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,   // must be false for React Native
    },
  }
)
```

**Route protection — Expo Router auth guard (not Next.js middleware):**
```typescript
// app/_layout.tsx
const { session, profile, loading } = useSession()

if (loading) return <SplashScreen />
if (!session) return <Redirect href="/(auth)/login" />
if (!profile?.onboarding_complete) return <Redirect href="/onboarding" />
return <Slot />
```

**DB trigger — auto-create profile on first login (runs for both Google and email, unchanged from DATABASE_MIGRATIONS.md 003):**
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, contact_email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**WhatsApp OTP mobile verification (v1, DATABASE_MIGRATIONS.md migration 016) — send side is an Edge
Function because it calls an external API with a secret token; verify side is a plain RPC because it's
just a hash comparison, same shape as `verify_booking_otp` (§27):**
```typescript
// lib/signupOtp.ts
export const sendSignupOtp = async (mobileNumber: string) => {
  const { error } = await supabase.functions.invoke('send-signup-otp', {
    body: { mobile_number: mobileNumber },
  })
  if (error) throw error
}

export const verifySignupOtp = async (mobileNumber: string, code: string) => {
  const { data, error } = await supabase.rpc('verify_signup_otp', {
    p_mobile_number: mobileNumber,
    p_code: code,
  })
  if (error) throw error
  return data as boolean   // true = profiles.is_phone_verified is now true
}
```
```typescript
// supabase/functions/send-signup-otp/index.ts (service role — WhatsApp Cloud API token lives here only)
// 1. Generate a 6-digit code
// 2. INSERT INTO signup_otps (mobile_number, code_hash, expires_at) — sha256 hash, expires_at = now() + 10 min
// 3. POST to graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages using the approved "Authentication"
//    template, with the code as the template variable — this is what actually costs money (§2.12)
// 4. Return { sent: true } — never return the code itself to the client
```

**Registration flow end-to-end:**
```
User submits signup form
  → supabase.auth.signUp({ email, password })   — creates the account
  → profiles row created by handle_new_user() trigger (below), which only sets contact_email;
    name + mobile_number are then written by a client-side UPDATE (profiles_owner_update RLS,
    RLS_POLICIES.md) right after signUp returns a session — requires Supabase Auth's "Confirm
    email" toggle OFF, since a null session there would make that UPDATE silently affect 0 rows
  → sendSignupOtp(mobileNumber)                 — fires the WhatsApp message (Phase 4, not this screen)
  → router.push('/(auth)/verify-otp')
       User enters 6-digit code
       → verifySignupOtp(mobileNumber, code)
            ├─ true  → router.replace('/onboarding')   (Step 1 = Choose Role)
            └─ false → show inline error, allow retry (locked out after 5 attempts — see migration 016)
       "Didn't get it? Resend" → calls sendSignupOtp() again, rate-limit client-side to 1 per 30s
```

**Interim fallback while WhatsApp Business verification/template approval is pending (same shape as
DigiLocker's manual-review fallback, §28):** nothing in the app currently gates on `is_phone_verified`
being true, so if `send-signup-otp` isn't live yet, skip straight to `/onboarding` after account
creation and rely on the existing email verification link (above) instead. Don't block registration on
this — mirror the DigiLocker sequencing note in §28.

---

### What's needed to build

**Supabase setup (both free, no billing required):**
- Enable Google provider in Supabase Auth dashboard → OAuth credentials from Google Cloud Console
- Add redirect URL `petlife://oauth2redirect/google` in Supabase Auth → URL Configuration
- Email auth is enabled by default in Supabase — nothing to configure

**Files to create:**
- `app/(auth)/login.tsx` — email form (primary) + Google button (secondary)
- `app/(auth)/signup.tsx` — name/mobile/email/password/confirm form + consent checkboxes + Google button (secondary) — no role field
- `app/(auth)/verify-otp.tsx` — WhatsApp OTP entry screen
- `app/_layout.tsx` — root auth guard (see above)
- `lib/auth.ts` — `signInWithGoogle()`, `signInWithEmail()`, `signOut()`
- `lib/signupOtp.ts` — `sendSignupOtp()`, `verifySignupOtp()` (see above)
- `lib/secureStore.ts` — see above
- `lib/supabase.ts` — Supabase client configured with `secureStorage`
- `hooks/useSession.ts` — `supabase.auth.onAuthStateChange()` wrapper
- `supabase/functions/send-signup-otp/index.ts` — WhatsApp Cloud API call, service role

**Packages:** `@supabase/supabase-js`, `expo-auth-session`, `expo-web-browser`, `expo-linking`, `expo-secure-store`

**Cost: ₹0 for Google/email. WhatsApp OTP costs a small per-message amount once Meta's free
conversation tier is exceeded — see COST_METRIC.md §2.12. No SMS provider, no Twilio, no paid BSP.**

> See DATABASE_MIGRATIONS.md for the canonical DB trigger and full schema SQL.

---

## 2. Onboarding Wizard

### What the user experiences

Right after WhatsApp OTP verification (§1), the user lands on a **Choose Role** screen (Pet Parent /
Pet Buddy / Both — "Both" is a fully-supported v1 selection, not future-only, since dual-role
accounts already exist as of migration 010), then a friendly multi-step wizard rendered as in-screen
state (not separate navigator routes) with a progress bar at the top. They can skip optional steps and
complete them later from their dashboard.

**Step flow for Pet Parent:** Choose Role → Name/photo/bio → GPS location → Add pets (full profile per
pet — see below) → Contact details+visibility → Done → tabs
**Step flow for Pet Buddy:** Choose Role → Name/photo/bio/experience/credentials → Service area (city,
pincode, radius) → GPS location → Services+price range → Working hours → Gallery (optional) → Contact
details+visibility → **KYC Verification (§28)** → Done → tabs, with completeness %. Bank details are
intentionally never asked for — there's no payment gateway to pay into (PROJECT_PLAN.md §23).

---

### Logic & Algorithm

**State management:** Wizard state lives in a single `app/onboarding/index.tsx` screen using `useState` (a step-machine, not Expo Router sub-routes — no navigation stack needed for a linear wizard). No data is saved to DB until the final step.

**Step validation rules:**
- Step 1 (role): required, no skip
- Step 2 (name + photo): name required, photo optional
- Step 3 (location): optional (user can skip GPS, add later)
- Step 4 (pets/services): at least one required to get full completeness score, but skippable
- Steps 5+: all optional
- KYC step (provider only): required before the profile appears in search (§28), but the wizard itself
  can still be completed and "Published" without it — `is_govt_id_verified` gates search visibility,
  not `onboarding_complete`

**On final step "Publish" — single upsert. Uses `is_pet_parent`/`is_provider`/`active_role`, not the
deprecated `role` column (migration 010) — this section previously still referenced `role` directly,
which was a drift bug fixed 2026-07-02:**
```typescript
await supabase.from('profiles').upsert({
  id: user.id,
  is_pet_parent: selectedRoles.includes('pet_parent'),
  is_provider: selectedRoles.includes('provider'),
  active_role: selectedRoles[0],       // whichever the user picked first / primary
  name, bio, avatar_url,
  business_name, pincode, service_radius_km,   // provider only — migration 017
  neighborhood, city,
  location: `POINT(${lng} ${lat})`,   // WKT — Supabase casts to geography; PostGIS is lng first
  contact_phone, contact_whatsapp, contact_email,
  show_phone, show_whatsapp, show_email,
  languages, years_experience, credentials,
  onboarding_complete: true,
})

// Pets (for pet parents) — full profile per pet, migration 017 fields included.
// vaccination_notes stays free text; is_vaccinated/is_sterilized are the new boolean flags.
await supabase.from('pets').insert(
  petsArray.map(p => ({
    owner_id: user.id,
    name: p.name, species: p.species, breed: p.breed, age_years: p.ageYears,
    avatar_url: p.avatarUrl, gender: p.gender, weight_kg: p.weightKg, color: p.color,
    is_vaccinated: p.isVaccinated, is_sterilized: p.isSterilized,
    vaccination_notes: p.vaccinationNotes, medical_conditions: p.medicalConditions,
    allergies: p.allergies, emergency_contact: p.emergencyContact,
    home_address: p.homeAddress, preferred_vet: p.preferredVet,
  }))
)

// Services (for providers) — price_range is a single free-text field, not min/max
await supabase.from('provider_services').insert(
  servicesArray.map(s => ({
    provider_id: user.id,
    service_type: s.serviceType,
    description: s.description,
    price_range: s.priceRange,        // e.g. "₹200-500/session" — free text
    working_hours: s.workingHours,    // { mon: {open,close}|null, ... }
    duration_minutes: s.durationMinutes,
    location_type: s.locationType,
  }))
)
```

**Slug generation (for sharing/deep links, not SEO — see section 15):**
```typescript
const slugify = (name: string, city: string) =>
  `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 6)}`
```

**Skipped fields:** Left as null in DB. Profile completeness % is calculated from what's filled vs total possible fields (see section 7).

---

### What's needed to build

**Files:**
- `app/onboarding/index.tsx` — parent screen managing step state
- `components/onboarding/RoleStep.tsx` — Choose Role (Pet Parent / Provider / Both)
- `components/onboarding/BasicInfoStep.tsx`
- `components/onboarding/ServiceAreaStep.tsx` (provider) — city, pincode, service radius
- `components/onboarding/LocationStep.tsx`
- `components/onboarding/PetsStep.tsx` (pet parent) — full per-pet field set, migration 017
- `components/onboarding/ServicesStep.tsx` (provider)
- `components/onboarding/WorkingHoursStep.tsx` (provider)
- `components/onboarding/ContactStep.tsx`
- `components/onboarding/VerificationStep.tsx` (provider) — DigiLocker/manual KYC, see §28
- `components/onboarding/ProgressBar.tsx`

**DB columns needed:** `profiles.onboarding_complete boolean DEFAULT false`, `profiles.is_pet_parent`/`is_provider`/`active_role` (set in step 1, migration 010 — NOT the deprecated `role` column) — already in DATABASE_MIGRATIONS.md.

---

## 3. GPS Location Capture

### What the user experiences

During onboarding (and whenever they update location), the app shows a friendly screen before triggering the OS permission dialog:

> "📍 Help pet parents find you
> We'll use your location to show you in nearby searches. We never share your exact location — only your neighbourhood name is visible."

Then they tap "Use my location" → OS permission popup appears → they tap Allow → a spinner shows briefly → "Got it! You're in Koramangala, Bengaluru." with a tick.

If they deny, a text field appears: "Enter your city or area manually."

---

### Logic & Algorithm

**Step 1 — Get coordinates (expo-location, not `navigator.geolocation`):**
```typescript
// lib/location.ts
import * as Location from 'expo-location'

export const getCurrentPosition = async (): Promise<{ lat: number; lng: number } | null> => {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') return null   // caller shows manual city input
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
  return { lat: pos.coords.latitude, lng: pos.coords.longitude }
}
```

**Step 2 — Reverse geocode to neighborhood name (Nominatim — same free API, but with a hard timeout):**
```typescript
// lib/geocoding.ts
// Nominatim has no SLA — an unbounded fetch can hang the onboarding flow forever.
// Always wrap external network calls in an AbortController timeout (SECURITY_AUDIT.md #11).
const fetchWithTimeout = async (url: string, ms = 10000) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, {
      signal: controller.signal,
      // Must be EXPO_PUBLIC_-prefixed: this runs on-device (not in an Edge Function),
      // and only EXPO_PUBLIC_ vars are inlined into the client JS bundle at build time.
      headers: { 'User-Agent': process.env.EXPO_PUBLIC_NOMINATIM_USER_AGENT ?? 'Petlife/1.0' },
    })
  } finally {
    clearTimeout(timer)
  }
}

export const reverseGeocode = async (lat: number, lng: number) => {
  const res = await fetchWithTimeout(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
  )
  const data = await res.json()
  return {
    neighborhood: data.address.suburb ?? data.address.neighbourhood ?? data.address.village ?? null,
    city: data.address.city ?? data.address.town ?? null,
    state: data.address.state ?? null,
  }
}

// Fallback when GPS is denied — forward geocode a manually typed city/area.
// Cap input length and restrict to India to keep this from being abused as an open proxy.
export const forwardGeocode = async (query: string) => {
  const capped = query.trim().slice(0, 100)
  const res = await fetchWithTimeout(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(capped)}&format=json&limit=1&countrycodes=in`
  )
  const data = await res.json()
  if (!data[0]) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}
```

**Step 3 — Convert to PostGIS format for DB (unchanged from web — Supabase client library is identical):**
```typescript
await supabase.from('profiles').update({
  location: `POINT(${lng} ${lat})`,   // note: PostGIS is lng first — Supabase casts to geography
  neighborhood: 'Koramangala',
  city: 'Bengaluru',
})
```

**Why we call Nominatim only once:** The result (neighborhood + city text) is cached in the `profiles` table. On every search, we use the stored PostGIS `location` geometry server-side (inside the RPC) — never call Nominatim again unless the user triggers "Update my location."

---

### What's needed to build

**Files:**
- `components/onboarding/LocationStep.tsx` — UI + permission prompt
- `lib/geocoding.ts` — `reverseGeocode()` and `forwardGeocode()`, both with timeout
- `lib/location.ts` — `getCurrentPosition()` wrapper

**Package:** `expo-location`

**DB columns:** `profiles.location geography(Point,4326)`, `profiles.neighborhood text`, `profiles.city text` — GIST index already in DATABASE_MIGRATIONS.md 002.

---

## 4. Profile System

### What the user experiences

**Pet parent's profile:** Card with name, bio, pet list with species icons, languages, ratings received as a client, and a contact section based on visibility settings.

**Pet Buddy's profile:** Hero section with photo, name, neighborhood, distance from viewer, rating badge. Then: services chips, working hours, gallery photo strip, credentials, and all reviews with Pet Buddy replies. Sticky bottom bar with Save + Contact.

**Own profile (dashboard):** Same as public but with an "Edit profile" button, profile completeness bar, and "Preview as public" link.

---

### Logic & Algorithm

**Profile screen — `app/profile/[id].tsx`, a normal client-rendered Expo Router screen (there is no SSR in a native app — see section 15 for what replaces SEO):**
```typescript
export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [profile, setProfile] = useState<ProviderProfile | PetParentProfile | null>(null)

  useEffect(() => {
    getPublicProfile(id).then(setProfile)
  }, [id])
  // ...
}
```

**Fetching a provider profile (explicit column list — never `select('*')`, per CONVENTIONS.md):**
```typescript
// lib/profile.ts
export const getPublicProfile = async (id: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, slug, name, bio, avatar_url, neighborhood, city,
      languages, years_experience, credentials, is_active, is_busy,
      contact_phone, contact_whatsapp, contact_email,
      show_phone, show_whatsapp, show_email,
      provider_services(service_type, description, price_range, working_hours, is_available),
      provider_gallery(photo_url, order_index),
      ratings!ratings_ratee_id_fkey(id, rater_id, score, note, provider_reply, reply_at, created_at, is_flagged)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()
  if (error) throw error
  return data
}
```

**Contact field logic (not enforced by RLS — see SECURITY_AUDIT.md CRITICAL #2 — this app-layer check is the only guard in v1):**
```typescript
const resolveContact = (profile: Profile, viewerIsLoggedIn: boolean) => {
  const resolve = (visibility: ContactVisibility, value: string | null) => {
    if (visibility === 'public') return value
    if (visibility === 'registered' && viewerIsLoggedIn) return value
    if (visibility === 'on_request') return 'request'
    return null
  }
  return {
    phone: resolve(profile.show_phone, profile.contact_phone),
    whatsapp: resolve(profile.show_whatsapp, profile.contact_whatsapp),
    email: resolve(profile.show_email, profile.contact_email),
  }
}
```

**Block check — before rendering any profile (RN has no `notFound()`; render an inline unavailable state instead):**
```typescript
const isBlocked = await checkMutualBlock(viewerId, profileId)   // see section 17
if (isBlocked) {
  return <UnavailableProfile />   // "This profile is unavailable" — same UX outcome as web's 404
}
```

**Average rating / total ratings are computed client-side from the fetched `ratings` array (there is no cached column on `profiles` — see DB_TYPES.md schema notes):**
```typescript
const avgRating = ratings.length
  ? Math.round((ratings.reduce((s, r) => s + r.score, 0) / ratings.length) * 10) / 10
  : 0
```

---

### What's needed to build

**Files:**
- `app/profile/[id].tsx` — profile screen
- `app/profile/edit.tsx` — edit form
- `components/provider/ProviderHero.tsx`, `ServicesList.tsx`, `WorkingHoursDisplay.tsx`, `GalleryStrip.tsx`, `ReviewsList.tsx`, `ContactSection.tsx`
- `components/provider/ProviderCard.tsx` — card used in search results
- `lib/profile.ts` — `getPublicProfile()`, `updateProfile()`, `resolveContact()`

---

## 5. Profile Picture & Gallery Upload

### What the user experiences

They tap an avatar placeholder or "+ Add photo." The OS photo library (or camera) opens. They pick a photo. The app immediately shows a preview — already cropped to a square. They tap "Use this photo" and it uploads — already compressed on-device before leaving the phone.

For gallery, they tap "+ Add photo" up to 5 times.

---

### Logic & Algorithm

**Pick image — `expo-image-picker` (not `<input type="file">`):**
```typescript
// lib/camera.ts
import * as ImagePicker from 'expo-image-picker'

export const pickImage = async (aspect: [number, number] = [1, 1]) => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (status !== 'granted') return null
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect,
    quality: 1,
  })
  return result.canceled ? null : result.assets[0]
}
```

**Resize + compress on-device — `expo-image-manipulator` (not Browser Canvas API):**
```typescript
// lib/imageResize.ts
import * as ImageManipulator from 'expo-image-manipulator'

export const resizeImage = async (uri: string, width: number, height: number) =>
  ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width, height } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.WEBP }
  )

// Profile pic: 400x400 → ~30-60KB WebP
// Gallery photo: 800x600 → ~80KB WebP
```

**Upload to Supabase Storage (convert local URI to a blob first — this is the one RN-specific step):**
```typescript
// lib/storage.ts
const uriToBlob = async (uri: string) => (await fetch(uri)).blob()

export const uploadProfilePic = async (userId: string, uri: string) => {
  const resized = await resizeImage(uri, 400, 400)
  const blob = await uriToBlob(resized.uri)
  const path = `${userId}/avatar.webp`
  await supabase.storage.from('profile-pictures').upload(path, blob, {
    contentType: 'image/webp',
    upsert: true,
  })
  const { data: { publicUrl } } = supabase.storage.from('profile-pictures').getPublicUrl(path)
  return publicUrl
}

export const uploadGalleryPhoto = async (providerId: string, uri: string, orderIndex: number) => {
  const resized = await resizeImage(uri, 800, 600)
  const blob = await uriToBlob(resized.uri)
  const path = `${providerId}/gallery-${Date.now()}.webp`
  await supabase.storage.from('provider-gallery').upload(path, blob, { contentType: 'image/webp' })
  const { data: { publicUrl } } = supabase.storage.from('provider-gallery').getPublicUrl(path)
  await supabase.from('provider_gallery').insert({
    provider_id: providerId,
    photo_url: publicUrl,
    order_index: orderIndex,   // NOT display_order — renamed in migration 008
  })
  return publicUrl
}
```

**Max gallery enforcement (client + DB count check):**
```typescript
const { count } = await supabase
  .from('provider_gallery')
  .select('*', { count: 'exact', head: true })
  .eq('provider_id', providerId)
if ((count ?? 0) >= 5) throw new Error('Maximum 5 photos allowed')
```

**Supabase Storage bucket config (unchanged from original plan):**
- `profile-pictures` — public bucket, path `{userId}/avatar.webp`
- `provider-gallery` — public bucket, path `{providerId}/gallery-{timestamp}.webp`
- RLS: only authenticated user matching the path prefix can upload/delete
- Note (SECURITY_AUDIT.md #15): paths are predictable/enumerable from a user's UUID. Accepted for v1;
  v2 should switch to private buckets + signed URLs.

---

### What's needed to build

**Files:**
- `components/uploads/AvatarUpload.tsx` — profile pic picker + preview
- `components/uploads/GalleryUpload.tsx` — multi-photo picker with reorder
- `lib/camera.ts` — `pickImage()`
- `lib/imageResize.ts` — `resizeImage()`
- `lib/storage.ts` — `uploadProfilePic()`, `uploadGalleryPhoto()`, `deleteGalleryPhoto()`

**Packages:** `expo-image-picker`, `expo-image-manipulator`

---

## 6. Working Hours

### What the user experiences

During onboarding (and in profile settings), providers see a weekly schedule grid. Each day has an on/off toggle. When toggled on, two time inputs appear: "Opens at" and "Closes at."

On their public profile, it renders as: "Mon–Fri 9am–6pm · Sat 10am–2pm · Closed Sunday". In search results, a badge shows **"Open now"** or **"Closed"** based on current device time.

---

### Logic & Algorithm

**Data structure — `provider_services.working_hours` JSONB, `{ open, close }` strings per day, `null` = closed:**
```json
{
  "mon": { "open": "09:00", "close": "18:00" },
  "tue": { "open": "09:00", "close": "18:00" },
  "wed": { "open": "09:00", "close": "18:00" },
  "thu": { "open": "09:00", "close": "18:00" },
  "fri": { "open": "09:00", "close": "18:00" },
  "sat": { "open": "10:00", "close": "14:00" },
  "sun": null
}
```

**Input validation (SECURITY_AUDIT.md #13 — the original text-input UI accepted any string with no format check):**
```typescript
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/
const isValidTime = (v: string) => HHMM.test(v)
// On save: if any open day has an invalid open/close string, show a red border on
// that field and block the save with an Alert — do not silently store bad data.
```

**"Open now" calculation (runs on-device, using local time — no server call):**
```typescript
// lib/workingHours.ts
export const isOpenNow = (workingHours: WorkingHours | null): boolean | null => {
  if (!workingHours) return null   // no hours set — don't show a badge
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
  const now = new Date()
  const today = workingHours[days[now.getDay()]]
  if (!today) return false   // closed today
  const [openH, openM] = today.open.split(':').map(Number)
  const [closeH, closeM] = today.close.split(':').map(Number)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  return nowMin >= openH * 60 + openM && nowMin < closeH * 60 + closeM
}
```

**Status priority — `is_busy` overrides everything, then `is_available`, then working hours:**
```typescript
export const getProviderStatus = (provider: { is_busy: boolean; is_available: boolean; working_hours: WorkingHours | null }) => {
  if (provider.is_busy) return { label: 'Busy', color: 'orange' } as const
  if (!provider.is_available) return { label: 'Unavailable', color: 'gray' } as const
  const open = isOpenNow(provider.working_hours)
  if (open === null) return null
  return open ? { label: 'Open now', color: 'green' } as const : { label: 'Closed', color: 'gray' } as const
}
```

---

### What's needed to build

**Files:**
- `components/onboarding/WorkingHoursStep.tsx` — weekly grid UI with toggles + time inputs + HH:MM validation
- `components/provider/WorkingHoursDisplay.tsx` — renders hours as readable text
- `lib/workingHours.ts` — `isOpenNow()`, `formatHours()`, `getProviderStatus()`

**DB:** `provider_services.working_hours jsonb` — already in DATABASE_MIGRATIONS.md 002.

---

## 7. Profile Completeness Indicator

### What the user experiences

On their own dashboard, a horizontal progress bar shows "Profile 65% complete." Below it, a list shows what's missing, each item tappable to jump to that edit section. At 100%, a "Complete ✓" badge appears on their profile card. **Only shown to the user on their own dashboard — never shown publicly.**

---

### Logic & Algorithm

**Points system (calculated client-side, saved to `profiles.profile_complete_pct` after every profile update — there is no DB trigger for this):**
```typescript
// lib/completeness.ts
export const calculateCompleteness = (
  profile: Profile,
  pets: Pet[],
  services: ProviderService[]
) => {
  const checks = [
    { done: !!profile.avatar_url, points: 20, label: 'Profile photo', link: '/profile/edit#photo' },
    { done: !!profile.bio, points: 15, label: 'Write a bio', link: '/profile/edit#bio' },
    { done: !!profile.neighborhood, points: 15, label: 'Add your location', link: '/profile/edit#location', providerOnly: true },
    { done: !!profile.contact_phone, points: 10, label: 'Add phone number', link: '/profile/edit#contact', providerOnly: true },
    { done: services.length > 0, points: 20, label: 'Add a service', link: '/profile/edit#services', providerOnly: true },
    { done: !!services[0]?.working_hours, points: 20, label: 'Set working hours', link: '/profile/edit#hours', providerOnly: true },
    { done: !!profile.neighborhood, points: 20, label: 'Add your location', link: '/profile/edit#location', parentOnly: true },
    { done: !!profile.contact_phone, points: 15, label: 'Add phone number', link: '/profile/edit#contact', parentOnly: true },
    { done: pets.length > 0, points: 30, label: 'Add your first pet', link: '/profile/edit#pets', parentOnly: true },
  ]
  // Role FLAGS, not the deprecated `role` column (migration 010) — a dual-role account gets the
  // UNION of both lists (shared checks once, location/phone at the provider weighting). This
  // snippet previously filtered on `profile.role`, the same drift bug §2 had — fixed 2026-07-06;
  // lib/completeness.ts is the built, unit-tested version.
  const relevant = checks.filter(c =>
    (!c.providerOnly || profile.is_provider) &&
    (!c.parentOnly || profile.is_pet_parent)
  )
  const earned = relevant.filter(c => c.done).reduce((sum, c) => sum + c.points, 0)
  const total = relevant.reduce((sum, c) => sum + c.points, 0)
  return { pct: Math.round((earned / total) * 100), missing: relevant.filter(c => !c.done) }
}
```

**Storing the final % — save after every profile update:**
```typescript
await supabase.from('profiles').update({ profile_complete_pct: completeness.pct }).eq('id', userId)
```

---

### What's needed to build

**Files:**
- `components/profile/CompletenessBar.tsx`
- `lib/completeness.ts`

**DB:** `profiles.profile_complete_pct int DEFAULT 0` — already in DATABASE_MIGRATIONS.md 002.

---

## 8. Search & Discovery

### What the user experiences

They open the Search tab. The app asks for location (already explained on the home screen). Once allowed, results appear as a `FlatList` sorted nearest to farthest, each card showing distance. At the top: service filter chips and a radius pill (5/10/25/50km), plus sort (Nearest / Top Rated / Most Reviewed). Changing any filter re-queries and refreshes the list.

If no results: "No providers found within 10 km — try 25 km?" with a button.

---

### Logic & Algorithm

**The search is a single Supabase RPC call — all filtering, distance, and sorting happen in one DB round trip:**
```typescript
// lib/search.ts
import type { SearchProvidersParams, SearchResult } from '@/types/database'

export const searchProviders = async (params: SearchProvidersParams): Promise<SearchResult[]> => {
  const { data, error } = await supabase.rpc('search_providers', {
    user_lat: params.user_lat,
    user_lng: params.user_lng,
    service_filter: params.service_filter ?? null,
    radius_km: params.radius_km ?? 10,
    sort_by: params.sort_by ?? 'distance',
    page_offset: params.page_offset ?? 0,
  })
  if (error) throw error
  return data as SearchResult[]
}
```
See DATABASE_MIGRATIONS.md migration 009 for the current `search_providers` SQL (returns fuzzed `lat`/`lng` for map view, ±300m noise — nothing further to apply client-side).

**GPS coords cached in React state for the session, not `sessionStorage` (that Web Storage API doesn't exist in React Native):**
```typescript
// hooks/useLocation.ts — coords live in a top-level provider/context for the search tab's lifetime.
// On app restart, GPS is re-requested (no persistence needed — it's a cheap, instant call once granted).
const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

useEffect(() => {
  if (!coords) getCurrentPosition().then(setCoords)
}, [])
```

**Block filter — excluded from SQL for simplicity, filtered client-side after the RPC returns:**
```typescript
const blockedIds = await getMyBlockedIds()   // see section 17, cached once per session
const filtered = results.filter(p => !blockedIds.includes(p.id))
```

**Pagination:** `search_providers` already returns 20 rows per call (`LIMIT 20 OFFSET page_offset`) — "Load more" increments `page_offset` by 20 and appends to the `FlatList` data, rather than infinite scroll (avoids jank on low-end Android devices).

---

### What's needed to build

**Files:**
- `app/(tabs)/search.tsx` — search tab with filters + `FlatList`
- `components/search/SearchFilters.tsx` — service chips, radius pills, sort dropdown
- `components/provider/ProviderCard.tsx` — result card
- `components/search/LocationBanner.tsx` — "Allow location" prompt
- `lib/search.ts` — `searchProviders()`
- `hooks/useLocation.ts`

**DB:** PostGIS extension + GIST index + `search_providers` RPC — already deployed per DATABASE_MIGRATIONS.md.

---

## 9. Map View

### What the user experiences

A toggle at the top of search results switches between "List" and "Map." The map shows the user's location and provider pins as coloured markers. Tapping a pin pops up a callout with the provider's photo, name, distance, and a "View Profile" button.

---

### Logic & Algorithm

**Library: `react-native-maps`, not Leaflet (Leaflet requires a DOM/`window` and doesn't run in React Native at all).**
```typescript
// app/search/map.tsx
import MapView, { Marker, Circle, Callout, PROVIDER_GOOGLE } from 'react-native-maps'

<MapView
  provider={PROVIDER_GOOGLE}   // Android: Google Maps. iOS defaults to Apple Maps if provider is omitted.
  initialRegion={{ latitude: userLat, longitude: userLng, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
>
  <Circle center={{ latitude: userLat, longitude: userLng }} radius={50} fillColor="rgba(61,107,79,0.3)" />
  {results.map(p => (
    <Marker key={p.id} coordinate={{ latitude: p.lat, longitude: p.lng }}>
      <Callout onPress={() => router.push(`/profile/${p.slug ?? p.id}`)}>
        <ProviderMiniCard provider={p} />
      </Callout>
    </Marker>
  ))}
</MapView>
```

**Location fuzzing — already done server-side, nothing to do on the client:**
The `lat`/`lng` returned by `search_providers` (migration 009-A) already have ±300m uniform noise applied inside the RPC. The raw `profiles.location` column is never sent to any client. Do **not** re-implement fuzzing in the app — it would double-apply noise and also implies (wrongly) that the client ever sees exact coordinates.

**No dynamic-import/SSR concerns:** Unlike the web version's `dynamic(() => import(...), { ssr: false })` workaround for Leaflet, `react-native-maps` is a normal native component — import and use directly.

---

### What's needed to build

**Package:** `react-native-maps`

**Files:**
- `app/search/map.tsx` — full-screen map view
- `components/map/ProviderMarker.tsx` — coloured pin by service type
- `components/map/ProviderCallout.tsx` — popup card on marker tap

**Setup:** Google Maps API key in `app.json` → `expo.android.config.googleMaps.apiKey` (see android_app.md). iOS uses Apple Maps for free by default.

---

## 10. Rating System

### What the user experiences

After using a vet's service, the pet parent visits the vet's profile and taps "Rate Dr. Priya" (shown only to logged-in users who aren't the Pet Buddy themselves) — a bottom sheet slides up with 5 star options and an optional 200-char note. Submit → rating appears immediately (subject to the blind-review window, PROJECT_PLAN.md §8), average updates once visible, Dr. Priya gets an email.

Pet Buddies can also rate pet parents — builds trust in both directions.

---

### Logic & Algorithm

**Who can rate whom:**
```typescript
const canRate = !!session && session.user.id !== profileOwnerId
const alreadyRated = existingRating !== null   // fetched on profile load; if true, show "Edit your review"
```

**Submit rating (upsert on the unique (rater_id, ratee_id) pair):**
```typescript
// lib/ratings.ts
export const submitRating = async ({ rateeId, score, note }: { rateeId: string; score: number; note: string }) => {
  const { error } = await supabase.from('ratings').upsert(
    { rater_id: session.user.id, ratee_id: rateeId, score, note: note.trim().slice(0, 200) },
    { onConflict: 'rater_id,ratee_id' }
  )
  if (error) throw error
}
```

**48-hour edit window (UI gate only — the DB does not enforce this):**
```typescript
const canEdit = (createdAt: string) => Date.now() - new Date(createdAt).getTime() < 48 * 60 * 60 * 1000
```

**Average rating:** Not stored anywhere — computed on-the-fly from the fetched `ratings` array (profile screen) or inside `search_providers` (search results). No stale cache to manage. See DB_TYPES.md — there is no `avg_rating` column on `profiles`.

**Rate limiting (3 ratings/day) — checked client-side before insert. This is a known gap, not a full guarantee:**
```typescript
const { count } = await supabase
  .from('ratings')
  .select('*', { count: 'exact', head: true })
  .eq('rater_id', userId)
  .gte('created_at', new Date(Date.now() - 86400000).toISOString())
if ((count ?? 0) >= 3) throw new Error('Rating limit reached for today')
```
> **Known limitation (SECURITY_AUDIT.md CRITICAL #3):** this check only stops the app's own UI — a user
> calling the Supabase REST API directly with their JWT can bypass it. A DB trigger (`BEFORE INSERT`)
> is the correct fix and is deferred to before v2. Acceptable for a v1 with low abuse incentive.

**Cannot rate yourself — enforced at both the table `CHECK` constraint and the INSERT RLS policy (migration 009-F):**
```sql
CHECK (rater_id != ratee_id)  -- table constraint, migration 002
-- WITH CHECK (auth.uid() = rater_id AND rater_id != ratee_id) -- RLS, migration 009-F
```

---

### What's needed to build

**Files:**
- `components/ratings/RatingSheet.tsx` — `@gorhom/bottom-sheet` + star row + text input + submit
- `components/provider/ReviewCard.tsx` — single review, note, rater, date, reply
- `components/provider/ReviewsList.tsx`
- `lib/ratings.ts` — `submitRating()`, `getMyRatingFor()`, `getReviewsFor()`

**Package:** `@gorhom/bottom-sheet`

---

## 11. Pet Buddy Reply to Review

### What the user experiences

Dr. Priya sees a 2-star review (once it's out of its blind-review window, §8/§10). She taps "Reply to this review" → a text box appears below it. She types a response, taps "Post reply." On her public profile the review now shows the reply indented below: *"Pet Buddy replied: ..."*. One-time reply per review; cannot edit after 24 hours.

---

### Logic & Algorithm

```typescript
// lib/ratings.ts
export const submitReply = async ({ ratingId, reply }: { ratingId: string; reply: string }) => {
  const { error } = await supabase
    .from('ratings')
    .update({ provider_reply: reply.trim().slice(0, 300), reply_at: new Date().toISOString() })
    .eq('id', ratingId)
    .eq('ratee_id', session.user.id)     // RLS also enforces this — migration 009-H
    .is('provider_reply', null)          // can't overwrite an existing reply
  if (error) throw error
}
```

**Display logic:**
```tsx
{review.provider_reply && (
  <View className="mt-2 pl-3 border-l-2 border-primary/30">
    <Text className="font-medium text-xs text-text-secondary">Pet Buddy replied:</Text>
    <Text>{review.provider_reply}</Text>
    <Text className="text-xs text-text-secondary">{formatDate(review.reply_at)}</Text>
  </View>
)}
```

**RLS policy (migration 009-H — ratee can update `provider_reply` only, identity-checked):**
```sql
CREATE POLICY "ratings_ratee_reply" ON ratings FOR UPDATE
  USING (auth.uid() = ratee_id)
  WITH CHECK (auth.uid() = ratee_id);
```

---

### What's needed to build

**Files:**
- Update `components/provider/ReviewCard.tsx` — add reply section + "Reply" button
- `lib/ratings.ts` — add `submitReply()`

**DB:** `ratings.provider_reply text`, `ratings.reply_at timestamptz` — already in DATABASE_MIGRATIONS.md 002 (note: column is `provider_reply`, not `reply`).

---

## 12. Contact System

### What the user experiences

On a Pet Buddy's profile, the contact section renders differently based on their settings and whether the viewer is logged in:

- **Public** → phone/WhatsApp/email shown directly, tap to call/message/email
- **Registered only** → same, but only after login; logged-out visitors see "Log in to see contact details"
- **On Request** → "Request Contact" button → optional 200-char note → submit → the Pet Buddy gets an email; requester sees "Request sent ✓"
- **Hidden** → no contact section shown

---

### Logic & Algorithm

**WhatsApp deep link (`Linking.openURL`, not an `<a>` tag):**
```typescript
import { Linking } from 'react-native'

const whatsappLink = (number: string) => {
  const clean = number.replace(/\D/g, '')
  const withCountry = clean.startsWith('91') ? clean : `91${clean}`
  return `https://wa.me/${withCountry}`
}
// onPress={() => Linking.openURL(whatsappLink(provider.contact_whatsapp))}
```

**Phone tap-to-call:**
```typescript
// onPress={() => Linking.openURL(`tel:${provider.contact_phone}`)}
```

**Contact request flow — daily limit check, then insert, then invoke the Edge Function directly from the RN client (there is no Next.js API route layer in a native app — the client calls Supabase directly, same as every other query):**
```typescript
// lib/contact.ts
export const sendContactRequest = async (providerId: string, message?: string) => {
  const { count } = await supabase
    .from('contact_requests')
    .select('*', { count: 'exact', head: true })
    .eq('requester_id', session.user.id)
    .gte('created_at', todayStart)
  if ((count ?? 0) >= 5) throw new Error('Daily request limit reached')

  await supabase.from('contact_requests').insert({
    requester_id: session.user.id,
    provider_id: providerId,
    message: message?.slice(0, 200) ?? null,   // status defaults to 'sent'
  })

  await supabase.functions.invoke('send-contact-request-email', {
    body: { requesterId: session.user.id, providerId },
  })
}
```

**Supabase Edge Function — `send-contact-request-email` (Deno runtime — identical whether invoked from a web or native client; no changes needed here from the original plan):**
```typescript
// supabase/functions/send-contact-request-email/index.ts
// Fetches both profiles, builds email via Resend, sends to provider with requester's
// name + profile link + contact details; sends confirmation email to requester.
```

**Contact field visibility — app-layer only, not RLS:**
> **Known limitation (SECURITY_AUDIT.md CRITICAL #2):** `profiles_public_read` RLS is `USING (true)` —
> any caller with the anon key can query `contact_phone`/`contact_whatsapp`/`contact_email` directly,
> bypassing `show_*` visibility. The only v1 mitigation is that the app always uses explicit column
> lists and never `select('*')`. Do not rely on RLS alone here. The v2 fix (a `get_profile_contacts`
> security-definer RPC) is documented in SECURITY_AUDIT.md.

---

### What's needed to build

**Files:**
- `components/provider/ContactSection.tsx` — renders correct UI based on visibility
- `lib/contact.ts` — `sendContactRequest()`, `resolveContactVisibility()`
- `supabase/functions/send-contact-request-email/index.ts` — Edge Function

---

## 13. Saved Pet Buddies (Bookmarks)

### What the user experiences

Every provider card and profile page has a heart icon. Tap → filled + saved. Tap again → unsaved. Dashboard → "Saved Providers" lists them with live availability/distance.

---

### Logic & Algorithm

**Toggle save (optimistic UI via local state, same pattern as web):**
```typescript
// lib/saved.ts
export const toggleSave = async (providerId: string, isSaved: boolean) => {
  if (isSaved) {
    await supabase.from('saved_providers').delete()
      .eq('user_id', session.user.id).eq('provider_id', providerId)
  } else {
    await supabase.from('saved_providers').insert({ user_id: session.user.id, provider_id: providerId })
  }
}
```

**`SaveButton` updates local state immediately on tap, then fires the request; roll back on error:**
```typescript
const handlePress = async () => {
  setSaved(prev => !prev)   // optimistic
  try {
    await toggleSave(provider.id, saved)
  } catch {
    setSaved(prev => !prev)   // roll back
  }
}
```

**Loading saved providers on dashboard:**
```typescript
const { data: saved } = await supabase.from('saved_providers').select('provider_id').eq('user_id', userId)
```

---

### What's needed to build

**Files:**
- `components/provider/SaveButton.tsx` — heart toggle
- `app/dashboard/saved.tsx` — saved providers `FlatList`
- `lib/saved.ts` — `toggleSave()`, `getSavedIds()`, `getSavedProviders()`

**DB:** `saved_providers` table with `UNIQUE(user_id, provider_id)` — already in DATABASE_MIGRATIONS.md.

---

## 14. Share a Profile

### What the user experiences

On any provider profile, a "Share" button opens the native OS share sheet (WhatsApp, SMS, copy link, etc.). Sharing pastes a `petlife://` deep link (or a plain text summary) into the chosen app.

> **Difference from the web plan:** the original design relied on WhatsApp/Telegram unfurling an
> Open Graph preview card (photo + rating + area) for shared links. That requires a server to render
> HTML with `og:` meta tags on request — there is no such server in the native-only architecture.
> A bare `petlife://profile/xxx` deep link will **not** produce a rich preview in WhatsApp; it'll show
> as plain text (and won't open the app at all for a recipient who hasn't installed it).

---

### Logic & Algorithm

**`expo-sharing` (or React Native's `Share.share()`) instead of the Web Share API:**
```typescript
// lib/share.ts
import { Share } from 'react-native'

export const shareProfile = async (provider: { name: string; slug: string | null; id: string; neighborhood: string | null }) => {
  const handle = provider.slug ?? provider.id
  await Share.share({
    message: `Check out ${provider.name} on Petlife — ${provider.neighborhood ?? ''}\npetlife://profile/${handle}`,
    // `url` is iOS-only in React Native's Share API; Android ignores it — put the link in `message` too.
    url: `petlife://profile/${handle}`,
  })
}
```

**Recommended v1.5/v2 enhancement (not required for launch, flagged here since word-of-mouth sharing
was called out in PROJECT_PLAN.md as a primary growth channel):** stand up one free static redirect
page (e.g. a single Supabase Edge Function or a GitHub Pages route) at
`https://petlife.in/p/{slug}` that renders minimal `og:` meta tags server-side and redirects into the
app via `petlife://profile/{slug}` (falling back to the Play Store listing if the app isn't installed).
This restores the rich WhatsApp preview card at near-zero cost, without reintroducing a full web app.

---

### What's needed to build

**Files:**
- `components/profile/ShareButton.tsx` — `Share.share()` wrapper
- `lib/share.ts` — `shareProfile()`

**Package:** none required for the basic native share sheet (`Share` is built into `react-native`); `expo-sharing` only if sharing files (e.g. a rendered profile card image) is added later.

---

## 15. App Store Discovery & Deep Links

> Replaces the original web plan's "SEO — Indexable Provider Pages" section. There is no server
> rendering a native app, so Google cannot crawl or index anything — organic discovery now works
> through the app stores (ASO) and in-app search, not web search.

### What the user experiences

A pet parent searches "pet care app" on the Play Store, finds Petlife via its store listing (title,
description, screenshots — see android_app.md's Play Store Submission Checklist), installs it, and
finds providers via in-app search. Shared profile links (`petlife://profile/xxx`) open the app
directly to that provider's profile for someone who already has it installed.

---

### Logic & Algorithm

**`profiles.slug` still exists and is still generated at onboarding — its purpose changed from
SEO-friendly URL to deep-link readability, and it's what "Share a Profile" (section 14) uses.**

**Deep link handling (Expo Router resolves `petlife://profile/xxx` to `app/profile/[id].tsx`
automatically once `scheme: "petlife"` is set in `app.json` — no custom routing code needed):**
```json
{ "expo": { "scheme": "petlife" } }
```

**What actually drives discovery in v1, in priority order:**
1. Play Store search ranking — driven by app title/description keywords, install velocity, ratings (see android_app.md Store Listing checklist)
2. Word-of-mouth shares via WhatsApp (section 14)
3. In-app search once installed

**No sitemap.xml, no robots.txt, no JSON-LD, no `generateMetadata()` — none of these apply to a
native app with no server-rendered pages.**

---

### What's needed to build

**Nothing new beyond what section 14 already requires.** This section exists to document why the
old SEO plan doesn't carry over, and to point at android_app.md/ios_app.md for the ASO checklist
(app title, short/full description, keywords, screenshots) that replaces it.

---

## 16. Notifications

### What the user experiences

A red badge on the "Activity" tab shows unread count. Tapping it shows a `FlatList`: "Dr. Priya replied to your review · 2h ago." Tapping a notification navigates to the relevant profile/review. Email is still the primary notification channel in v1 (push notifications are a v2/Phase 7 addition — see ROADMAP.md).

---

### Logic & Algorithm

**Unread badge count:**
```typescript
// hooks/useUnreadCount.ts
const { count } = await supabase
  .from('notifications')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('is_read', false)
```

**Creating a notification (single generic `related_id` FK — there is no split `related_user_id`/`related_rating_id`):**
```typescript
await supabase.from('notifications').insert({
  user_id: rateeId,
  type: 'new_rating',
  title: `${raterName} left you a ${score}★ review`,
  body: note?.slice(0, 80) ?? null,
  related_id: ratingId,
})
```

**Mark all read when Activity tab is opened:**
```typescript
await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
```

**Email notifications — same Edge Function pattern as web, unchanged. Event → notification mapping:**
```
contact_request_received → notify provider via email + in-app
new_rating_received       → notify ratee via email + in-app
review_reply_posted       → notify original rater via email + in-app
contact_request_sent      → notify requester via email (confirmation only)
```

---

### What's needed to build

**Files:**
- `components/dashboard/NotificationBadge.tsx`
- `app/(tabs)/activity.tsx` — notifications `FlatList`
- `supabase/functions/send-notification-email/index.ts`
- `lib/notifications.ts` — `getUnreadCount()`, `markAllRead()`, `createNotification()`
- `hooks/useUnreadCount.ts`

**DB:** `notifications` table — already in DATABASE_MIGRATIONS.md.

**External:** Resend.com (free tier) for email sending.

---

## 17. Block a User

### What the user experiences

From any profile, they tap the 3-dot menu → "Block this user" → confirm. The blocked user then sees "This profile is unavailable" when visiting the blocker's profile, and cannot send contact requests. Blocker manages their list in Settings → "Blocked users."

---

### Logic & Algorithm

**Blocking:**
```typescript
// lib/blocks.ts
export const blockUser = async (blockedId: string) => {
  if (session.user.id === blockedId) throw new Error('Cannot block yourself')
  await supabase.from('user_blocks').insert({ blocker_id: session.user.id, blocked_id: blockedId })
}
```

**Enforcing block on profile view (no `notFound()` in React Native — render an inline unavailable state):**
```typescript
const isBlocked = await checkMutualBlock(session.user.id, profileId)
if (isBlocked) return <UnavailableProfile />
```

**Checking mutual block (either direction — requires migration 009-B, which fixed the RLS so both
parties can read the block row; before that fix, the blocked party had no way to detect the block):**
```sql
SELECT EXISTS (
  SELECT 1 FROM user_blocks
  WHERE (blocker_id = $a AND blocked_id = $b)
     OR (blocker_id = $b AND blocked_id = $a)
)
```

**Block filter in search results — client-side after the RPC returns (unchanged approach from web):**
```typescript
const blockedIds = await getMyBlockedIds(userId)   // cached once per session
return results.filter(p => !blockedIds.includes(p.id))
```

**DB constraint (migration 009-C):** `CHECK (blocker_id != blocked_id)` — self-block is rejected at the DB level as a second layer of defence, in addition to the client guard above.

---

### What's needed to build

**Files:**
- `components/profile/ProfileMenu.tsx` — 3-dot menu with Block option
- `app/settings/blocked.tsx` — blocked users list + unblock
- `lib/blocks.ts` — `blockUser()`, `unblockUser()`, `getMyBlockedIds()`, `checkMutualBlock()`

**DB:** `user_blocks` table, `UNIQUE(blocker_id, blocked_id)`, `no_self_block` check — DATABASE_MIGRATIONS.md 002 + 009-B/C.

---

## 18. Report a User / Review

### What the user experiences

**Reporting a review:** flag icon → reason (Fake review / Inappropriate language / Spam / Other) → submit → review hidden from public immediately, pending admin check. Reviewer is not told.

**Reporting a profile:** 3-dot menu → "Report this profile" → reasons (Fake profile / Impersonation / Inappropriate content / Suspected scam / Harassment) → submit, logged silently.

---

### Logic & Algorithm

**Flag a review (corrected 2026-07-10, Phase 23 — the original snippet here updated
`ratings.is_flagged` directly, which predates migration 029 and would be REJECTED by RLS: only the
rater and ratee hold UPDATE policies on a rating. Reporters file into `review_reports` (029-E), and
the `is_flagged` flip is a manual admin action — see docs/ADMIN_ACTIONS.md §2 — so a report can't
one-tap censor a bad review):**
```typescript
// lib/moderation.ts
export const reportReview = async (reporterId: string, ratingId: string, reason: string) => {
  await supabase.from('review_reports').insert({ reporter_id: reporterId, rating_id: ratingId, reason })
  // The review stays visible until an admin reviews the report and sets ratings.is_flagged = true
  // from the dashboard (which then hides it from all public queries + the live ★ aggregates).
}
```

**Report a profile (self-report blocked at the DB level, migration 009-E):**
```typescript
export const reportUser = async (reportedId: string, reason: string, note?: string) => {
  if (session.user.id === reportedId) throw new Error('Cannot report yourself')
  await supabase.from('user_reports').insert({
    reporter_id: session.user.id,
    reported_id: reportedId,
    reason,
    note: note?.slice(0, 200) ?? null,
  })
}
```

**Admin sees all reports:** Supabase dashboard table view is sufficient for v1 (see section 24).

---

### What's needed to build

**Files:**
- `components/modals/ReportModal.tsx` — shared for review + profile reports (reason selection)
- `lib/moderation.ts` — `flagReview()`, `reportUser()`

**DB:** `user_reports` table; `ratings.is_flagged` — already in schema.

---

## 19. Account Deactivation & Deletion

### What the user experiences

**Deactivate (pause):** Settings → "Pause my account" → confirm → provider profile disappears from search instantly, shows "Currently unavailable." Reactivate anytime.

**Delete (permanent):** Settings → "Delete my account" → type "DELETE" to confirm → gone, data anonymised.

---

### Logic & Algorithm

**Deactivate — instant, reversible (identical logic to the original plan, no platform-specific change):**
```typescript
await supabase.from('profiles').update({ is_active: false }).eq('id', userId)
// search_providers RPC filters WHERE p.is_active = true — disappears immediately
// Reactivate: await supabase.from('profiles').update({ is_active: true }).eq('id', userId)
```

**Delete — permanent, runs in a Supabase Edge Function. ⚠️ REWRITTEN 2026-07-10 (Phase 23): the
original design here ("anonymise the profile row, keep ratings received") CANNOT run against the
as-built schema — `profiles.id REFERENCES auth.users ON DELETE CASCADE`, so the profile row cannot
survive the auth deletion, and since migration 029 every rating carries a NOT NULL `booking_id`
whose booking CASCADEs with either party. It also read gallery paths AFTER deleting the gallery rows
(an ordering bug). The as-built model is FULL ERASURE — deleting an account removes the pair-shared
history (bookings, chats, ratings given AND received) for both sides; live ★ aggregates recompute
automatically (the FRD's recalculation-on-removal requirement). The delete-warning sheet's copy says
this honestly. The deployed function (`supabase/functions/delete-account/index.ts`) does:**
```
1. Resolve the target from the CALLER'S JWT (never a body param — API_CONTRACT §5.5)
2. Read identifiers, then remove storage objects by {userId}/ prefix across every bucket
3. Clear the NO-ACTION FKs that would abort the cascade: contact_requests + notifications deleted;
   user_reports / review_reports reporter/reported links NULLed (report rows survive for moderation)
4. Scrub PII from admin-only tables: signup_otps (by mobile), login_attempts (by lower(email))
5. Insert the audit_log 'account_deleted' record (the one row that SHOULD survive)
6. auth.admin.deleteUser(userId) — cascades profiles → pets, services, gallery, saved (both
   directions), blocks, consents, prefs, emergency contacts, verifications, bookings (both parties)
   → OTPs / pings / ratings → messages. Revokes all sessions.
```

**After deletion, the client must also clear its local secure session (SecureStore), since the
account no longer exists server-side:**
```typescript
await supabase.auth.signOut()   // clears secureStorage keys via lib/secureStore.ts
```

---

### What's needed to build

**Files:**
- `app/settings/index.tsx` — deactivate + delete account UI
- `supabase/functions/delete-account/index.ts` — Edge Function (service role key)
- `components/modals/DeleteAccountModal.tsx` — type "DELETE" confirmation

---

## 20. View Profile as Public

### What the user experiences

Pet Buddies see a "Preview my profile" link in profile settings, opening their own profile with a banner: "You are previewing your profile as a visitor." Contact fields render exactly as a logged-out visitor would see them.

---

### Logic & Algorithm

**Expo Router supports query params on dynamic routes the same way Next.js does — `router.push` with a query string, read via `useLocalSearchParams`:**
```typescript
// From profile/edit.tsx
router.push(`/profile/${userId}?preview=public`)

// In app/profile/[id].tsx
const { id, preview } = useLocalSearchParams<{ id: string; preview?: string }>()
const isOwner = session?.user.id === profile?.id
const isPreview = preview === 'public' && isOwner

const contactData = isPreview
  ? resolveContact(profile, false)   // force logged-out view, most restrictive
  : resolveContact(profile, !!session)
```

**No DB changes needed** — purely a client-side rendering mode.

---

### What's needed to build

**Files:**
- Update `app/profile/[id].tsx` — handle `?preview=public` param
- `components/profile/PreviewBanner.tsx`

---

## 21. Empty States

> **Built (Phase 24, 2026-07-10):** `components/ui/EmptyState.tsx` — props grew to
> `{icon, title, body, action?, link?, variant?}`: `action` is the filled primary button below,
> `link` is the lighter text-link the load-failed states use for "Try again" (so ERROR states render
> through the same component, not just empties), and `variant` adds `center` (fills list bodies —
> BookingList, +not-found) and `compact` (section-level, e.g. the reviews section) to the default
> near-top placement. Icon is 48px per DESIGN §7.16 — the hand-rolled versions had drifted to 36px.
> Copy lives in content/ (System.empty / System.loadFailed / Errors), NOT in this component. The
> file list below kept its original pre-Phase-12 route names; as built it's applied across
> explore/saved/notifications/chat (tab + thread)/blocked/bookings/requests/schedule/booking-detail/
> new-booking/public-profile + `app/+not-found.tsx` (the 404 catch-all, also new this phase).

### What the user experiences

Every screen that can have zero results shows an icon, a short message, and an action button. No blank screens.

---

### Logic & Algorithm

```tsx
// components/ui/EmptyState.tsx
type Props = { icon: string; title: string; description: string; action?: { label: string; onPress: () => void } }

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <View className="items-center justify-center py-16 px-6">
      <Text className="text-5xl mb-3">{icon}</Text>
      <Text className="text-lg font-semibold mb-1">{title}</Text>
      <Text className="text-text-secondary text-center mb-4">{description}</Text>
      {action && (
        <Pressable onPress={action.onPress} className="bg-primary px-5 py-3 rounded-full">
          <Text className="text-white font-medium">{action.label}</Text>
        </Pressable>
      )}
    </View>
  )
}
```

**Screen → empty state mapping (unchanged content from the original plan):**
```
Search no results   → 🔍 "No providers nearby" · "No {service} found within {radius} km." · "Try {radius*2} km"
GPS denied           → 📍 "Location needed" · "Allow location access to find providers near you." · "Allow location" + "Enter city manually"
Saved empty           → ♡ "Nothing saved yet" · "Browse providers and tap ♡ to save them here." · "Browse providers" → search tab
No ratings yet        → ⭐ "No reviews yet" · "Share your profile to get your first review." · "Share profile" → shareProfile()
No pets (parent)      → 🐾 "Add your pet" · "Tell the community about your furry friend." · "Add pet" → /profile/edit#pets
No services (provider)→ 🏥 "List your services" · "Add your services so pet parents can find you." · "Add service" → /profile/edit#services
Notifications empty   → 🔔 "All caught up" · "You'll see activity here when things happen."
```

---

### What's needed to build

**Files:**
- `components/ui/EmptyState.tsx`
- Applied in: `app/(tabs)/search.tsx`, `app/dashboard/saved.tsx`, `app/(tabs)/activity.tsx`, `app/profile/[id].tsx`

---

## 22. App Icon, Splash Screen & OTA Updates

> Replaces the original web plan's "PWA Setup" section. A native app has no browser "Add to Home
> Screen" banner or service worker — the equivalents are the app icon/splash configured at build
> time, and EAS Update for shipping JS-only fixes without a store review.

### What the user experiences

The app already has a proper icon and launches with a branded splash screen — this is true from the first install, not something the user opts into like a PWA prompt. When a bug fix ships, it's applied silently the next time they open the app (no update prompt, no store visit) as long as the fix is JS-only.

---

### Logic & Algorithm

**App icon + splash — configured once in `app.json` (see android_app.md / ios_app.md for exact asset specs):**
```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": { "image": "./assets/splash.png", "resizeMode": "contain", "backgroundColor": "#3D6B4F" },
    "android": { "adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png", "backgroundColor": "#3D6B4F" } }
  }
}
```

```typescript
// app/_layout.tsx — keep splash visible until session/profile check resolves
import * as SplashScreen from 'expo-splash-screen'
SplashScreen.preventAutoHideAsync()
// ...after session + profile load:
SplashScreen.hideAsync()
```

**OTA updates — EAS Update replaces the service-worker/next-pwa mechanism entirely:**
```bash
eas update --branch production --message "Fixed search results not loading"
```
Users get the new JS bundle silently on next app open — no Play Store/App Store review needed. Use
this for bug fixes, copy changes, logic tweaks. **Do not** use it for anything that adds a new native
module or changes `app.json` permissions — those require a new store build.

---

### What's needed to build

**Files/assets:** `assets/icon.png` (1024×1024, no alpha), `assets/splash.png`, `assets/adaptive-icon.png` (Android foreground layer)

**Config:** `expo.updates.url` + `expo.runtimeVersion.policy` in `app.json` (see android_app.md's OTA Updates section for the exact block).

---

## 23. Legal Pages

> **Built (Phase 24, 2026-07-10):** `app/legal/{terms,privacy,about,contact,faq}.tsx` on a shared
> `components/legal/LegalLayout.tsx` (top bar + © footer with cross-links) + `LegalDocBody` renderer.
> Content is `content/legal.ts`, mirroring docs/TERMS_AND_PRIVACY.md (edit THAT first) — the two
> screen-legal.md verbatim clauses + the GPS clause are pinned by `lib/__tests__/legal.test.ts`. The
> root guard whitelists the `legal` group so all five work logged out (the signup links need that).
> Consent surface done: login/signup footers link both docs (`components/legal/LegalFooter.tsx`) and
> the signup consent checkboxes' doc names are tappable. Settings gained the LEGAL section (+ an
> About row beyond the spec's four — otherwise About has no logged-in entry). Both doc screens show
> an amber "draft — pending lawyer review" notice tied to this file's banner rule. Still open: the
> PUBLIC Privacy-Policy URL for the store listings (below) — that's a hosting task, not an app one.

### What the user experiences

Links to Terms and Privacy appear on the signup screen ("By signing up you agree to our Terms of Service and Privacy Policy") and in Settings → Legal (there is no persistent footer in a mobile app — that web pattern doesn't carry over). Each is a plain, readable, scrollable screen.

---

### Logic & Algorithm

These are static screens — no DB queries, no auth required, no SEO indexing concerns (native app, nothing to index):

```typescript
// app/legal/terms.tsx — static ScrollView
// app/legal/privacy.tsx
// app/legal/about.tsx
// app/legal/contact.tsx — mailto: link via Linking.openURL('mailto:support@petlife.in')
```

**Content source: TERMS_AND_PRIVACY.md** (added 2026-07-02) is the canonical draft — split it at its
Part 1 / Part 2-3 boundary into `privacy.tsx` (Part 1) and `terms.tsx` (Parts 2-3). It covers, beyond
the original GPS-only scope:
- "We collect your GPS coordinates when you use the location feature." (unchanged from the original plan)
- "Your exact location is never shared publicly. Only your neighbourhood name is visible to other users." (unchanged)
- "You can delete your location data by updating your profile or deleting your account." (unchanged)
- **New:** the background-location behavior during an in-progress booking (§29) — who can see it, when it starts/stops, and how it differs from the point-in-time location capture above
- **New:** what's collected for government ID verification (§28) and that only a masked reference is stored
- **New:** the independent-contractor / limitation-of-liability framing, and the explicit "no payment processing" statement

**⚠️ TERMS_AND_PRIVACY.md is a strong first draft, not final legal text** — it carries its own
warning banner and a list of specific things (retention period, liability-waiver enforceability) that
need an actual India-qualified lawyer's review before this goes in front of real users. Don't strip
that banner out of the in-app screens without that review having happened.

**Must be linked from:**
- Signup screen: "By continuing, you agree to our Terms and Privacy Policy" (tappable inline text)
- Settings → Legal section
- The DigiLocker verification consent step (§28) should link directly to the Privacy Policy's
  government ID section, since that's the point a provider is actually being asked to consent to it

**Also needed for store submission (not just in-app):** both Play Console and App Store Connect
require a **publicly reachable URL** for the Privacy Policy (see android_app.md / ios_app.md Store
Listing checklists) — the in-app screen alone does not satisfy this. Host the same text at a simple
public URL (a GitHub Gist or a one-page static site is enough for v1).

---

### What's needed to build

**Files:**
- `app/legal/terms.tsx`, `privacy.tsx`, `about.tsx`, `contact.tsx` — content from TERMS_AND_PRIVACY.md
- A publicly hosted copy of the Privacy Policy (URL for store listings)
- Legal review of TERMS_AND_PRIVACY.md before public launch (not a code task, but a launch blocker)

---

## 24. Admin Moderation

### What the user experiences (admin — you)

No custom UI in v1. Log into the Supabase dashboard, Table Editor, review:
- `user_reports` where `is_reviewed = false`
- `ratings` where `is_flagged = true`

Clear the flag, or set the user's `is_active = false` to deactivate bad actors.

Also review, less often: `profiles` where `flagged_for_reregistration_review = true` — a new signup
whose verified mobile number hashes to a match in `banned_identifiers` (migration 025, added
2026-07-04 per FRD US-D03). And when actually banning someone, manually insert a row into
`banned_identifiers` hashing their mobile number (and government-ID reference, if they had one) so a
future re-registration attempt gets caught — there's no automated ban action in v1 to do this for you.

---

### Logic & Algorithm

**v1 admin workflow — done directly in Supabase dashboard, unchanged from the original plan (this workflow has no client-platform dependency at all):**
```sql
SELECT r.*, rp1.name AS reporter_name, rp2.name AS reported_name
FROM user_reports r
JOIN profiles rp1 ON rp1.id = r.reporter_id
JOIN profiles rp2 ON rp2.id = r.reported_id
WHERE is_reviewed = false
ORDER BY created_at DESC;

UPDATE profiles SET is_active = false WHERE id = '{user_id}';
UPDATE ratings SET is_flagged = false WHERE id = '{rating_id}';
UPDATE user_reports SET is_reviewed = true WHERE id = '{report_id}';

-- At ban time (migration 025) — hash and record the identifier so re-registration is caught:
INSERT INTO banned_identifiers (mobile_hash, govt_id_hash, original_profile_id)
VALUES (encode(digest('{their_mobile_number}', 'sha256'), 'hex'), NULL, '{user_id}');
```

**Service role key:** Never bundled into the app (`EXPO_PUBLIC_*` vars are compiled into the JS
bundle and are not a safe place for it). Only used in Edge Functions, as a Deno environment variable.

---

### What's needed to build

**v1:** Nothing to build — use Supabase dashboard directly.
**v2:** `app/admin/index.tsx` behind an admin role check.

---

## 25. Role Switching (Pet Parent ⇄ Pet Buddy)

### What the user experiences

A pet parent who also walks dogs on weekends doesn't need a second account. In Settings, they tap
"Also become a Service Provider," complete the provider onboarding steps (services, working hours,
government ID verification — §28), and from then on a switcher on the Home tab lets them flip between
"Pet Parent" and "Service Provider" mode. Switching changes the bottom tab content, the dashboard, and
what "Home" shows — search + bookings-you-made in one mode, incoming requests + your listings in the
other — but it's still one login, one profile edit screen, one notification feed.

---

### Logic & Algorithm

**Schema (migration 010) — `profiles.role` is deprecated; use the two independent flags plus a
current-mode field:**
```typescript
// A profile can be neither (mid-onboarding), one, or both.
is_pet_parent: boolean
is_provider: boolean
active_role: 'pet_parent' | 'provider' | null
```

**Enabling the second role (no new signup, no new row — same profile):**
```typescript
// lib/roles.ts
export const enableProviderRole = async (userId: string) => {
  await supabase.from('profiles').update({ is_provider: true, active_role: 'provider' }).eq('id', userId)
  // Caller then routes into the provider onboarding steps (services, hours, DigiLocker — reuses
  // the same step components as initial signup, just entered from Settings instead of /onboarding)
}

export const setActiveRole = async (userId: string, role: 'pet_parent' | 'provider') => {
  await supabase.from('profiles').update({ active_role: role }).eq('id', userId)
}
```

**Root layout reads `active_role`, not a single `role`, to decide which tab set to render:**
```typescript
// app/(tabs)/_layout.tsx
const { profile } = useProfile()
const isProviderMode = profile?.active_role === 'provider'

return (
  <Tabs>
    <Tabs.Screen name="index" options={{ title: isProviderMode ? 'Requests' : 'Home' }} />
    <Tabs.Screen name="search" options={{ href: isProviderMode ? null : undefined }} />  {/* hide Search tab in provider mode */}
    <Tabs.Screen name="bookings" />
    <Tabs.Screen name="activity" />
    <Tabs.Screen name="me" />
  </Tabs>
)
```

**Nothing about switching modes changes which rows a user owns.** A `bookings` row is always scoped
by `pet_parent_id`/`provider_id`, a `ratings` row by `rater_id`/`ratee_id` — switching `active_role`
only changes what the UI shows by default (e.g. "My Bookings" filters to bookings where you're the
`pet_parent_id` in pet-parent mode, or the `provider_id` in provider mode); it never merges or hides
underlying data.

---

### What's needed to build

**Files:**
- `components/settings/RoleSwitcher.tsx` — the Pet Parent ⇄ Service Provider toggle
- `app/settings/become-provider.tsx` — entry point that re-runs the provider onboarding steps for an
  existing pet-parent-only account
- `lib/roles.ts` — `enableProviderRole()`, `setActiveRole()`
- `hooks/useProfile.ts` — must expose `is_pet_parent` / `is_provider` / `active_role`, not a single `role`

**DB:** `profiles.is_pet_parent`, `is_provider`, `active_role` — migration 010. `provider_services`
RLS now checks `is_provider = true` instead of `role = 'provider'` (also migration 010) — any code
still checking the deprecated `role` column against `provider_services` writes will silently fail.

---

## 26. Booking Flow

### What the user experiences

Instead of just "Request Contact," a pet parent viewing a verified provider's profile sees "Book."
Tapping it opens a short form: pick a pet, a service (pre-filtered to what that provider offers), a
date/time, the address, and an optional note. Submit → the provider gets a notification with Accept /
Decline. If accepted, both sides see the booking move through its lifecycle on a shared "Booking
Detail" screen — this is also where the OTP exchange (§27) and live map (§29) live once the booking is
under way.

---

### Logic & Algorithm

**Creating a booking:**
```typescript
// lib/bookings.ts
export const createBooking = async (params: {
  providerId: string; serviceType: ServiceType; petId: string;
  scheduledAt: string; addressText: string; notes?: string; priceQuoted?: string
}) => {
  // Geocode addressText via Nominatim (same client-side call used elsewhere, ARCHITECTURE.md §2.5) —
  // lat/lng feed the Start-OTP geofence check (§27, migration 022). Nullable: if geocoding fails, the
  // booking is still created and the geofence check simply no-ops later.
  const geocoded = await geocodeAddress(params.addressText).catch(() => null)

  const { data, error } = await supabase.from('bookings').insert({
    pet_parent_id: session.user.id,
    provider_id: params.providerId,
    service_type: params.serviceType,
    pet_id: params.petId,
    scheduled_at: params.scheduledAt,
    address_text: params.addressText,
    lat: geocoded?.lat ?? null,
    lng: geocoded?.lng ?? null,
    notes: params.notes ?? null,
    price_quoted: params.priceQuoted ?? null,
    // status defaults to 'requested'
  }).select().single()
  if (error) throw error

  await supabase.from('notifications').insert({
    user_id: params.providerId,
    type: 'booking_requested',
    title: 'New booking request',
    body: `A booking request for ${params.serviceType} is waiting for your response`,
    related_id: data.id,
  })
  return data
}
```

**Provider accepts/declines (updated 2026-07-04 — catches the double-booking constraint from
migration 027):**
```typescript
export const respondToBooking = async (bookingId: string, decision: 'accepted' | 'declined') => {
  const { error } = await supabase.from('bookings')
    .update({ status: decision })
    .eq('id', bookingId)
    .eq('provider_id', session.user.id)   // RLS also enforces this
  if (error) {
    if (error.code === '23505') {  // unique_violation on bookings_no_double_book
      throw new Error('You already have a booking at this exact time — decline or reschedule one first.')
    }
    throw error
  }
}
```

**Requests unaddressed for 24 hours auto-expire** via a scheduled job (pg_cron/timed Edge Function,
not client code — see DATABASE_MIGRATIONS.md migration 027). The booking list UI just needs to render
the `'expired'` status alongside the existing ones; no new client logic beyond that.

**Aggression/bite disclosure on the incoming request (added 2026-07-04, FRD US-C01):** the booking
request card the provider sees reads the matched pet's `has_bite_history`/`bite_history_notes`
(migration 021) and renders a visible warning badge when true — this is informational, not a block;
the provider can still accept.

**Cancellation (either party, only while `requested` or `accepted` — not once `in_progress`):**
```typescript
export const cancelBooking = async (bookingId: string, reason: string) => {
  const { error } = await supabase.from('bookings')
    .update({ status: 'cancelled', cancelled_by: session.user.id, cancellation_reason: reason.slice(0, 200) })
    .eq('id', bookingId)
    .in('status', ['requested', 'accepted'])   // app-layer guard; add a DB CHECK before v2 if abuse appears
  if (error) throw error
}
```

**Booking list, scoped by the current `active_role` (§25) — not by which rows technically exist:**
```typescript
export const getMyBookings = async (userId: string, activeRole: 'pet_parent' | 'provider') => {
  const column = activeRole === 'pet_parent' ? 'pet_parent_id' : 'provider_id'
  const { data, error } = await supabase.from('bookings').select('*').eq(column, userId).order('scheduled_at', { ascending: false })
  if (error) throw error
  return data
}
```

**No payment step anywhere in this flow.** `price_quoted` is stored and displayed, never charged —
see PROJECT_PLAN.md §23 for why payment processing is explicitly out of v1.

---

### What's needed to build

**Files:**
- `app/bookings/new/[providerId].tsx` — booking creation form
- `app/bookings/[id].tsx` — booking detail (status, OTP UI, live map)
- `app/(tabs)/bookings.tsx` — booking list, scoped by `active_role`
- `components/bookings/BookingCard.tsx`, `BookingStatusBadge.tsx`
- `lib/bookings.ts` — `createBooking()`, `respondToBooking()`, `cancelBooking()`, `getMyBookings()`

**DB:** `bookings` table — migration 011.

---

## 27. Dual-OTP Session Validation

### What the user experiences

The Pet Buddy arrives. On the booking detail screen, the pet parent taps "Start Session" — a large
6-digit code appears on their screen, meant to be read aloud, not shown to the Pet Buddy's device
directly. The Pet Buddy taps "Enter Start Code" on their own screen, types the digits the pet parent
just told them, and submits. On success, the booking flips to "In Progress" and (for mobile services)
the live map appears. At the end, the same exchange happens again with "Complete Session."

---

### Logic & Algorithm

**Generating a code — only the pet parent on this booking can call this, and it's shown to them once:**
```typescript
// lib/otp.ts
export const generateSessionOtp = async (bookingId: string, otpType: 'start' | 'complete'): Promise<string> => {
  const { data, error } = await supabase.rpc('generate_booking_otp', {
    p_booking_id: bookingId,
    p_otp_type: otpType,
  })
  if (error) throw error
  return data as string   // the plaintext 6-digit code — display it, do not persist it client-side either
}
```

**Verifying a code — only the provider on this booking can call this. Updated 2026-07-04 (FRD
US-G01): a Start-OTP verification also captures a one-shot GPS fix and must be within 150m of the
booking location, enforced inside the RPC itself (migration 022) — the client just needs to pass the
coordinates, not implement the distance check:**
```typescript
export const verifySessionOtp = async (
  bookingId: string,
  otpType: 'start' | 'complete',
  code: string
): Promise<boolean> => {
  let coords: { lat: number; lng: number } | undefined
  if (otpType === 'start') {
    const location = await Location.getCurrentPositionAsync({})  // expo-location, same permission as §29
    coords = { lat: location.coords.latitude, lng: location.coords.longitude }
  }

  const { data, error } = await supabase.rpc('verify_booking_otp', {
    p_booking_id: bookingId,
    p_otp_type: otpType,
    p_code: code,
    p_lat: coords?.lat,
    p_lng: coords?.lng,
  })
  if (error) throw error
  return data as boolean   // false on wrong code, expired code, lockout, or failed geofence — the RPC never throws for those, only for a wrong caller
}
```

A geofence failure and a wrong code both return `false` — the UI distinguishes them by comparing the
provider's own GPS to the booking's `lat`/`lng` client-side (same values already fetched for the
booking detail screen) before showing an error, so "you need to be at the service location" and
"incorrect code" aren't confused (see UI states below).

**Why this is a pair of Postgres RPCs and not two plain table queries:** the whole point is that
neither party's client can read the stored code (there is no SELECT policy on `booking_otps` at all —
see DATABASE_MIGRATIONS.md migration 011), and the 5-attempt lockout has to be enforced somewhere the
client can't bypass by just calling the insert/select API directly. Putting both the hash comparison
and the attempt counter inside a `SECURITY DEFINER` function closes that gap from day one, instead of
discovering it in a security audit later the way §12's contact-visibility gap and §10's rate-limiting
gap were originally found (see SECURITY_AUDIT.md).

**UI states to handle:**
```typescript
// A wrong code returns `false`, not an error — show "Incorrect code, try again" and let them retry
// (up to 5 times total; a 6th attempt returns false permanently until a new code is generated)
// An expired code (30 min) also returns `false` — show "Code expired, ask them to generate a new one"
const success = await verifySessionOtp(bookingId, 'start', enteredCode)
if (!success) {
  setError('Incorrect or expired code. Ask the pet parent to check and try again.')
}
```

---

### What's needed to build

**Files:**
- `components/bookings/OtpDisplay.tsx` — large code display for the pet parent, with a "regenerate" option once expired
- `components/bookings/OtpEntry.tsx` — 6-digit input for the provider, with retry/lockout messaging
- `lib/otp.ts` — `generateSessionOtp()`, `verifySessionOtp()`

**DB:** `booking_otps` table, `generate_booking_otp()` / `verify_booking_otp()` RPCs — migration 011,
extended with the GPS-geofence parameters in migration 022.

---

## 28. Pet Buddy Government ID Verification (DigiLocker)

### What the user experiences

During Pet Buddy onboarding (or later from Settings), a step reads: "Verify your identity — required
before you can be found in search." Tapping "Verify with DigiLocker" opens a browser overlay to
DigiLocker's own consent screen (a government service, not a Petlife-branded page) where the Pet Buddy
signs in and picks which document to share (typically Aadhaar). They're returned to the app, and the
step shows "Verification pending" — usually resolved within moments, occasionally requiring manual
follow-up. Until it shows "Verified," their profile is saved but does not appear in anyone's search.

---

### Logic & Algorithm

**OAuth-style consent flow — reuses the exact deep-link pattern already established for Google
Sign-In (§1), just pointed at DigiLocker instead of Google:**
```typescript
// lib/verification.ts
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'

export const startDigiLockerVerification = async () => {
  const redirectUri = Linking.createURL('verification/digilocker-callback')
  const authUrl = buildDigiLockerAuthUrl(redirectUri)   // client ID + scope, from DigiLocker Partner registration
  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri)
  if (result.type === 'success') {
    const { code } = Linking.parse(result.url).queryParams
    // Hand the code to an Edge Function — never exchange it for a token on-device, the DigiLocker
    // client secret must never ship inside the app bundle (same rule as any OAuth client secret)
    await supabase.functions.invoke('digilocker-callback', { body: { code } })
  }
}
```

**Edge Function does the actual token exchange + document pull (server-side only — this is where the
DigiLocker Partner client secret lives, as a Deno environment variable, never in the app):**
```typescript
// supabase/functions/digilocker-callback/index.ts
// 1. Exchange `code` for a DigiLocker access token
// 2. Pull the consented document reference (NOT the full document/number)
// 3. Insert into provider_verifications: document_type, digilocker_doc_id, masked_id_number (last 4
//    digits only — never store the full Aadhaar/PAN number), status: 'pending' or 'verified'
//    depending on what DigiLocker's response indicates
// 4. The sync_provider_verified_flag trigger (migration 012) keeps profiles.is_govt_id_verified
//    in sync automatically once status becomes 'verified' — no separate client call needed
```

**Checking verification status (polled once on the verification screen, not repeatedly):**
```typescript
export const getVerificationStatus = async (providerId: string) => {
  const { data } = await supabase
    .from('provider_verifications')
    .select('status, rejected_reason, verified_at')
    .eq('provider_id', providerId)
    .maybeSingle()
  return data   // null = never started verification
}
```

**Sequencing note (see PROJECT_PLAN.md §9B and ROADMAP.md):** DigiLocker Partner registration
(partners.digitallocker.gov.in) is a real-world onboarding step with its own lead time — it is not
something that can be stood up in an afternoon like a Supabase table. Build the booking loop (§26/§27)
and the manual-review fallback below in parallel with that registration, not after it.

**Manual-review fallback, for while DigiLocker Partner access is pending or as a permanent backup
path:** a provider can instead upload a photo of their government ID; it creates the same
`provider_verifications` row (`method: 'manual'`) with `status: 'pending'`, and an admin approves it
by hand via the Supabase dashboard (same pattern as §24's admin moderation) — flip `status` to
`'verified'` and the trigger does the rest.

---

### What's needed to build

**Files:**
- `app/verification/digilocker.tsx` — the consent-flow trigger + pending/verified/rejected states
- `components/onboarding/VerificationStep.tsx` — provider onboarding step wrapping the above
- `lib/verification.ts` — `startDigiLockerVerification()`, `getVerificationStatus()`
- `supabase/functions/digilocker-callback/index.ts` — token exchange + document pull, service role
- Manual fallback: reuse `lib/camera.ts`/`lib/storage.ts` (§5) for the ID photo upload path

**DB:** `provider_verifications` table, `profiles.is_govt_id_verified`, `sync_provider_verified_flag()`
trigger — migration 012.

**External:** DigiLocker Partner Program registration (free, but has its own approval lead time).

---

## 29. Live GPS Tracking During a Session

### What the user experiences

Once the Start OTP is verified on a mobile/off-premises booking (a walk, a taxi trip, an at-home
training session), the pet parent's booking detail screen shows a live map with the Pet Buddy's current
position, updating every few seconds for the duration of the session. The Pet Buddy's screen shows a
persistent "Session in progress — location sharing active" banner. Tracking stops the moment the
Complete OTP is verified.

> **Reminder of the product trade-off made here (PROJECT_PLAN.md §9C):** this requires the Pet Buddy to
> grant *background*, not just foreground, location access — a real, separate permission tier on both
> Android and iOS, with its own store-review requirements. See android_app.md / ios_app.md for the
> exact permission strings and the Play Console background-location declaration this triggers.

---

### Logic & Algorithm

**Two separate data paths — do not conflate them:**
1. **Live feed** (what the pet parent's map actually renders): a Supabase Realtime broadcast channel,
   ephemeral, never touches Postgres.
2. **Audit trail** (`booking_location_pings`): a sparse, sampled row every 2-3 minutes, purely for
   dispute resolution — not what drives the live map.

**Provider side — background location task, registered via `expo-task-manager`:**
```typescript
// lib/tracking.ts
import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'

const LOCATION_TASK = 'petlife-session-tracking'
let lastPingAt = 0

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return
  const { locations } = data as { locations: Location.LocationObject[] }
  const loc = locations[locations.length - 1]
  if (!loc || !activeBookingId) return

  // Live feed — every update, no DB write
  supabase.channel(`booking:${activeBookingId}`).send({
    type: 'broadcast', event: 'location',
    payload: { lat: loc.coords.latitude, lng: loc.coords.longitude },
  })

  // Sparse audit trail — sampled, not every tick
  const now = Date.now()
  if (now - lastPingAt > 2 * 60 * 1000) {
    lastPingAt = now
    await supabase.from('booking_location_pings').insert({
      booking_id: activeBookingId, lat: loc.coords.latitude, lng: loc.coords.longitude,
    })
  }
})

export const startSessionTracking = async (bookingId: string) => {
  const fg = await Location.requestForegroundPermissionsAsync()
  if (fg.status !== 'granted') return false
  const bg = await Location.requestBackgroundPermissionsAsync()   // separate prompt, separate consent screen
  if (bg.status !== 'granted') return false

  activeBookingId = bookingId
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 5000,
    foregroundService: {   // Android requirement for a background location task
      notificationTitle: 'Petlife',
      notificationBody: 'Sharing your location for an active booking',
    },
  })
  return true
}

export const stopSessionTracking = async () => {
  activeBookingId = null
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK)
  }
}
```
Call `startSessionTracking()` immediately after a successful `verify_booking_otp(..., 'start', ...)`
and `stopSessionTracking()` immediately after a successful `'complete'` verification — tracking must
never be active outside those two events.

**Pet parent side — subscribe to the broadcast channel, no permissions needed (they aren't the ones
being tracked):**
```typescript
useEffect(() => {
  const channel = supabase.channel(`booking:${bookingId}`)
    .on('broadcast', { event: 'location' }, ({ payload }) => setProviderPosition(payload))
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [bookingId])
```

**Permission request sequencing matters:** always request foreground location first, and only request
background as a distinct follow-up step with its own explanation screen ("We need background access
so tracking continues if your screen locks during the session") — requesting background location
outright, with no foreground step first, is both a worse user experience and something both Android
and iOS platform review may flag.

---

### What's needed to build

**Files:**
- `lib/tracking.ts` — `startSessionTracking()`, `stopSessionTracking()`, the background task definition
- `components/bookings/LiveMap.tsx` — pet-parent-side map, subscribes to the broadcast channel
- `components/bookings/TrackingActiveBanner.tsx` — provider-side "location sharing active" indicator
- Wire `startSessionTracking()`/`stopSessionTracking()` into the OTP verification success handlers (§27)

**Packages:** `expo-location`, `expo-task-manager`

**DB:** `booking_location_pings` table — migration 013. No new table for the live feed — it's a
Supabase Realtime channel, configured on the Supabase project (Realtime is enabled by default on the
free tier, no schema change needed).

**Platform setup:** background location permission strings + Play Console declaration (Android) /
"Always" authorization + background modes capability (iOS) — see android_app.md / ios_app.md.

---

## 30. In-App Chat

> **Moved into v1 scope 2026-07-02** (was previously "not in v1, v3+" — see PROJECT_PLAN.md §23). The
> redesigned 60-screen inventory puts a Chat tab in both bottom-nav modes as core navigation. Built as a
> plain table + Realtime subscription, the same free pattern as live booking location (§29) — no
> third-party chat SaaS, so the original cost objection this was deferred for doesn't actually apply to
> this minimal a version.

### What the user experiences

A Chat tab in the bottom nav shows a flat list of conversations (most recent message first, unread
count badge). Tapping one opens a standard message thread — text only in v1, no attachments, no typing
indicators, no read receipts beyond a single "seen" mark. A conversation can be started from a Pet Buddy
profile ("Message" button, alongside the existing contact-request flow), or from an active booking
("Message Pet Buddy"/"Message pet parent" on the booking detail screen).

---

### Logic & Algorithm

**Sending a message:**
```typescript
export const sendMessage = async (recipientId: string, body: string, bookingId?: string) => {
  const { error } = await supabase.from('messages').insert({
    sender_id: (await supabase.auth.getUser()).data.user!.id,
    recipient_id: recipientId,
    booking_id: bookingId ?? null,
    body,
  })
  if (error) throw error
}
```

**Live delivery — Realtime subscription on the conversation, not polling (same pattern as §29's
provider-location broadcast, but this one reads real inserted rows via Postgres Changes, not a
broadcast channel, since messages need to persist):**
```typescript
useEffect(() => {
  const channel = supabase.channel(`messages:${[myId, otherUserId].sort().join(':')}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages',
        filter: `sender_id=eq.${otherUserId}` },
      (payload) => setMessages(prev => [...prev, payload.new])
    )
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [otherUserId])
```

**Conversation list query** (grouped by the other participant — no threads table, so this is a client-
side group-by over a query ordered by `created_at DESC`, not a single indexed lookup):
```typescript
const { data } = await supabase
  .from('messages')
  .select('*')
  .or(`sender_id.eq.${myId},recipient_id.eq.${myId}`)
  .order('created_at', { ascending: false })
// Group by the other participant client-side; take the first (most recent) message per group
```

**Marking read:** update `is_read = true` on the recipient's unread rows when the thread screen opens.

---

### What's needed to build

**Files:**
- `app/(tabs)/chat/index.tsx` — conversation list
- `app/chat/[userId].tsx` — message thread
- `lib/chat.ts` — `sendMessage()`, `getConversations()`, `markRead()`
- "Message" button added to `components/provider/ProfileActions.tsx` and the booking detail screen

**DB:** `messages` table — migration 018. RLS restricts read/insert to the two parties; insert is
blocked if either party has blocked the other (reuses `user_blocks`, §17).

**Packages:** none new — Supabase Realtime is already a dependency (§29).

**Cost: ₹0** — same free Postgres + RLS + Realtime pattern as the rest of this app.

---

## Summary — Build Order

Matches ROADMAP.md's phases — build in this sequence so each layer depends on the previous one being stable:

| Phase | Features |
|---|---|
| **Phase 0 — Setup** | Expo project, EAS, Supabase connection, DB schema deployed, DigiLocker Partner registration kicked off (lead time — start early) |
| **Phase 1 — Foundation** | Auth (all methods) · Dual-role onboarding wizard (§25) · GPS capture · Profile system · Image upload |
| **Phase 2 — Core Loop** | Search (GPS + PostGIS RPC) · Pet Buddy profile screen · Rating system · Contact system |
| **Phase 3 — Booking Loop** | Booking flow (§26) · Dual-OTP session validation (§27) · Pet Buddy government ID verification (§28) · Live GPS tracking (§29) |
| **Phase 4 — Trust & Engagement** | Working hours · Gallery · Saved Pet Buddies · Share · Notifications · Pet Buddy reply · In-app chat (§30) |
| **Phase 5 — Safety & Legal** | Block · Report · Account deactivation/deletion · Legal pages (TERMS_AND_PRIVACY.md) · Empty states · Map view |
| **Phase 6 — Android Launch** | App icon/splash · Background-location Play Console declaration · Play Store submission (android_app.md) |
| **Phase 7 — iOS Launch** | Sign in with Apple · Background-location "Always" justification · App Store submission (ios_app.md) |

> Phase 3 (Booking Loop) is new as of 2026-07-02 — it did not exist when the app was discovery-only.
> It depends on Phase 2's search/profile screens (you need a provider to book) but Phase 4/5 do not
> depend on Phase 3, so a team could parallelize Phase 3 against Phase 4 if there's more than one
> builder. A solo builder should still do them in order — Phase 3 is the highest-risk phase (DigiLocker
> integration + background location) and surfacing problems there early is worth more than shipping
> Phase 4's lower-risk trust features first.
