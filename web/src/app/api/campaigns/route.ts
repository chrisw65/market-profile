import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { ensurePersonalOrganization } from "@/lib/supabase/org";
import { normalizeSlug } from "@/lib/skool/utils";

const handleError = (message: string) =>
  NextResponse.json({ error: message }, { status: 500 });

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const orgId = await ensurePersonalOrganization(session.user.id, session.user.email ?? undefined);
    const slug = normalizeSlug(request.nextUrl.searchParams.get("slug"));

    const { data, error } = await supabase
      .from("saved_campaigns")
      .select("id, title, notes, ideas, slug, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[api/campaigns] supabase error", error);
      return NextResponse.json(
        { entries: [], warning: "Saved campaigns temporarily unavailable." },
        { status: 200 }
      );
    }

    const entries = slug ? data?.filter((row) => row.slug === slug) : data;
    return NextResponse.json({ entries: entries ?? [] });
  } catch (error) {
    console.error("[api/campaigns] GET failed", error);
    return NextResponse.json(
      { entries: [], warning: "Saved campaigns temporarily unavailable." },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRouteClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const payload = await request.json().catch(() => ({}));
    const slug = normalizeSlug(payload?.slug);
    const title = payload?.title ?? `Campaign ${new Date().toLocaleString()}`;
    const notes = payload?.notes ?? "";
    const ideas = payload?.ideas ?? "";

    if (!slug) {
      return NextResponse.json({ error: "Slug is required." }, { status: 400 });
    }

    const orgId = await ensurePersonalOrganization(session.user.id, session.user.email ?? undefined);

    const { error } = await supabase.from("saved_campaigns").insert({
      organization_id: orgId,
      slug,
      title,
      notes,
      ideas,
    });

    if (error) {
      console.error("[api/campaigns] POST insert error", error);
      return handleError(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/campaigns] POST failed", error);
    return handleError("Unable to save campaign.");
  }
}
