drop policy if exists "org members can insert saved campaigns" on public.saved_campaigns;

create policy "org members can insert saved campaigns"
  on public.saved_campaigns
  for insert
  with check (
    exists (
      select 1
      from public.organization_members om
      where om.organization_id = saved_campaigns.organization_id
        and om.user_id = auth.uid()
    )
  );
