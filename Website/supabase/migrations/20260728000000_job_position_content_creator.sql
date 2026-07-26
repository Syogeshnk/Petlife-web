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
