import { loadSkoolPage } from "./fetcher";
import { extractClassroomModules } from "./extractors/classroom";
import { normalizeModule } from "./parsers/classroom";
import { SkoolItem } from "./schema";
import { extractCommunityPosts } from "./extractors/community";
import { normalizePost } from "./parsers/posts";
import { normalizeSlug } from "./utils";

interface ScrapeOptions {
  maxModules?: number;
}

const buildSkoolUrl = (slug: string, suffix?: string) => {
  const normalized = normalizeSlug(slug);
  if (!normalized) {
    return "";
  }
  const cleanupSuffix = suffix ? `/${suffix.replace(/^\/+/, "")}` : "";
  return `https://www.skool.com/${normalized}${cleanupSuffix}`;
};

const safeLoadPage = async (url: string) => {
  if (!url) {
    return null;
  }
  try {
    return await loadSkoolPage(url, { waitFor: 0, retries: 2 });
  } catch (error) {
    console.error(`[skool] failed to load ${url}`, error);
    return null;
  }
};

export async function scrapeClassroom(
  slug: string,
  options: ScrapeOptions = {}
): Promise<SkoolItem[]> {
  const { maxModules } = options;
  const url = buildSkoolUrl(slug, "classroom");
  const payload = await safeLoadPage(url);
  if (!payload) {
    return [];
  }
  const rawModules = extractClassroomModules(payload);
  const normalized = rawModules.map((raw) => normalizeModule(raw));
  return typeof maxModules === "number"
    ? normalized.slice(0, maxModules)
    : normalized;
}

interface CommunityOptions {
  maxPosts?: number;
}

export async function scrapeCommunity(
  slug: string,
  options: CommunityOptions = {}
): Promise<SkoolItem[]> {
  const { maxPosts } = options;
  const url = buildSkoolUrl(slug);
  const payload = await safeLoadPage(url);
  if (!payload) {
    return [];
  }
  const rawPosts = extractCommunityPosts(payload);
  const normalized = rawPosts.map((raw) => normalizePost(raw));
  return typeof maxPosts === "number"
    ? normalized.slice(0, maxPosts)
    : normalized;
}
