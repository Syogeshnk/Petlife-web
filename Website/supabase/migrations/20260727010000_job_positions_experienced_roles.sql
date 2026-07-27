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
