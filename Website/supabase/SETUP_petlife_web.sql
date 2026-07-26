-- =====================================================================
-- PETLIFE WEB — one-paste database setup
--
-- Run this in the SQL editor of the Petlife project (syogeshnk account).
-- It creates ONLY the website's own tables, all prefixed `website_`, plus a
-- private `resumes` storage bucket.
--
-- SAFE TO RUN ON THE APP'S PROJECT:
--   * Everything is CREATE ... IF NOT EXISTS / ON CONFLICT DO NOTHING.
--   * It creates no app tables and alters none. It only ever touches objects
--     named website_* and the `resumes` bucket.
--   * Re-running it is harmless.
--
-- This is migrations 20260725 / 20260726 / 20260727 / 20260728 concatenated.
-- =====================================================================


-- ========================= 1. CONTACT + PET BUDDY =========================

create extension if not exists pgcrypto;

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

create index if not exists website_contact_messages_created_at_idx
  on public.website_contact_messages (created_at desc);
create index if not exists website_buddy_applications_created_at_idx
  on public.website_buddy_applications (created_at desc);
create index if not exists website_buddy_applications_service_idx
  on public.website_buddy_applications (service);

-- RLS on with zero policies = only the service role (the edge function) can
-- read or write. The browser never touches these tables directly.
alter table public.website_contact_messages   enable row level security;
alter table public.website_buddy_applications enable row level security;

revoke all on public.website_contact_messages   from anon, authenticated;
revoke all on public.website_buddy_applications from anon, authenticated;


-- ============================ 2. CAREERS ==================================

create table if not exists public.website_job_applications (
  id               uuid primary key default gen_random_uuid(),
  name             text        not null check (char_length(trim(name)) between 2 and 120),
  phone            text        not null check (char_length(trim(phone)) between 6 and 24),
  email            text        not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  position         text        not null,
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

-- Private bucket for resumes: no storage policies, so only the service role
-- can read or write objects here.
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;


-- ==================== 3. EXPERIENCE BAND + 5 ROLES ========================

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

-- All five open roles, including the Junior Content Creator & Pet Storyteller.
alter table public.website_job_applications
  drop constraint if exists website_job_applications_position_check;

alter table public.website_job_applications
  add constraint website_job_applications_position_check
  check (position in
    ('ui_ux_designer','test_engineer','digital_brand_marketing','seo','content_creator'));

comment on column public.website_job_applications.position is
  'Role applied for: ui_ux_designer | test_engineer | digital_brand_marketing | seo | content_creator.';


-- ============================== 4. CHECK ==================================
-- Should return the three website_ tables and nothing else.
select table_name
from information_schema.tables
where table_schema = 'public' and table_name like 'website\_%'
order by table_name;
