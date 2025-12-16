import { NextResponse } from "next/server";
import { fetchCommunityProfile } from "@/lib/skool/profile";
import { scrapeClassroom, scrapeCommunity } from "@/lib/skool/service";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { ensurePersonalOrganization } from "@/lib/supabase/org";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { normalizeSlug } from "@/lib/skool/utils";

export async function POST(
  _request: Request,
  { params }: { params: { slug: string } | Promise<{ slug: string }> }
) {
  const resolved = await params;
  const slugParam = resolved?.slug;
  if (!slugParam) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }
  const slug = normalizeSlug(slugParam);
  if (!slug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  const supabase = await createSupabaseRouteClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const [profile, classroom, posts] = await Promise.all([
      fetchCommunityProfile(slug).catch((error) => {
        console.error(`[profiles.save] profile fetch failed for ${slug}`, error);
        return null;
      }),
      scrapeClassroom(slug, { maxModules: 50 }).catch((error) => {
        console.error(`[profiles.save] classroom scrape failed for ${slug}`, error);
        return [];
      }),
      scrapeCommunity(slug, { maxPosts: 50 }).catch((error) => {
        console.error(`[profiles.save] community scrape failed for ${slug}`, error);
        return [];
      }),
    ]);

    if (!profile) {
      return NextResponse.json(
        { error: "Unable to load the community profile right now." },
        { status: 503 }
      );
    }

    const orgId = await ensurePersonalOrganization(
      session.user.id,
      session.user.email ?? undefined
    );

    const serviceSupabase = createSupabaseServiceClient();
    const { error } = await serviceSupabase.from("community_profiles").insert({
      organization_id: orgId,
      slug,
      profile,
      classroom,
      posts,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[profiles.save] failed for ${slug}`, error);
    return NextResponse.json(
      { error: "Unable to save profile to workspace." },
      { status: 500 }
    );
  }
}
