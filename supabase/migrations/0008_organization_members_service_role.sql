drop policy if exists "memberships insert by user" on public.organization_members;

create policy "memberships insert by user"
  on public.organization_members
  for insert
  with check (
    (user_id = auth.uid()) OR (auth.role() = 'service_role')
  );

drop policy if exists "memberships readable" on public.organization_members;

create policy "memberships readable"
  on public.organization_members
  for select
  using (
    (user_id = auth.uid()) OR (auth.role() = 'service_role')
  );
