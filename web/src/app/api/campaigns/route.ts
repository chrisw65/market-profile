import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { ensurePersonalOrganization } from "@/lib/supabase/org";
import { normalizeSlug } from "@/lib/skool/utils";
import { validateRequest, campaignSchema, campaignDeleteSchema } from "@/lib/validation/schemas";

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

    // Validate request body
    const validation = await validateRequest(request, campaignSchema);
    if (!validation.success) {
      return respond({ success: false, error: validation.error }, 400);
    }

    const { slug, title, notes, ideas } = validation.data;
    const normalizedSlug = normalizeSlug(slug);

    if (!normalizedSlug) {
      return respond({ success: false, error: "Invalid slug format." }, 400);
    }

    const orgId = await ensurePersonalOrganization(user.id, user.email ?? undefined);

    const { data, error } = await supabase
      .from("saved_campaigns")
      .insert({
        organization_id: orgId,
        slug: normalizedSlug,
        title: title ?? `Campaign ${new Date().toLocaleString()}`,
        notes: notes ?? "",
        ideas: ideas ?? "",
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

    // Validate request body
    const validation = await validateRequest(request, campaignDeleteSchema);
    if (!validation.success) {
      return respond({ success: false, error: validation.error }, 400);
    }

    const { id } = validation.data;
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
