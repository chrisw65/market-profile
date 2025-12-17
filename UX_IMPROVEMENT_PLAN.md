# UX Flow Improvement Plan

## Current Issues Identified

### 1. No Dedicated Login/Register Experience
- **Problem**: Home page (`/`) is public with search form. Auth is buried in header.
- **User Impact**: Users don't know where to start. No clear entry point.
- **Current Flow**: Public home → Search → Navigate to profile → Auth required → Redirect

### 2. No Admin vs Regular User Distinction
- **Problem**: Role system exists (owner/member) but no "admin" concept
- **Current `/admin` page**: Just shows user's saved communities, not admin features
- **Missing**: User management panel, system overview, role assignment

### 3. Profile Management Confusion
- **Problem**: Every profile navigation requires re-scraping if no cache
- **No Profile List**: Users can't see "their profiles" in one place
- **Current Flow**: Search slug → View profile → Scrape data → View again
- **Should Be**: Dashboard shows all profiles → Click to view → Option to refresh

### 4. No User Management Interface
- **Problem**: No way to view all users, assign roles, manage organizations
- **Missing Features**:
  - List all users in system
  - Assign/revoke admin privileges
  - View user activity
  - Manage organizations

---

## Proposed UX Flow

### Phase 1: Authentication & Landing

#### A. Landing Page (`/`)
**Current**: Public search form
**New**: Clean landing/login page

**Options:**
1. **Option A**: `/` becomes login page with link to signup
2. **Option B**: `/` is marketing landing with "Login" and "Sign Up" buttons

**Recommendation**: Option A for SaaS app simplicity

**Implementation**:
- Move current home content to `/public` or `/explore` (optional public section)
- Replace `/` with login form (similar to current `/signup` but for login)
- Prominent "Create Account" link

#### B. Separate Login & Signup Pages
- `/login` - Email/password login (move from header)
- `/signup` - Registration form (already exists, enhance it)
- Both pages: professional design, clear CTAs

### Phase 2: Role-Based Routing

#### A. Define Admin Role
**Database Change**: Add `is_admin` boolean to user profile or use role system

**Options**:
1. Add `is_admin` column to `organization_members` table
2. Create separate `user_roles` table
3. Use Supabase auth metadata (`user.user_metadata.is_admin`)

**Recommendation**: Option 3 - Use Supabase auth metadata (simplest, secure)

#### B. Post-Login Routing
After successful login:
```
if (user.is_admin) {
  redirect('/admin/users')
} else {
  redirect('/dashboard')
}
```

### Phase 3: Admin User Management Panel

#### A. Admin Pages Structure
```
/admin
├── /users          - User management (list, edit roles)
├── /organizations  - Org management (optional)
└── /overview       - System stats dashboard
```

#### B. User Management Features (`/admin/users`)
**Display**:
- Table of all users (email, name, role, created date, last login)
- Search/filter users
- Pagination

**Actions**:
- Toggle admin status
- View user's profiles
- Delete user (with confirmation)
- Reset password (send email)

**Implementation**:
- New API endpoint: `/api/admin/users` (GET, PATCH)
- Middleware to check `is_admin` before allowing access
- Use Supabase service client to fetch all users

### Phase 4: User Dashboard

#### A. Dashboard Page (`/dashboard`)
**Purpose**: User's personal workspace

**Sections**:
1. **Header**: Welcome message, quick stats
2. **Profiles List**: All saved community profiles
   - Grid or table view
   - Show: community name, slug, last updated, member count
   - Actions: View, Refresh data, Delete
3. **Quick Actions**:
   - "Analyze New Community" button
   - Recent campaigns
4. **Navigation**: Link to campaigns, settings

**Data Source**:
- Fetch from `/api/communities` (already exists)
- Enhance to show more metadata

#### B. Profile List Component
**Features**:
- Card or table layout
- Sort by: date, name, members
- Filter by: saved date range
- Click card → navigate to `/profiles/[slug]`

### Phase 5: Improved Profile Creation Flow

