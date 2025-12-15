create extension if not exists "pgcrypto";

create table if not exists public.saved_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  slug text not null,
  title text,
  notes text,
  ideas text,
  created_at timestamptz not null default now()
);

alter table public.saved_campaigns enable row level security;

drop policy if exists "org members can select saved campaigns" on public.saved_campaigns;

create policy "org members can select saved campaigns"
  on public.saved_campaigns
  for select
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = saved_campaigns.organization_id
        and om.user_id = auth.uid()
    )
  );

drop policy if exists "service role can manage saved campaigns" on public.saved_campaigns;

create policy "service role can manage saved campaigns"
  on public.saved_campaigns
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
