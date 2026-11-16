-- =====================================================================
-- PETLIFE WEBSITE: full database setup for a NEW, EMPTY Supabase project
-- (fazxqwlaxrahqpojousl, created 16 Nov 2026 after the old website project
-- umvsromotyjbrzykmqoh was paused).
--
-- Paste the whole file into that project's SQL editor and press Run.
-- It is all 7 files in migrations/, in order, unchanged. It creates only the
-- website_* tables and the `resumes` (private) and `site-media` (public)
-- storage buckets. Every statement is IF NOT EXISTS / ON CONFLICT, so running
-- it twice is harmless.
-- (SETUP_petlife_web.sql is older and lacks the last two migrations.)
-- =====================================================================


-- ========================= 20260725000000_website_forms.sql =========================

-- Website form submissions (petlifeindia.co marketing site)
-- Two public forms: "Contact us" and "Join as a Pet Buddy".
-- Rows are written ONLY by the submit-form edge function using the service-role
-- key. RLS is enabled with no policies, so anon/authenticated clients can
-- neither read nor write these tables directly.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- contact ---
create table if not exists public.website_contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null check (char_length(trim(name)) between 2 and 120),
  email       text        not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone       text                 check (phone is null or char_length(phone) <= 24),
  subject     text                 check (subject is null or char_length(subject) <= 160),
  message     text        not null check (char_length(trim(message)) between 5 and 4000),
  source_ip   inet,
  user_agent  text,
  email_sent  boolean     not null default false,
  created_at  timestamptz not null default now()
);

comment on table public.website_contact_messages is
  'Contact-form submissions from the marketing site. Notifications go to info@petlifeindia.co.';

-- ------------------------------------------------------- buddy applications ---
create table if not exists public.website_buddy_applications (
  id                uuid primary key default gen_random_uuid(),
  name              text        not null check (char_length(trim(name)) between 2 and 120),
  service           text        not null check (service in
                      ('walker','vet','pet_taxi','pet_shop','pet_boarding','trainer','groomer')),
  phone             text        not null check (char_length(trim(phone)) between 6 and 24),
  email             text        not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  location          text        not null check (char_length(trim(location)) between 2 and 160),
  experience_years  smallint    not null check (experience_years between 0 and 10),
  note              text                 check (note is null or char_length(note) <= 2000),
  source_ip         inet,
  user_agent        text,
  email_sent        boolean     not null default false,
  created_at        timestamptz not null default now()
);

comment on table public.website_buddy_applications is
  'Pet Buddy join-us applications from the marketing site. Notifications go to hr@petlifeindia.co.';

-- ------------------------------------------------------------------- index ---
create index if not exists website_contact_messages_created_at_idx
  on public.website_contact_messages (created_at desc);
create index if not exists website_buddy_applications_created_at_idx
  on public.website_buddy_applications (created_at desc);
create index if not exists website_buddy_applications_service_idx
  on public.website_buddy_applications (service);

-- --------------------------------------------------------------------- RLS ---
-- Enabled with zero policies: locked to the service role only.
alter table public.website_contact_messages   enable row level security;
alter table public.website_buddy_applications enable row level security;

revoke all on public.website_contact_messages   from anon, authenticated;
revoke all on public.website_buddy_applications from anon, authenticated;


-- ========================= 20260726000000_job_applications.sql =========================

-- Careers: job applications from the petlifeindia.co website.
-- Written only by the submit-form edge function (service role). Resumes go to a
-- private storage bucket; the row keeps the object path, never the file itself.

create table if not exists public.website_job_applications (
  id               uuid primary key default gen_random_uuid(),
  name             text        not null check (char_length(trim(name)) between 2 and 120),
  phone            text        not null check (char_length(trim(phone)) between 6 and 24),
  email            text        not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  position         text        not null check (position in
                     ('ui_ux_designer','test_engineer','digital_brand_marketing','seo')),
  cover_note       text        not null check (char_length(trim(cover_note)) between 10 and 3000),
  resume_path      text,
  resume_filename  text,
  source_ip        inet,
  user_agent       text,
  email_sent       boolean     not null default false,
  created_at       timestamptz not null default now()
);

comment on table public.website_job_applications is
  'Careers-page applications. Notifications go to hr@petlifeindia.co; resumes live in the private "resumes" bucket.';

create index if not exists website_job_applications_created_at_idx
  on public.website_job_applications (created_at desc);
create index if not exists website_job_applications_position_idx
  on public.website_job_applications (position);

alter table public.website_job_applications enable row level security;
revoke all on public.website_job_applications from anon, authenticated;

