import { NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route'
import type { User } from '@supabase/supabase-js'

export interface AuthResult {
  user: User
  supabase: ReturnType<typeof createRouteClient>
}

/**
 * Require authentication for an API route
 * Returns user and supabase client if authenticated, or 401 error response
 */
export async function requireAuth(request: Request): Promise<AuthResult | NextResponse> {
  const supabase = createRouteClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in.' },
      { status: 401 }
    )
  }

  return { user, supabase }
}

/**
 * Require admin privileges for an API route
 * Returns user and supabase client if admin, or 401/403 error response
 */
export async function requireAdmin(request: Request): Promise<AuthResult | NextResponse> {
  const result = await requireAuth(request)

  // If requireAuth returned an error response, pass it through
  if (result instanceof NextResponse) {
    return result
  }

  const { user } = result

  // Check if user has admin flag in metadata
  if (!isAdmin(user)) {
    return NextResponse.json(
      { error: 'Forbidden. Admin privileges required.' },
      { status: 403 }
    )
  }

  return result
}

/**
 * Check if a user has admin privileges
 */
export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false
  return user.user_metadata?.is_admin === true
}

/**
 * Get user role display name
 */
export function getUserRole(user: User | null | undefined): 'admin' | 'user' | 'guest' {
  if (!user) return 'guest'
  return isAdmin(user) ? 'admin' : 'user'
}
