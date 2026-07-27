-- Public bucket for website marketing/preview images (app-screen mockups,
-- future illustrations, etc.) that need a stable public URL from the site's
-- static HTML. Unlike "resumes", this bucket is public and read-only for
-- everyone by default (no RLS policies needed for public buckets); only the
-- service role can write to it.

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;
