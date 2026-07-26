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
