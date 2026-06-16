-- Zardonic Industrial – Schema Extension
-- =========================================
-- Adds: music_highlights, merchandise, soundpacks, newsletter_subscribers
-- Extends: partners (already has category), site_config (already exists)

-- music_highlights (YouTube videos / playlists to showcase)
create table if not exists public.music_highlights (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  youtube_url text not null,
  description text,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.music_highlights enable row level security;
create policy "Public read music_highlights"
  on public.music_highlights for select using (active = true);
create policy "Admin all music_highlights"
  on public.music_highlights
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- merchandise (square grid items with external link)
create table if not exists public.merchandise (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_storage_path text,
  image_url text,
  external_url text,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.merchandise enable row level security;
create policy "Public read merchandise"
  on public.merchandise for select using (active = true);
create policy "Admin all merchandise"
  on public.merchandise
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- soundpacks (sample packs / presets / synth factory presets)
create table if not exists public.soundpacks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_storage_path text,
  image_url text,
  external_url text,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.soundpacks enable row level security;
create policy "Public read soundpacks"
  on public.soundpacks for select using (active = true);
create policy "Admin all soundpacks"
  on public.soundpacks
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- newsletter_subscribers (opt-in list; consent_given required)
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  consent_given boolean not null default true,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);
alter table public.newsletter_subscribers enable row level security;
-- No public read – admin only
create policy "Admin all newsletter_subscribers"
  on public.newsletter_subscribers
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
-- Allow anonymous inserts for subscription (email + consent only)
create policy "Public subscribe"
  on public.newsletter_subscribers for insert with check (consent_given = true);

-- Seed default site_config entries (idempotent)
insert into public.site_config (key, value) values
  ('hero', '{"headline":"ZARDONIC","tagline":"Industrial Metal / Drum & Bass","ctaLabel":"Listen Now","ctaUrl":"#music"}'::jsonb),
  ('newsletter', '{"heading":"Mailing List","body":"Subscribe to get the latest news, releases and exclusive content."}'::jsonb),
  ('merchandise', '{"footerText":"Visit the official Zardonic Merchandise Store to get these and more!"}'::jsonb),
  ('footer', '{"impressumUrl":"/impressum","privacyUrl":"/privacy"}'::jsonb)
on conflict (key) do nothing;
