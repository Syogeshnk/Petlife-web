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
