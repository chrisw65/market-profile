import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

/**
 * GET /api/admin/users
 * List all users in the system (admin only)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const serviceClient = createServiceSupabaseClient();

  try {
    // Use admin API to list all users
    const { data: { users }, error } = await serviceClient.auth.admin.listUsers();

    if (error) {
      console.error("[api/admin/users] Error listing users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Transform user data for frontend
    const transformedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || null,
      isAdmin: user.user_metadata?.is_admin === true,
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at,
      emailConfirmed: user.email_confirmed_at !== null,
    }));

    return NextResponse.json({
      users: transformedUsers,
      total: transformedUsers.length,
    });
  } catch (err) {
    console.error("[api/admin/users] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users
 * Update user admin status (admin only)
 */
export async function PATCH(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const serviceClient = createServiceSupabaseClient();

  try {
    const body = await request.json();
    const { userId, isAdmin } = body;

    if (!userId || typeof isAdmin !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request. userId and isAdmin (boolean) are required." },
        { status: 400 }
      );
    }

    // Prevent self-demotion
    if (userId === authResult.user.id && !isAdmin) {
      return NextResponse.json(
        { error: "You cannot remove your own admin privileges." },
        { status: 400 }
      );
    }

    // Update user metadata
    const { data, error } = await serviceClient.auth.admin.updateUserById(
      userId,
      {
        user_metadata: { is_admin: isAdmin },
      }
    );

    if (error) {
      console.error("[api/admin/users] Error updating user:", error);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        isAdmin: data.user.user_metadata?.is_admin === true,
      },
    });
  } catch (err) {
    console.error("[api/admin/users] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
