import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("[api/communities] session error", sessionError);
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  if (!session?.user) {
    return NextResponse.json({ data: [] });
  }

  const { data, error } = await supabase
    .from("community_profiles")
    .select("id, slug, profile, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[api/communities] query error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profiles: data ?? [], total: data?.length ?? 0 });
}