#### A. "Analyze New Community" Flow
1. User clicks "Analyze New Community" from dashboard
2. Modal/page with slug input
3. Enter slug → Validate → Scrape → Save → Navigate to profile
4. Add to user's profile list automatically

#### B. Profile Page Updates
**Current Issue**: Every visit tries to scrape
**Solution**:
- Load cached data by default (fast)
- Show "Last updated: X hours ago"
- "Refresh Data" button for manual update
- Auto-refresh option (configurable interval)

---

## Implementation Plan

### Step 1: Database Changes
- [ ] Add `is_admin` to user metadata (Supabase auth)
- [ ] Add migration/function to set admin flag
- [ ] Update RLS policies if needed

### Step 2: Middleware & Auth Utilities
- [ ] Create `requireAuth()` middleware
- [ ] Create `requireAdmin()` middleware
- [ ] Add `isAdmin(user)` helper function
- [ ] Update `/api/auth/session` to include admin status

### Step 3: Landing & Auth Pages
- [ ] Convert `/` to login page
- [ ] Update `/signup` page design
- [ ] Add post-login role-based redirect
- [ ] Update navigation header (hide auth panel when logged out)

### Step 4: User Dashboard
- [ ] Create `/dashboard` page
- [ ] Create `ProfileList` component
- [ ] Update `/api/communities` to include more metadata
- [ ] Add "Analyze New Community" modal/flow

### Step 5: Admin Panel
- [ ] Create `/admin/users` page
- [ ] Create `/api/admin/users` endpoint
- [ ] Build UserManagementTable component
- [ ] Add admin role toggle functionality
- [ ] Create admin middleware protection

### Step 6: Navigation & Routing
- [ ] Update AppHeader for logged-in state
- [ ] Add sidebar navigation (optional)
- [ ] Update all protected routes to use middleware
- [ ] Remove old auth panel from header

### Step 7: Testing & Polish
- [ ] Test registration → login → dashboard flow
- [ ] Test admin user → user management flow
- [ ] Test regular user → profile management flow
- [ ] Test profile creation and refresh flow
- [ ] Update documentation

---

## Technical Implementation Details

### A. Admin Role Management

**Set Admin via Supabase Dashboard**:
```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'admin@example.com';
```

**Check Admin in API**:
```typescript
const { data: { user } } = await supabase.auth.getUser()
const isAdmin = user?.user_metadata?.is_admin === true
```

### B. Middleware Pattern

**File**: `/src/lib/auth/middleware.ts`
```typescript
export async function requireAuth(request: Request) {
  const supabase = createRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return { user, supabase }
}

export async function requireAdmin(request: Request) {
  const result = await requireAuth(request)
  if (result instanceof NextResponse) return result

  const { user } = result
  if (!user.user_metadata?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return result
}
```

### C. Dashboard Data Structure

**Enhanced API Response** (`/api/communities`):
```typescript
{
  profiles: [
    {
      id: string,
      slug: string,
      name: string,
      members: number,
      posts: number,
      lastUpdated: string,
      createdAt: string
    }
  ],
  total: number,
  organizationId: string
}
```

### D. Admin Users API

**Endpoint**: `/api/admin/users`

**GET**: List all users
```typescript
const { data: users } = await serviceClient.auth.admin.listUsers()
return users.map(u => ({
  id: u.id,
  email: u.email,
  name: u.user_metadata?.name,
  isAdmin: u.user_metadata?.is_admin,
  createdAt: u.created_at,
  lastSignIn: u.last_sign_in_at
}))
```

**PATCH**: Update user admin status
```typescript
await serviceClient.auth.admin.updateUserById(userId, {
  user_metadata: { is_admin: isAdmin }
})
```

---

## User Stories

### Story 1: New User Registration
1. Visit `/` (login page)
2. Click "Create Account"
3. Fill out `/signup` form
4. Submit → Account created
5. Redirect to `/login` with success message
6. Login → Redirect to `/dashboard`
7. See empty state: "No profiles yet. Analyze your first community!"

