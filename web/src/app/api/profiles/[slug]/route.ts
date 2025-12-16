import { fetchCommunityProfile } from "@/lib/skool/profile";
import { scrapeClassroom, scrapeCommunity } from "@/lib/skool/service";
import { normalizeSlug } from "@/lib/skool/utils";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

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
  try {
    const [profile, classroom, posts] = await Promise.all([
      fetchCommunityProfile(slug).catch((error) => {
        console.error(`[profiles] profile fetch failed for ${slug}`, error);
        return null;
      }),
      scrapeClassroom(slug, { maxModules: 50 }).catch((error) => {
        console.error("classroom scrape failed", error);
        return [];
      }),
      scrapeCommunity(slug, { maxPosts: 50 }).catch((error) => {
        console.error("community scrape failed", error);
        return [];
      }),
    ]);
    const payload: {
      profile: CommunityProfile | null;
      classroom: SkoolItem[];
      posts: SkoolItem[];
      error?: string;
    } = {
      profile,
      classroom,
      posts,
    };
    if (!profile) {
      payload.error = "Unable to load the Skool profile at this time.";
    }
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error(`[profiles] failed for ${slug}`, error);
    return NextResponse.json(
      { error: "Unable to build profile for this slug." },
      { status: 500 }
    );
  }
}
