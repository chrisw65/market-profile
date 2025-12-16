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

    // Try to get session, but handle database connection errors
    let session;
    try {
      const { data } = await supabase.auth.getSession();
      session = data.session;
    } catch (authError) {
      logger.warn("Database connection error during auth check", authError);
      return NextResponse.json({
        found: false,
        message: "Database not configured. Please set up your .env file with Supabase credentials."
      }, { status: 404 });
    }

    if (!session?.user) {
      return NextResponse.json({
        found: false,
        message: "Authentication required to access saved profiles."
      }, { status: 404 });
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
      // Return 404 instead of 500 so client knows to just scrape
      return NextResponse.json({
        found: false,
        message: "Database error. Please check your Supabase configuration."
      }, { status: 404 });
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
    return NextResponse.json({
      found: false,
      message: "Database connection error. You can still scrape profiles without a database."
    }, { status: 404 });
  }
}
