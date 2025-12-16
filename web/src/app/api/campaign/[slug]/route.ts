import { fetchCommunityProfile } from "@/lib/skool/profile";
import { scrapeClassroom, scrapeCommunity } from "@/lib/skool/service";
import { generateCampaignIdeas } from "@/lib/ai/provider";
import { NextResponse } from "next/server";
import { normalizeSlug } from "@/lib/skool/utils";

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
  if (!slug) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    const [profile, classroom, posts] = await Promise.all([
      fetchCommunityProfile(slug).catch((error) => {
        console.error(`[campaign] profile fetch failed for ${slug}`, error);
        return null;
      }),
      scrapeClassroom(slug, { maxModules: 5 }).catch((error) => {
        console.error(`[campaign] classroom scrape failed for ${slug}`, error);
        return [];
      }),
      scrapeCommunity(slug, { maxPosts: 5 }).catch((error) => {
        console.error(`[campaign] community scrape failed for ${slug}`, error);
        return [];
      }),
    ]);

    const classroomTitles = classroom.map((mod) => mod.title || mod.name).filter(Boolean);
    const postHooks = posts.map((post) => post.title || post.postTitle || "").filter(Boolean);

    const hero =
      profile?.value_stack.promise ?? profile?.community.hero_statement ?? "Community insights unavailable";
    const valueStack = profile?.value_stack ?? {
      promise: hero,
      experience: [],
      next_steps: [],
    };
    const keywords = profile?.keywords ?? [];

    const ideas = await generateCampaignIdeas({
      slug,
      hero,
      valueStack,
      keywords,
      classroomTitles,
      postHooks,
    });

    const responsePayload: { ideas: string; warning?: string } = { ideas };
    if (!profile) {
      responsePayload.warning = "Live profile data temporarily unavailable.";
    }

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    console.error(`[campaign] failed for ${slug}`, error);
    return NextResponse.json(
      { error: "Unable to generate campaign ideas." },
      { status: 500 }
    );
  }
}
