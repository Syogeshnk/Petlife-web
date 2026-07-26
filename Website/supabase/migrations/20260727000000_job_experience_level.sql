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
