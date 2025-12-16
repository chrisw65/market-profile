# Supabase Local Setup Guide

## Quick Start

Your `.env` file is already configured for local Supabase! Now you just need to start it.

## Option 1: Using Docker Compose (Recommended)

```bash
# Navigate to the supabase directory
cd supabase

# Start Supabase containers
docker-compose up -d

# Check if containers are running
docker-compose ps

# Apply database migrations
cd ..
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/migrations/*.sql
```

## Option 2: Using Supabase CLI

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Start Supabase
supabase start

# The CLI will automatically:
# - Start Docker containers
# - Apply all migrations from supabase/migrations/
# - Show you the connection details
```

## Verify It's Working

Once Supabase is running, test the connection:

```bash
curl http://localhost:54321/rest/v1/
```

You should see a response from the Supabase API.

## Apply Migrations Manually (if needed)

If migrations weren't applied automatically:

```bash
# Connect to the database
psql postgresql://postgres:postgres@localhost:54322/postgres

# Then run each migration file
\i supabase/migrations/0001_init.sql
\i supabase/migrations/0002_fix_auth_types.sql
\i supabase/migrations/0003_supabase_compatibility.sql
\i supabase/migrations/0004_service_policies.sql
\i supabase/migrations/0005_saved_campaigns.sql
\i supabase/migrations/0006_saved_campaigns_member_policy.sql
\i supabase/migrations/0007_saved_campaigns_member_policy_auth_uid.sql
\i supabase/migrations/0008_organization_members_service_role.sql
\i supabase/migrations/0009_add_indexes_for_performance.sql
```

## Current Status

✅ `.env` file is configured
✅ Database migrations are ready
⏳ Need to start Supabase containers
⏳ Need to apply migrations

## Without Supabase

**Good news!** The app now works without a database too:

- ✅ You can scrape profiles
- ✅ You can generate campaigns
- ❌ But data won't be saved
- ❌ No cache-first instant loading

To use the app without Supabase:
1. Just click "Scrape Now" on profile pages
2. Data will be fetched fresh each time
3. No authentication required

## Your Current Configuration

From your `.env` file:
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

This points to a local Supabase instance on port 54321.

## Troubleshooting

### "role "" does not exist"
- Supabase containers aren't running
- Solution: `cd supabase && docker-compose up -d`

### "Connection refused on localhost:54321"
- Supabase isn't started yet
- Solution: Start Docker containers or use `supabase start`

### "Migrations not applied"
- Database tables don't exist
- Solution: Apply migrations manually (see above)

## Next Steps

1. **Start Supabase:**
   ```bash
   cd supabase
   docker-compose up -d
   ```

2. **Restart your dev server:**
   ```bash
   cd web
   npm run dev
   ```

3. **Visit a profile page** - you should now see instant cache-first loading!

## Supabase Dashboard

Once running, access your local Supabase dashboard at:
- **URL:** http://localhost:54323
- **Username:** (check docker-compose.yml)
- **Password:** (check docker-compose.yml)

Here you can:
- View database tables
- Check saved profiles
- Manage authentication
- Monitor API usage
