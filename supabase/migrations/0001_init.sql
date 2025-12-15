create extension if not exists "uuid-ossp";

create table if not exists public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  creator uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.community_profiles (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) on delete cascade,
  slug text not null,
  profile jsonb not null,
  classroom jsonb not null default '[]'::jsonb,
  posts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.organizations_membership_check(org_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id and user_id = auth.uid()
  );
$$ language sql stable;

alter table public.community_profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

create policy "org membership can read orgs"
  on public.organizations
  for select
  using ( exists (
    select 1 from public.organization_members om
    where om.organization_id = organizations.id
      and om.user_id = auth.uid()
  ));

create policy "org membership can read/save profiles"
  on public.community_profiles
  for select using ( organizations_membership_check(community_profiles.organization_id) );

create policy "org membership can insert profiles"
  on public.community_profiles
  for insert with check ( organizations_membership_check(community_profiles.organization_id) );

create policy "users can create orgs"
  on public.organizations
  for insert
  with check ( auth.uid() = creator );

create policy "memberships readable"
  on public.organization_members
  for select
  using ( user_id = auth.uid() );

create policy "memberships insert by user"
  on public.organization_members
  for insert
  with check ( user_id = auth.uid() );
