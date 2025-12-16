import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase URL and service role key must be configured.");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const email = payload?.email?.replace(/\s/g, "");
  const password = payload?.password;
  const name = payload?.name?.trim();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const existing = await supabaseAdmin.auth.admin.getUserByEmail(email);
  if (existing.data) {
    return NextResponse.json(
      { error: "A user with that email already exists." },
      { status: 409 }
    );
  }

  const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirmed: true,
    email_confirmed_at: new Date().toISOString(),
    user_metadata: { name },
  });
  if (createError || !user) {
    return NextResponse.json(
      { error: createError?.message ?? "Unable to create user." },
      { status: 500 }
    );
  }

  const organizationName = name
    ? `${name}'s workspace`
    : `${email.split("@")[0]}'s workspace`;

  const { data: existingMembership } = await supabaseAdmin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  let organizationId = existingMembership?.organization_id;

  if (!organizationId) {
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert({ name: organizationName, creator: user.id })
      .select("id")
      .single();
    if (orgError && orgError.code !== "23505") {
      return NextResponse.json({ error: orgError.message }, { status: 500 });
    }
    organizationId = org?.id ?? existingMembership?.organization_id;
  }

  if (organizationId) {
    const { error: memberError } = await supabaseAdmin
      .from("organization_members")
      .upsert(
        {
          organization_id: organizationId,
          user_id: user.id,
          role: "owner",
        },
        { onConflict: "organization_id,user_id" }
      );
    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }
  }

  return NextResponse.json(
    {
      ok: true,
      user: { id: user.id, email: user.email },
      organizationId,
    },
    { status: 201 }
  );
}
