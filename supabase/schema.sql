-- ============================================================
-- Zardonic Industrial – Full Database Schema
-- Run this once against a fresh Supabase project.
-- All tables use RLS; admin role is checked via profiles table.
-- ============================================================

-- ─── profiles (admin auth) ───────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null default 'user',
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Admin read" on public.profiles for select using (auth.uid() = id);

-- ─── releases ────────────────────────────────────────────────
create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'single', -- album | ep | single | remix | compilation
  release_date date,
  description text,
  cover_storage_path text,   -- R2 object path
  cover_url text,            -- legacy / external fallback
  streaming_links jsonb default '[]',
  artists text[] default '{}',
  itunes_id text unique,     -- iTunes collectionId / trackId for dedup on sync
  active boolean default true,
  display_order integer default 0,
  created_at timestamptz default now()
);
alter table public.releases enable row level security;
create policy "Public read releases" on public.releases for select using (active = true);
create policy "Admin all releases" on public.releases using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─── gigs ────────────────────────────────────────────────────
create table if not exists public.gigs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  venue text,
  city text,
  country text,
  event_date timestamptz not null,
  ticket_url text,
  festival_name text,
  description text,
  active boolean default true,
  created_at timestamptz default now()
);
alter table public.gigs enable row level security;
create policy "Public read gigs" on public.gigs for select using (active = true);
create policy "Admin all gigs" on public.gigs using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─── gallery ─────────────────────────────────────────────────
create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  storage_path text,         -- R2 object path (preferred)
  image_url text,            -- external fallback
  alt text,
  caption text,
  display_order integer default 0,
  active boolean default true,
  created_at timestamptz default now()
);
alter table public.gallery enable row level security;
create policy "Public read gallery" on public.gallery for select using (active = true);
create policy "Admin all gallery" on public.gallery using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─── bio ─────────────────────────────────────────────────────
create table if not exists public.bio (
  id uuid primary key default gen_random_uuid(),
  content text,
  updated_at timestamptz default now()
);
alter table public.bio enable row level security;
create policy "Public read bio" on public.bio for select using (true);
create policy "Admin all bio" on public.bio using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─── social_links ────────────────────────────────────────────
create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  label text,
  display_order integer default 0,
  active boolean default true
);
alter table public.social_links enable row level security;
create policy "Public read social" on public.social_links for select using (active = true);
create policy "Admin all social" on public.social_links using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─── partners ────────────────────────────────────────────────
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text,
  logo_storage_path text,
  logo_url text,
  category text default 'partner', -- partner | credit | endorsement
  display_order integer default 0,
  active boolean default true,
  created_at timestamptz default now()
);
alter table public.partners enable row level security;
create policy "Public read partners" on public.partners for select using (active = true);
create policy "Admin all partners" on public.partners using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─── site_config (key-value for all site settings) ───────────
create table if not exists public.site_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);
alter table public.site_config enable row level security;
create policy "Public read config" on public.site_config for select using (true);
create policy "Admin all config" on public.site_config using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─── music_highlights ────────────────────────────────────────
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

-- ─── merchandise ─────────────────────────────────────────────
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

-- ─── soundpacks ──────────────────────────────────────────────
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

-- ─── newsletter_subscribers ──────────────────────────────────
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  consent_given boolean not null default true,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);
alter table public.newsletter_subscribers enable row level security;
create policy "Admin all newsletter_subscribers"
  on public.newsletter_subscribers
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Public subscribe"
  on public.newsletter_subscribers for insert with check (consent_given = true);

-- ─── Trigger: auto-create profile on new user signup ─────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Seed default site_config entries (idempotent) ───────────
insert into public.site_config (key, value) values
  ('hero',        '{"headline":"ZARDONIC","tagline":"Industrial Metal / Drum & Bass","ctaLabel":"Listen Now","ctaUrl":"#music"}'::jsonb),
  ('newsletter',  '{"heading":"Mailing List","body":"Subscribe to get the latest news, releases and exclusive content."}'::jsonb),
  ('merchandise', '{"footerText":"Visit the official Zardonic Merchandise Store to get these and more!"}'::jsonb),
  ('footer',      '{"impressumUrl":"/impressum","privacyUrl":"/privacy"}'::jsonb),
  ('background',  '{}'::jsonb)
on conflict (key) do nothing;

insert into public.site_config (key, value) values
  ('appearance', '{"crtEnabled":true,"scanlineEnabled":true,"noiseEnabled":true,"accentColor":"#dc2626","accentColorSecondary":"#7c3aed","vignetteOpacity":0.3,"chromaticStrength":0.5}'::jsonb),
  ('sections', '[{"id":"hero","label":"Hero","visible":true,"order":0},{"id":"bio","label":"Biography","visible":true,"order":1},{"id":"credits","label":"Credits & Partners","visible":true,"order":2},{"id":"gallery","label":"Gallery","visible":true,"order":3},{"id":"music-highlights","label":"Music Highlights","visible":true,"order":4},{"id":"releases","label":"Discography","visible":true,"order":5},{"id":"merchandise","label":"Merchandise","visible":true,"order":6},{"id":"soundpacks","label":"Soundpacks","visible":true,"order":7},{"id":"gigs","label":"Events","visible":true,"order":8},{"id":"newsletter","label":"Newsletter","visible":true,"order":9},{"id":"contact","label":"Contact","visible":true,"order":10}]'::jsonb)
on conflict (key) do nothing;
