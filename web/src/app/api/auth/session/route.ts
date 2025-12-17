import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdmin, getUserRole } from "@/lib/auth/middleware";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("[api/auth/session] supabase session error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const user = session?.user ?? null;

  return NextResponse.json({
    user,
    isAdmin: isAdmin(user),
    role: getUserRole(user),
  });
}
