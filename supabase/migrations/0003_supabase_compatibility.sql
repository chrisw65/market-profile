-- Ensure postgres role sees auth schema first (needed by GoTrue migrations).
alter role postgres set search_path = auth, public;

-- Provide an implicit text -> uuid cast so older GoTrue migrations succeed.
do $$
begin
  if not exists (
    select 1 from pg_proc
    where proname = 'text_to_uuid' and pg_function_is_visible(oid)
  ) then
    execute $fn$
      create or replace function public.text_to_uuid(val text) returns uuid
      language sql immutable as 'select val::uuid';
    $fn$;
  end if;
  if not exists (
    select 1 from pg_cast
    where castsource = 'text'::regtype and casttarget = 'uuid'::regtype
  ) then
    execute 'create cast (text as uuid) with function public.text_to_uuid(text) as implicit';
  end if;
end $$;

-- Make oauth_clients compatible with the newest GoTrue migrations.
alter table auth.oauth_clients add column if not exists client_id text;
alter table auth.oauth_clients alter column client_id set default gen_random_uuid()::text;
update auth.oauth_clients
set client_id = gen_random_uuid()::text
where client_id is null;
alter table auth.oauth_clients alter column client_id set not null;
create unique index if not exists oauth_clients_client_id_key on auth.oauth_clients (client_id);

-- Drop conflicting constraints/columns so GoTrue migrations can recreate them safely.
alter table auth.sessions drop constraint if exists sessions_oauth_client_id_fkey;
alter table auth.sessions drop constraint if exists sessions_scopes_length;
alter table auth.oauth_authorizations drop constraint if exists oauth_authorizations_nonce_length;
alter table auth.oauth_authorizations drop column if exists nonce;
alter table auth.sessions drop column if exists scopes;