-- Private bucket for resumes. No storage policies are created, so only the
-- service role can read or write objects here.
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;


-- ========================= 20260727000000_job_experience_level.sql =========================

-- Careers form now asks for an experience level alongside the role.
-- Existing rows predate the field, so it stays nullable.

alter table public.website_job_applications
  add column if not exists experience_level text;

alter table public.website_job_applications
  drop constraint if exists website_job_applications_experience_level_check;

alter table public.website_job_applications
  add constraint website_job_applications_experience_level_check
  check (experience_level is null or experience_level in
    ('fresher', 'lt3', '3to6', '6to10', '10plus'));

comment on column public.website_job_applications.experience_level is
  'Self-reported experience band from the careers form: fresher | lt3 | 3to6 | 6to10 | 10plus.';


-- ========================= 20260727010000_job_positions_experienced_roles.sql =========================

-- Careers gained three experienced (non-internship) openings: UI/UX Engineer,
-- Mobile App Developer (Android & iOS), and AI Prompt Engineer (Claude Antigravity).
-- `position` is constrained to a fixed set, so the new values have to be admitted
-- before the form can submit them — the edge function re-validates against the
-- same list (supabase/functions/submit-form/index.ts POSITIONS).
--
-- Written as its own migration rather than editing an earlier one in place, so
-- it applies correctly regardless of which prior migrations have already run.

alter table public.website_job_applications
  drop constraint if exists website_job_applications_position_check;

alter table public.website_job_applications
  add constraint website_job_applications_position_check
  check (position in
    ('ui_ux_designer','test_engineer','digital_brand_marketing','seo','content_creator',
     'ui_ux_engineer','mobile_developer','prompt_engineer_ai'));

comment on column public.website_job_applications.position is
  'Role applied for: ui_ux_designer | test_engineer | digital_brand_marketing | seo | content_creator | ui_ux_engineer | mobile_developer | prompt_engineer_ai.';


-- ========================= 20260727020000_site_media_bucket.sql =========================

-- Public bucket for website marketing/preview images (app-screen mockups,
-- future illustrations, etc.) that need a stable public URL from the site's
-- static HTML. Unlike "resumes", this bucket is public and read-only for
-- everyone by default (no RLS policies needed for public buckets); only the
-- service role can write to it.

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;


-- ========================= 20260728000000_job_position_content_creator.sql =========================

-- Careers gained a fifth opening: Junior Content Creator & Pet Storyteller.
-- `position` is constrained to a fixed set, so the new value has to be admitted
-- before the form can submit it — the edge function re-validates against the
-- same list (supabase/functions/submit-form/index.ts POSITIONS).
--
-- Written as its own migration rather than editing 20260726000000 in place, so
-- it applies correctly whether or not that one has already run.

alter table public.website_job_applications
  drop constraint if exists website_job_applications_position_check;

alter table public.website_job_applications
  add constraint website_job_applications_position_check
  check (position in
    ('ui_ux_designer','test_engineer','digital_brand_marketing','seo','content_creator'));

comment on column public.website_job_applications.position is
  'Role applied for: ui_ux_designer | test_engineer | digital_brand_marketing | seo | content_creator.';


-- ========================= 20260728010000_one_registration_per_email.sql =========================

-- One registration per person, enforced in the database.
--
-- A browser-side guard is not enforcement: clearing storage, opening a private
-- window or switching device defeats it. These indexes are the actual rule; the
-- edge function turns the resulting 23505 into a readable message.
--
-- Indexed on lower(email) rather than email so Priya@x.com and priya@x.com are
-- one person. The edge function also lowercases before insert, so new rows are
-- already normalised and the index only has to cover historic mixed-case rows.
--
-- NOTE: if either table already holds two rows sharing an email, creating the
-- index fails and this migration stops. That is deliberate — resolving which
-- duplicate to keep is a judgement call, not something a migration should
-- silently make by deleting someone's application.

create unique index if not exists website_buddy_applications_email_uniq
  on public.website_buddy_applications (lower(email));

create unique index if not exists website_job_applications_email_uniq
  on public.website_job_applications (lower(email));

-- Contact messages are deliberately NOT unique-per-email: people legitimately
-- need to write in more than once, and blocking that would cut off customers.
-- Instead the edge function enforces a short cooldown per address, which needs
-- this index to stay cheap as the table grows.
create index if not exists website_contact_messages_email_created_idx
  on public.website_contact_messages (lower(email), created_at desc);

comment on index public.website_buddy_applications_email_uniq is
  'One Pet Buddy application per email address.';
comment on index public.website_job_applications_email_uniq is
  'One career application per email address.';
