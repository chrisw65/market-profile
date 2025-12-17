# Admin User Setup Guide

## Overview

The application now has a complete authentication and authorization system with role-based access control. Regular users see their dashboard, while admin users have access to a user management panel.

---

## Setting Your First Admin User

After deploying the application, you'll need to promote at least one user to admin status. Follow these steps:

### Step 1: Create Your Account

1. Navigate to `/signup` and create your account with email and password
2. Complete the signup process
3. Sign in at `/login`

### Step 2: Grant Admin Privileges

You need to update your user's metadata in Supabase to grant admin privileges.

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Find your user account in the list
4. Click on the user to view details
5. Scroll to **User Metadata** section
6. Click **Edit** and add the following field:
   ```json
   {
     "is_admin": true
   }
   ```
7. Save changes

#### Option B: Using SQL Query

Run this SQL query in the Supabase SQL Editor:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'your-email@example.com';
```

Replace `your-email@example.com` with your actual email address.

#### Option C: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db execute "UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{\"is_admin\": true}'::jsonb WHERE email = 'your-email@example.com';"
```

### Step 3: Verify Admin Access

1. Sign out from the application
2. Sign back in at `/login`
3. You should be automatically redirected to `/admin/users`
4. You should see an "ADMIN" badge next to your email in the header
5. You should see the "Admin" navigation link in the header

---

## Admin Features

Once you have admin access, you can:

### User Management (`/admin/users`)
- View all registered users
- See user details (email, name, status, creation date, last sign-in)
- Grant or revoke admin privileges for other users
- Search and filter users by email or name

### Dashboard Access (`/dashboard`)
- Admins can still access the regular user dashboard
- View and manage your own community profiles
- Analyze new Skool communities

---

## User Flow Summary

### For Regular Users:
1. Visit `/` → Redirected to `/login`
2. Sign in → Redirected to `/dashboard`
3. See their saved community profiles
4. Analyze new communities via search form
5. View profile details and campaigns

### For Admin Users:
1. Visit `/` → Redirected to `/admin/users`
2. See user management panel
3. Can navigate to `/dashboard` for their own profiles
4. Can promote/demote other users to/from admin role

---

## Security Notes

### Admin Privileges
- Admin users have elevated permissions in the system
- Admins can view all users and modify their roles
- Admins **cannot** remove their own admin privileges (safety feature)
- Be careful who you grant admin access to

### Best Practices
1. **Limit admin accounts**: Only grant admin to trusted users
2. **Regular audits**: Periodically review who has admin access
3. **Secure credentials**: Use strong passwords for admin accounts
4. **Monitor activity**: Check the admin panel regularly for unusual activity

### RLS (Row Level Security)
- The admin user management uses Supabase's service role
- Regular API endpoints still use RLS for data isolation
- Each user can only see their own organization's data

---

## Troubleshooting

### "I set is_admin but still don't see Admin features"

1. Make sure you signed out and signed back in after setting the flag
2. Check the `/api/auth/session` endpoint response to verify `isAdmin: true`
3. Clear browser cache and try again
4. Verify the metadata was saved correctly in Supabase dashboard

### "I accidentally removed my own admin access"

If you're the only admin and lost access:
1. Use Option B (SQL Query) above to restore your admin flag
2. This bypasses the application-level restriction

### "The admin panel is not loading"

1. Check browser console for errors
2. Verify your Supabase service role key is set in environment variables
3. Check that `/api/admin/users` endpoint returns data (use browser DevTools Network tab)

---

## Environment Variables

Make sure these are set in your `.env.local` (or deployment platform):

```bash
# Public Supabase URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Public anon key (client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Service role key (server-side only, has full access)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

⚠️ **Never expose the service role key to the client!** It's only used server-side for admin operations.

---

## Additional Admin Features (Future)

Potential features to add:
- Delete users
- Reset user passwords
- View user activity logs
- Bulk user operations
- Organization management
- System statistics and analytics

---

## Support

For questions or issues:
1. Check the main README.md for general setup
2. Review UX_IMPROVEMENT_PLAN.md for implementation details
3. Check Supabase logs for authentication errors
4. Verify all environment variables are correctly set

---

**Last Updated**: Implementation completed with role-based authentication system.
