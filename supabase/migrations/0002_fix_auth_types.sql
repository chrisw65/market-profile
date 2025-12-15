do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'factor_type'
  ) then
    execute 'alter type public.factor_type set schema auth';
  end if;
exception
  when undefined_table or undefined_object then
    null;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'factor_status'
  ) then
    execute 'alter type public.factor_status set schema auth';
  end if;
exception
  when undefined_table or undefined_object then
    null;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'aal_level'
  ) then
    execute 'alter type public.aal_level set schema auth';
  end if;
exception
  when undefined_table or undefined_object then
    null;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'code_challenge_method'
  ) then
    execute 'alter type public.code_challenge_method set schema auth';
  end if;
exception
  when undefined_table or undefined_object then
    null;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'one_time_token_type'
  ) then
    execute 'alter type public.one_time_token_type set schema auth';
  end if;
exception
  when undefined_table or undefined_object then
    null;
end $$;
