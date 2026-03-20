create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin'))
);

create table if not exists public.genres (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  production_time text,
  persona text,
  purpose text,
  design_point text,
  tools text[] not null default '{}',
  source_type text not null check (source_type in ('self_made', 'trace')),
  is_eye_candy boolean not null default false,
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order integer not null default 0,
  thumbnail_image_url text,
  large_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.work_genres (
  work_id uuid not null references public.works(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete cascade,
  primary key (work_id, genre_id)
);

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where id = auth.uid()
  );
$$;

revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to anon, authenticated;

alter table public.admin_users enable row level security;
alter table public.genres enable row level security;
alter table public.works enable row level security;
alter table public.work_genres enable row level security;

drop policy if exists "admins can read admin_users" on public.admin_users;
create policy "admins can read admin_users"
on public.admin_users
for select
using (public.is_admin_user());

drop policy if exists "admins manage genres" on public.genres;
create policy "admins manage genres"
on public.genres
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "public can read published works" on public.works;
create policy "public can read published works"
on public.works
for select
using (status = 'published');

drop policy if exists "admins manage works" on public.works;
create policy "admins manage works"
on public.works
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "public can read published work genres" on public.work_genres;
create policy "public can read published work genres"
on public.work_genres
for select
using (
  exists (
    select 1
    from public.works
    where public.works.id = work_genres.work_id
      and public.works.status = 'published'
  )
);

drop policy if exists "admins manage work genres" on public.work_genres;
create policy "admins manage work genres"
on public.work_genres
for all
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "public can read genres" on public.genres;
create policy "public can read genres"
on public.genres
for select
using (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_works_updated_at on public.works;
create trigger set_works_updated_at
before update on public.works
for each row
execute function public.set_updated_at();

insert into public.genres (slug, label)
values
  ('business', 'ビジネス'),
  ('cooking', '料理'),
  ('entertainment', 'エンタメ')
on conflict (slug) do nothing;
