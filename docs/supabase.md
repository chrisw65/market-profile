# Supabase Setup

## Local Docker Setup
1. Copy `supabase/.env.docker.example` → `supabase/.env.docker` and edit secrets:
   - `JWT_SECRET` must be at least 32 chars.
   - `ANON_KEY` and `SERVICE_ROLE_SECRET` should be JWTs signed with `JWT_SECRET` (role claim `anon`/`service_role` respectively).
   - Set `API_EXTERNAL_URL` to the URL your Supabase API is exposed on (for local dev you can reuse `http://localhost:54323`).
2. Start the stack:
   ```
   ./scripts/supabase-docker.sh start
   ```
   This spins up Postgres, GoTrue (auth), PostgREST, and Realtime locally.
3. Apply the schema:
   - To reset everything you can still use `supabase db reset` if you have the CLI installed, otherwise run every SQL file in `supabase/migrations` inside the container:
     ```
     docker compose -f supabase/docker-compose.yml --env-file supabase/.env.docker exec db \
       bash -c 'for file in /supabase/migrations/*.sql; do psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-postgres} -f "$file"; done'
     ```
4. Set the Next.js env vars (in `web/.env`) pointing to the local stack:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<same anon JWT as in supabase/.env.docker>
   SUPABASE_SERVICE_ROLE_KEY=<same service role JWT as in supabase/.env.docker>
   ```

Stop the stack with `./scripts/supabase-docker.sh stop`.

## Admin onboarding

1. Run the helper to seed an admin user (from the `web` directory so it can resolve the Supabase client):
   ```bash
   cd web
   node scripts/create-admin-user.js admin@example.com SuperSecret123 "My Workspace"
   ```
   The script reads `web/.env`, creates/updates the Supabase user, confirms the email, and links the user to an organization workspace. Keep the printed password handy for login.

2. Since the admin user now has a password, visit `http://localhost:3000/signup` to create additional password-based admins, or use the header widget to sign in via password (the form now supports both magic links and password login).
