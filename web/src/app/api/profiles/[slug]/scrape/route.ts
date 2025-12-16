import { NextResponse } from "next/server";
import { fetchCommunityProfile } from "@/lib/skool/profile";
import { scrapeClassroom, scrapeCommunity } from "@/lib/skool/service";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { ensurePersonalOrganization } from "@/lib/supabase/org";
import { normalizeSlug } from "@/lib/skool/utils";
import { loggers } from "@/lib/logger";

const logger = loggers.scraper.withContext({ endpoint: "profiles/scrape" });

export const runtime = "nodejs";

/**
 * POST /api/profiles/[slug]/scrape
 * Scrape fresh data from Skool and optionally save to database
 */
export async function POST(
  request: Request,
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
    const body = await request.json().catch(() => ({}));
    const { autoSave = true } = body;

    const supabase = await createSupabaseRouteClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    logger.info("Starting scrape", { slug, userId: session.user.id, autoSave });

    // Scrape all data in parallel
    const [profile, classroom, posts] = await Promise.all([
      fetchCommunityProfile(slug).catch((error) => {
        logger.error("Profile fetch failed", error, { slug });
        return null;
      }),
      scrapeClassroom(slug, { maxModules: 50 }).catch((error) => {
        logger.error("Classroom scrape failed", error, { slug });
        return [];
      }),
      scrapeCommunity(slug, { maxPosts: 50 }).catch((error) => {
        logger.error("Community scrape failed", error, { slug });
        return [];
      }),
    ]);

    if (!profile) {
      logger.warn("Scrape failed - no profile data", { slug });
      return NextResponse.json(
        {
          error: "Unable to load the community profile. This may be due to network issues or Skool blocking automated access. Try again in a few minutes.",
          profile: null,
          classroom,
          posts,
        },
        { status: 503 }
      );
    }

    logger.info("Scrape completed successfully", {
      slug,
      classroomCount: classroom.length,
      postsCount: posts.length
    });

    // Auto-save to database if requested
    if (autoSave) {
      try {
        const orgId = await ensurePersonalOrganization(
          session.user.id,
          session.user.email ?? undefined
        );

        const serviceSupabase = createSupabaseServiceClient();

        // Check if profile already exists
        const { data: existing } = await serviceSupabase
          .from("community_profiles")
          .select("id")
          .eq("organization_id", orgId)
          .eq("slug", slug)
          .maybeSingle();

        if (existing) {
          // Update existing profile
          await serviceSupabase
            .from("community_profiles")
            .update({
              profile,
              classroom,
              posts,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          logger.info("Profile updated in database", { slug });
        } else {
          // Insert new profile
          await serviceSupabase
            .from("community_profiles")
            .insert({
              organization_id: orgId,
              slug,
              profile,
              classroom,
              posts,
            });

          logger.info("Profile saved to database", { slug });
        }
      } catch (saveError) {
        logger.error("Failed to save profile", saveError, { slug });
        // Don't fail the request if save fails
      }
    }

    return NextResponse.json({
      success: true,
      profile,
      classroom,
      posts,
    });
  } catch (error) {
    logger.error("Scrape request failed", error, { slug });
    return NextResponse.json(
      { error: "Unable to scrape profile" },
      { status: 500 }
    );
  }
}
