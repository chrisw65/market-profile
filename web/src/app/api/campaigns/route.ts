import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { ensurePersonalOrganization } from "@/lib/supabase/org";
import { normalizeSlug } from "@/lib/skool/utils";

type ApiResponse<T> =
  | { success: true; data: T; warning?: string }
  | { success: false; error: string };

const respond = <T>(payload: ApiResponse<T>, status = 200) =>
  NextResponse.json(payload, { status });

const logSession = (session: { user?: { id?: string; email?: string; role?: string } } | null) => {
  console.info("[api/campaigns] session", {
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    role: session?.user?.role ?? null,
  });
};

const authenticate = async (supabase: ReturnType<typeof createSupabaseRouteClient>) => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) {
    console.error("[api/campaigns] session fetch error", error);
  }
  logSession(session);
  if (!session?.user) {
    throw new Error("Authentication required.");
  }
  return session.user;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteClient();
    const user = await authenticate(supabase);
    const orgId = await ensurePersonalOrganization(user.id, user.email ?? undefined);
    const slugParam = normalizeSlug(request.nextUrl.searchParams.get("slug"));

    let query = supabase
      .from("saved_campaigns")
      .select("id, title, notes, ideas, slug, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (slugParam) {
      query = query.eq("slug", slugParam);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[api/campaigns] GET error", error);
      return respond({ success: false, error: error.message }, 500);
    }

    return respond({
      success: true,
      data: {
        entries: data ?? [],
        slug: slugParam ?? null,
        userId: user.id,
      },
    });
  } catch (error) {
    console.error("[api/campaigns] GET failed", error);
    const msg =
      error instanceof Error ? error.message : "Unable to fetch saved campaigns.";
    return respond({ success: false, error: msg }, error instanceof Error && error.message === "Authentication required." ? 401 : 500);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRouteClient();
    const user = await authenticate(supabase);

    const payload = await request.json().catch(() => ({}));
    const slug = normalizeSlug(payload?.slug);
    const title = payload?.title ?? `Campaign ${new Date().toLocaleString()}`;
    const notes = payload?.notes ?? "";
    const ideas = payload?.ideas ?? "";

    if (!slug) {
      return respond({ success: false, error: "Slug is required." }, 400);
    }

    const orgId = await ensurePersonalOrganization(user.id, user.email ?? undefined);

    const { data, error } = await supabase
      .from("saved_campaigns")
      .insert({
        organization_id: orgId,
        slug,
        title,
        notes,
        ideas,
      })
      .select("id, title, notes, ideas, slug, created_at")
      .single();

    if (error) {
      console.error("[api/campaigns] POST insert error", error);
      return respond({ success: false, error: error.message }, 500);
    }

    return respond({ success: true, data: { campaign: data } });
  } catch (error) {
    console.error("[api/campaigns] POST failed", error);
    const msg = error instanceof Error ? error.message : "Unable to save campaign.";
    return respond({ success: false, error: msg }, error instanceof Error && error.message === "Authentication required." ? 401 : 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseRouteClient();
    const user = await authenticate(supabase);
    const payload = await request.json().catch(() => ({}));
    const id = payload?.id;

    if (!id) {
      return respond({ success: false, error: "Campaign id is required." }, 400);
    }

    const orgId = await ensurePersonalOrganization(user.id, user.email ?? undefined);

    const { error } = await supabase
      .from("saved_campaigns")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) {
      console.error("[api/campaigns] DELETE error", error);
      return respond({ success: false, error: error.message }, 500);
    }

    return respond({ success: true, data: { id } });
  } catch (error) {
    console.error("[api/campaigns] DELETE failed", error);
    const msg = error instanceof Error ? error.message : "Unable to delete campaign.";
    return respond({ success: false, error: msg }, error instanceof Error && error.message === "Authentication required." ? 401 : 500);
  }
}
