import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const email = payload?.email?.trim();
  const password = payload?.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseRouteClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status ?? 400 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
