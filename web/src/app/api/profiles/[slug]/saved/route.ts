import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { normalizeSlug } from "@/lib/skool/utils";
import { loggers } from "@/lib/logger";

const logger = loggers.api.withContext({ endpoint: "profiles/saved" });

/**
 * GET /api/profiles/[slug]/saved
 * Load a saved profile from the database (fast, no scraping)
 */
export async function GET(
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

  try {
    const supabase = await createSupabaseRouteClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    logger.info("Loading saved profile", { slug, userId: session.user.id });

    // Load saved profile from database
    const { data, error } = await supabase
      .from("community_profiles")
      .select("profile, classroom, posts, updated_at")
      .eq("slug", slug)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error("Database error loading profile", error, { slug });
      throw error;
    }

    if (!data) {
      logger.info("No saved profile found", { slug });
      return NextResponse.json({
        found: false,
        message: "No saved profile found. Click 'Scrape Now' to fetch fresh data."
      }, { status: 404 });
    }

    logger.info("Saved profile loaded successfully", {
      slug,
      age: Date.now() - new Date(data.updated_at).getTime()
    });

    return NextResponse.json({
      found: true,
      profile: data.profile,
      classroom: data.classroom || [],
      posts: data.posts || [],
      cached_at: data.updated_at,
    });
  } catch (error) {
    logger.error("Failed to load saved profile", error, { slug });
    return NextResponse.json(
      { error: "Unable to load saved profile" },
      { status: 500 }
    );
  }
}
