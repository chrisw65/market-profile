-- Allow the service role to manage orgs and memberships
CREATE OR REPLACE FUNCTION public.ensure_service_role_policy(
  policy_name text,
  policy_definition text
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = policy_name) THEN
    EXECUTE policy_definition;
  END IF;
END;
$$;

SELECT public.ensure_service_role_policy(
  'service_role_manage_members',
  $$
    CREATE POLICY "service role can manage memberships"
      ON public.organization_members
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  $$
);

SELECT public.ensure_service_role_policy(
  'service_role_manage_orgs',
  $$
    CREATE POLICY "service role can manage organizations"
      ON public.organizations
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  $$
);

SELECT public.ensure_service_role_policy(
  'service_role_manage_profiles',
  $$
    CREATE POLICY "service role can manage community profiles"
      ON public.community_profiles
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  $$
);

DROP FUNCTION IF EXISTS public.ensure_service_role_policy(text, text);