### Story 2: Regular User - Profile Management
1. Login → Redirect to `/dashboard`
2. See list of saved profiles (or empty state)
3. Click "Analyze New Community"
4. Enter Skool slug → Scrape → Save
5. Profile appears in list
6. Click profile → View details
7. Click "Refresh Data" to update

### Story 3: Admin User - User Management
1. Login as admin → Redirect to `/admin/users`
2. See table of all users
3. Click "Make Admin" next to user → User promoted
4. Search for user by email
5. Click user row → View user's profiles
6. Navigate to own dashboard via header menu

---

## Design Considerations

### Navigation Structure

**Logged Out**:
- `/` - Login
- `/signup` - Register

**Logged In (Regular User)**:
- `/dashboard` - Profile list
- `/profiles/[slug]` - Profile view
- `/campaigns` - Campaigns list (optional)
- `/settings` - User settings

**Logged In (Admin)**:
- All above +
- `/admin/users` - User management
- `/admin/overview` - System stats

**Header Navigation**:
- Logo (links to dashboard)
- "Dashboard" link
- "Admin" link (if admin)
- User menu dropdown:
  - Settings
  - Sign Out

### Empty States

**Dashboard (no profiles)**:
```
🔍 No communities analyzed yet

Start by analyzing your first Skool community.

[Analyze New Community] button
```

**Admin Users (no users yet)**:
```
No users found.

Wait for users to sign up, or check your search filters.
```

---

## Migration Strategy

### Phase 1 (Immediate)
- Create new pages without breaking existing functionality
- Add dashboard at `/dashboard`
- Add admin panel at `/admin/users`
- Keep current `/` as fallback

### Phase 2 (Transition)
- Add redirect logic: if logged in, `/` → `/dashboard`
- Update header to show dashboard link when logged in

### Phase 3 (Final)
- Replace `/` with login page
- Update all internal links
- Remove old public homepage

---

## Success Criteria

✅ **Authentication**:
- [ ] Clear login/signup pages
- [ ] Post-login redirect based on role
- [ ] Session persistence across page loads

✅ **User Dashboard**:
- [ ] Shows list of all saved profiles
- [ ] Quick profile creation flow
- [ ] Profile refresh without full re-scrape UI

✅ **Admin Panel**:
- [ ] List all users
- [ ] Toggle admin status
- [ ] Protected by admin-only middleware

✅ **Navigation**:
- [ ] Intuitive flow from login to dashboard to profiles
- [ ] Clear separation of admin vs user features
- [ ] No orphaned or confusing pages

---

## Estimated Changes

**New Files** (~10):
- `/app/login/page.tsx`
- `/app/dashboard/page.tsx`
- `/app/admin/users/page.tsx`
- `/api/admin/users/route.ts`
- `/lib/auth/middleware.ts`
- `/components/profile-list.tsx`
- `/components/user-management-table.tsx`
- `/components/dashboard-header.tsx`
- `/hooks/use-profiles.ts`

**Modified Files** (~8):
- `/app/page.tsx` (convert to login)
- `/app/signup/page.tsx` (enhance design)
- `/components/app-header.tsx` (update nav)
- `/api/auth/session/route.ts` (add admin flag)
- `/api/communities/route.ts` (enhance response)
- `/app/profiles/[slug]/page.tsx` (update auth check)
- `/hooks/use-auth.ts` (add isAdmin)

**Deleted Files** (~2):
- `/components/auth-panel.tsx` (move to login page)
- `/components/auth-panel-client.tsx` (consolidate)

---

## Next Steps

1. **Review & Approve Plan**: Get user confirmation on approach
2. **Set First Admin**: Decide which user(s) should be admin
3. **Implement Phase by Phase**: Start with Step 1 (database changes)
4. **Test Incrementally**: Verify each phase before moving to next
5. **Deploy & Monitor**: Watch for issues after deployment

---

**Questions for User**:
1. Should `/` be login page, or a public marketing page with login link?
2. Who should be the initial admin user(s)? (email address)
3. Do you want multi-tenancy support (multiple orgs per user) or keep 1:1?
4. Any specific design preferences for dashboard/admin panel?
