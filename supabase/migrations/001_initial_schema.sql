-- Zardonic Industrial – Initial Database Schema
-- =================================================

-- profiles (for admin auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null default 'user',
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Admin read" on public.profiles for select using (auth.uid() = id);

-- releases
create table public.releases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'single', -- album | ep | single | remix | compilation
  release_date date,
  description text,
  cover_storage_path text,   -- R2 object path
  cover_url text,            -- legacy fallback
  streaming_links jsonb default '[]',
  artists text[] default '{}',
  active boolean default true,
  display_order integer default 0,
  created_at timestamptz default now()
);
alter table public.releases enable row level security;
create policy "Public read releases" on public.releases for select using (active = true);
create policy "Admin all releases" on public.releases using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- gigs
create table public.gigs (
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

-- gallery
create table public.gallery (
  id uuid primary key default gen_random_uuid(),
  storage_path text,         -- R2 object path (preferred)
  image_url text,            -- legacy fallback
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

-- bio
create table public.bio (
  id uuid primary key default gen_random_uuid(),
  content text,
  updated_at timestamptz default now()
);
alter table public.bio enable row level security;
create policy "Public read bio" on public.bio for select using (true);
create policy "Admin all bio" on public.bio using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- social_links
create table public.social_links (
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

-- partners
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text,
  logo_storage_path text,
  logo_url text,
  category text default 'partner',
  display_order integer default 0,
  active boolean default true,
  created_at timestamptz default now()
);
alter table public.partners enable row level security;
create policy "Public read partners" on public.partners for select using (active = true);
create policy "Admin all partners" on public.partners using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- site_config (key-value for site name, hero content, footer, etc.)
create table public.site_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);
alter table public.site_config enable row level security;
create policy "Public read config" on public.site_config for select using (true);
create policy "Admin all config" on public.site_config using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Trigger: auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
