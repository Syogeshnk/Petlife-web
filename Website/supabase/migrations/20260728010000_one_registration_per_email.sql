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
